import { Http } from '@angular/http';
import { Injectable } from '@angular/core';
import { AsyncSubject } from 'rxjs/AsyncSubject';
import { AlertController, LoadingController, ToastController } from 'ionic-angular';
import { DatabaseProvider } from '../database/database';

declare var ROSLIB: any;
declare var ROS3D: any;
declare var MJPEGCANVAS: any;

interface nodeStateType {
  node_state_desc: string;
  node_state: number;
  node_state_time: number;
  bug_state_desc: string;
  algorithm: number;
  bug_state: number;
  bug_state_time: number;
};

interface algorithmStateType {
  algorithm: number;
  name: string;
  pose_x: number;
  pose_y: number;
  yaw: number;
  initial_to_goal_distance: number;
  current_to_goal_distance: number;
  best_distance: number;
  path_length: number;
  time: number;
};

/*
  Generated class for the RosProvider provider.

  See https://angular.io/guide/dependency-injection for more info on providers
  and Angular DI.
*/
@Injectable()
export class RosProvider {

  ros: any;
  viewer: any;

  // Marker visualization
  marker_viewer: any;
  tfClient: any;
  markerClient: any;
  laserScanClient: any;

  camera: any;
  cmdVel: any;
  twist: any;
  maxVel: number;
  defaultVel: number;
  vel: number;
  service: any;
  serviceRespose: any;
  nodeStateSub: any;
  nodeState: any;
  algorithmStateSub: any;
  algorithmState: algorithmStateType;

  runInfo: Array<nodeStateType>;

  bugServiceRequest = {
    algorithm: 0,
    velocity: 0.3,
    initial_x: 0,
    initial_y: 0,
    desired_x: 0,
    desired_y: 0,
    simulation: true,
    reverse: false,
    choose: false
  };

  rosWS_URL;
  rosWS_Port;
  rosWS_Topic_Vel;
  rosWS_Topic_Cam;
  rosWS_Topic_Sensor;
  rosWS_Topic_Odom;

  //public connection: BehaviorSubject<number> = new BehaviorSubject<number>(0);
  public connection: AsyncSubject<number> = new AsyncSubject<number>();

  // This variable avoids showing the prompAlert twice
  isFirstTime: boolean;
  count: number;
  loadingInit;
  loadingConnect;
  promptAlert;

  constructor(
    public http: Http,
    private alertCtrl: AlertController,
    private loadingCtrl: LoadingController,
    private toastCtrl: ToastController,
    public database: DatabaseProvider
  ) {
    this.viewer = undefined;
    this.marker_viewer = undefined;
    this.runInfo = [];
    this.isFirstTime = true;
    this.count = 0;
    this.nodeState = {
      node_state_desc: "Not available",
      node_state: -1,
      bug_state_desc: "",
      algorithm: 0,
      bug_state: 0
    };
    this.algorithmState = {
      algorithm: -1,
      name: '',
      pose_x: 0,
      pose_y: 0,
      yaw: 0,
      initial_to_goal_distance: 0,
      current_to_goal_distance: 0,
      best_distance: 0,
      path_length: 0,
      time: 0
    }
    this.presentLoadingInit();
  }

  rosWSInit() {
    console.log('Ros init');
    this.viewer = undefined;
    this.marker_viewer = undefined;

    this.ros = new ROSLIB.Ros({
      url: `ws://${this.rosWS_URL.optValue}:${this.rosWS_Port.optValue}`
    });

    this.ros.on('connection', () => {
      console.log('Connected to websocket server.');
      this.count = 0;
      this.connection.next(1);
      this.connection.complete();
      this.dismissLoadingConnect();
    });

    this.ros.on('error', (error) => {
      console.log('Error connecting to websocket server: ', JSON.stringify(error));
      this.connection.next(-1);
      this.connection.complete();
      this.dismissLoadingConnect();
    });
  }

  rosWSTopicInit() {
    console.log("Init WS topics")
    this.nodeStateSub = new ROSLIB.Topic({
      ros: this.ros,
      name: '/bugServer/bugNodeState',
      messageType: 'bug_algorithms/nodeState'
    });

    this.algorithmStateSub = new ROSLIB.Topic({
      ros: this.ros,
      name: '/bugServer/algorithmState',
      messageType: 'bug_algorithms/algorithmState'
    });

    this.nodeStateSub.subscribe((message: nodeStateType) => {
      let len = this.runInfo.length;

      this.nodeState = message;

      if (len == 0) {
        this.runInfo = [];
        if(message.node_state > 0)
          this.runInfo.push(message);
      } else {
        let bugState = this.runInfo[len - 1].bug_state;
        let nodeState = this.runInfo[len - 1].node_state;
        if (nodeState != message.node_state || bugState != message.bug_state) {
          this.runInfo.push(message);
        }
      }
      //console.log(JSON.stringify(message));
    });

    this.algorithmStateSub.subscribe((message: algorithmStateType) => {
      this.algorithmState = message;
      //console.log(JSON.stringify(message));
    });

    this.cmdVel = new ROSLIB.Topic({
      ros: this.ros,
      name: this.rosWS_Topic_Vel.optValue,
      messageType: 'geometry_msgs/Twist'
    });

    this.twist = new ROSLIB.Message({
      linear: {
        x: 0.0,
        y: 0.0,
        z: 0.0
      },
      angular: {
        x: 0.0,
        y: 0.0,
        z: 0.0
      }
    });

    this.maxVel = 0.5;
    this.defaultVel = 3;
    this.vel = this.defaultVel / 10;
  }

  loadSettings() {
    if (this.ros) {
      console.log('ROS WS Disconnecting...');
      this.ros.close();
    }

    this.connection = new AsyncSubject();

    this.connection.subscribe(con => {
      if (con == 1) {
        this.rosWSTopicInit();
        console.log("Initializing topics");
      }
    });

    this.database.getSettings().then(data => {
      this.rosWS_URL = data[0];
      this.rosWS_Port = data[1];
      this.rosWS_Topic_Vel = data[2];
      this.rosWS_Topic_Cam = data[3];
      this.rosWS_Topic_Sensor = data[4];
      this.rosWS_Topic_Odom = data[5];

      this.presentLoadingConnect();
      this.rosWSInit();
    });
  }

  shutdown() {
    this.ros.on('close', function () {
      console.log('Connection to websocket server closed.');
    });
  }

  stop() {
    this.twist = {
      linear: {
        x: 0.0,
        y: 0.0,
        z: 0.0
      },
      angular: {
        x: 0.0,
        y: 0.0,
        z: 0.0
      }
    };
    this.cmdVel.publish(this.twist);
  }

  forward() {
    this.twist = {
      linear: {
        x: this.vel,
        y: 0.0,
        z: 0.0
      },
      angular: {
        x: 0.0,
        y: 0.0,
        z: 0.0
      }
    };
    this.cmdVel.publish(this.twist);
  }

  backward() {
    this.twist = {
      linear: {
        x: -this.vel,
        y: 0.0,
        z: 0.0
      },
      angular: {
        x: 0.0,
        y: 0.0,
        z: 0.0
      }
    };
    this.cmdVel.publish(this.twist);
  }

  left() {
    this.twist = {
      linear: {
        x: 0.0,
        y: 0.0,
        z: 0.0
      },
      angular: {
        x: 0.0,
        y: 0.0,
        z: this.vel
      }
    };
    this.cmdVel.publish(this.twist);
  }

  right() {
    this.twist = {
      linear: {
        x: 0.0,
        y: 0.0,
        z: 0.0
      },
      angular: {
        x: 0.0,
        y: 0.0,
        z: -this.vel
      }
    };
    this.cmdVel.publish(this.twist);
  }

  callServiceInitBug() {
    this.runInfo = [];

    this.bugServiceRequest.algorithm = Number(this.bugServiceRequest.algorithm);
    this.bugServiceRequest.velocity = Number(this.bugServiceRequest.velocity);
    this.bugServiceRequest.initial_x = Number(this.bugServiceRequest.initial_x);
    this.bugServiceRequest.initial_y = Number(this.bugServiceRequest.initial_y);
    this.bugServiceRequest.desired_x = Number(this.bugServiceRequest.desired_x);
    this.bugServiceRequest.desired_y = Number(this.bugServiceRequest.desired_y);
    this.bugServiceRequest.simulation = Number(this.bugServiceRequest.simulation) == 1 ? true : false;
    this.bugServiceRequest.reverse = Number(this.bugServiceRequest.reverse) == 1 ? true : false;
    this.bugServiceRequest.choose = Number(this.bugServiceRequest.choose) == 1 ? true : false;

    this.presentToast("Calling BugService");
    console.log(JSON.stringify(this.bugServiceRequest));
    this.service = new ROSLIB.Service({
      ros: this.ros,
      name: "/bugServer/initBugAlg",
      serviceType: 'bug_algorithms/bugService'
    });

    let request = new ROSLIB.ServiceRequest(this.bugServiceRequest);

    this.service.callService(request, (response) => {
      console.log(JSON.stringify(response));
      this.presentToast(response.message);
      this.serviceRespose = response.success;
      console.log(JSON.stringify(this.runInfo));

      if (this.runInfo.length > 0) {
        if (this.runInfo[0].node_state == 0) {
          this.runInfo.pop();
        }
      }
    }, (err) => {
      console.log(JSON.stringify(err));
      this.presentToast(err);
      this.serviceRespose = false;
    });

  }

  callBugNodeStateSwitch(state: number) {
    this.bugServiceRequest.algorithm = Number(this.bugServiceRequest.algorithm);

    console.log("Calling BugNodeStateSwitch");

    this.service = new ROSLIB.Service({
      ros: this.ros,
      name: "/bugServer/bugNodeStateSwitch",
      serviceType: 'bug_algorithms/bugSwitch'
    });

    let request = new ROSLIB.ServiceRequest({
      algorithm: this.bugServiceRequest.algorithm,
      state: state
    });

    this.service.callService(request, (response) => {
      console.log(JSON.stringify(response));
      this.presentToast(response.message);
    }, (err) => {
      console.log(JSON.stringify(err));
      this.presentToast(err);
    });

  }

  showCamera(width, height, quality = 20) {
    // These operations keep the image size ratio
    if (width > height) {
      let temp = width;
      width = height + 25;
      height = temp - 25;
    }

    height = ((width - 32) * 480) / 640;
    width = width - 32;

    if (this.viewer === undefined) {
      this.viewer = new MJPEGCANVAS.Viewer({
        divID: 'image',
        host: this.rosWS_URL.optValue,
        width: width,
        height: height,
        quality: quality,
        refreshRate: 60,
        topic: this.rosWS_Topic_Cam.optValue
      });
    } else {
      // Remove canvas and create a new one
      /*let elem = document.getElementById("image");
      elem.removeChild(elem.childNodes[0]);
      this.viewer = new MJPEGCANVAS.Viewer({
        divID: 'image',
        host: this.rosWS_URL.optValue,
        width: width,
        height: height,
        quality: quality,
        refreshRate: 60,
        topic: this.rosWS_Topic_Cam.optValue
      });*/
      // This only change the image quality and the topic
      this.viewer.quality = quality;
      this.viewer.changeStream(this.rosWS_Topic_Cam.optValue);
    }
  }

  showMarkers(width, height, fixedFrame = "odom") {
    // These operations keep the image size ratio
    if (width > height) {
      let temp = width;
      width = height + 25;
      height = temp - 25;
    }

    console.log(fixedFrame);

    height = ((width - 32) * 480) / 640;
    width = width - 32;

    if (this.marker_viewer === undefined) {
      // Create the main viewer.
      // Set directionalLight in the ros3d.min.js from top to down
      // directionalLight.position.set(0,0,1)
      // Change THREE.LineBasicMaterial({size:c.scale.x}) to THREE.LineBasicMaterial()
      // Size is not a property of THREE.LineBasicMaterial
      // Remove useScreenCoordinates in new THREE$1.SpriteMaterial({
      //map: texture,
      // NOTE: This is needed for THREE.js r61, unused in r70
      //useScreenCoordinates: false });
      this.marker_viewer = new ROS3D.Viewer({
        divID: 'markers',
        width: width,
        height: height,
        background: '#ffffff',
        intensity: 1.0,
        cameraPose: { x: 0, y: 0, z: 20 },
        cameraZoomSpeed: 1,
        antialias: true
      });
    }

    // Add a simple grid
    this.marker_viewer.addObject(new ROS3D.Grid({ num_cells: 20 }));

    // Setup a client to listen to TFs.
    this.tfClient = new ROSLIB.TFClient({
      ros: this.ros,
      angularThres: 0.01,
      transThres: 0.01,
      rate: 10.0,
      fixedFrame: `/${fixedFrame}`
    });

    // Setup the marker client.
    this.markerClient = new ROS3D.MarkerClient({
      ros: this.ros,
      tfClient: this.tfClient,
      topic: '/visualization_marker',
      rootObject: this.marker_viewer.scene
    });
  }

  hideMarkers() {
    console.log("Turning off markers");
    this.markerClient.unsubscribe();
    if (this.laserScanClient)
      this.laserScanClient.unsubscribe();

    let elem = document.getElementById("markers");
    if (elem.childNodes.length > 0) {
      console.log("Removing canvas: ", elem.childNodes.length);
      elem.removeChild(elem.childNodes[0]);
    }
    this.marker_viewer = undefined;
  }

  changeNamespace(ns: string) {
    if (this.markerClient) {
      console.log("Changing namespace to ", ns);
      this.markerClient.namespace = ns;
    }

  }

  setLaserClientSubscribe(val: number) {
    if (this.laserScanClient) {
      if (val == 0) {
        console.log("Laser unsubscribe : ", this.marker_viewer.scene.children.length);
        //this.marker_viewer.scene.remove.apply(this.marker_viewer.scene, this.marker_viewer.scene.children);
        this.laserScanClient.unsubscribe();
        this.laserScanClient = undefined;
      } else if (val == 1) {
        console.log("Laser subscribe");
        this.laserScanClient.subscribe();
      }
    } else {
      let sim = Number(this.bugServiceRequest.simulation) == 1 ? true : false;
      let topic = sim ? '/p3dx/laser/scan' : '/scan';

      // Setup the marker client.
      this.laserScanClient = new ROS3D.LaserScan({
        ros: this.ros,
        tfClient: this.tfClient,
        topic: topic,
        material: { color: '#000000', size: 0.2 },
        pointRatio: 10,
        messageRatio: 3,
        rootObject: this.marker_viewer.scene
      });
    }

  }

  showPrompt(status: number) {
    // status : 0 error | 1 success
    const title = ["ROS WS Error!", "ROS WS"];

    const message = [
      "The ROS WS is not available. Do you want to change the ROS WS Url?",
      "The ROS WS is available!"
    ];

    this.promptAlert = this.alertCtrl.create({
      title: title[status],
      message: message[status],
      inputs: [
        {
          name: 'rosWS_URL',
          label: 'ROS WS Url',
          placeholder: 'ROS WS Url',
          value: this.rosWS_URL.optValue
        },
        {
          name: 'rosWS_Port',
          label: 'ROS WS Port',
          placeholder: 'ROS WS Port',
          value: this.rosWS_Port.optValue
        },
      ],
      buttons: [
        {
          text: 'Cancel',
          handler: data => {
            console.log('Cancel clicked');
            //console.log(JSON.stringify(data));
          }
        },
        {
          text: 'Save',
          handler: data => {
            this.rosWS_URL.optValue = data.rosWS_URL;
            this.rosWS_Port.optValue = data.rosWS_Port;
            this.database.setROSWSSetting(this.rosWS_URL.id, this.rosWS_URL.optValue);
            this.database.setROSWSSetting(this.rosWS_Port.id, this.rosWS_Port.optValue);
            // console.log(JSON.stringify(data));
            this.loadSettings();
          }
        }
      ]
    });
    this.promptAlert.present();
  }

  presentLoadingInit() {
    this.loadingInit = this.loadingCtrl.create({
      content: `Please wait...`
    });

    this.loadingInit.present();
  }

  dismissLoadingConnect() {
    if (this.loadingConnect) {
      this.loadingConnect.dismiss();
      this.loadingConnect = null;
    }
  }

  presentLoadingConnect() {
    if (this.loadingInit) {
      this.loadingInit.dismiss();
      this.loadingInit = null;
    }

    //this.dismissLoadingConnect();

    this.loadingConnect = this.loadingCtrl.create({
      content: `Trying to connect to ${this.rosWS_URL.optValue}:${this.rosWS_Port.optValue}`,
      enableBackdropDismiss: true
    });

    this.loadingConnect.onDidDismiss(() => {
      console.log("Loading Connection dismissed");
      this.loadingConnect = null;
    });

    this.loadingConnect.present();
  }

  presentToast(message) {
    let toast = this.toastCtrl.create({
      message: message,
      duration: 3000
    });
    toast.present();
  }

  // Refreser function
  doRefresh(refresher) {
    this.loadSettings();
    refresher.complete();
  }
}
