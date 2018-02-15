import { Http } from '@angular/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { AlertController, LoadingController } from 'ionic-angular';
import { DatabaseProvider } from '../database/database';

declare var ROSLIB: any;
// declare var ROS2D: any;
declare var MJPEGCANVAS: any;

/*
  Generated class for the RosProvider provider.

  See https://angular.io/guide/dependency-injection for more info on providers
  and Angular DI.
*/
@Injectable()
export class RosProvider {

  ros: any;
  viewer: any;
  camera: any;
  cmdVel: any;
  twist: any;
  maxVel: number;
  vel: number;

  rosWS_URL;
  rosWS_Port;
  rosWS_Topic_Vel;
  rosWS_Topic_Cam;
  rosWS_Topic_Sensor;
  rosWS_Topic_Odom;

  public connection: BehaviorSubject<boolean>;

  // This variable avoids showing the prompAlert twice
  count: number;
  loadingInit;
  loadingConnect;

  constructor(
    public http: Http,
    private alertCtrl: AlertController,
    private loadingCtrl: LoadingController,
    public database: DatabaseProvider
  ) {
    this.count = 0;
    this.presentLoadingInit();
  }

  rosWSInit() {
    console.log('Ros init');

    this.ros = new ROSLIB.Ros({
      url: `ws://${this.rosWS_URL.optValue}:${this.rosWS_Port.optValue}`
    });

    this.ros.on('connection', () => {
      this.count = 0;
      this.connection.next(true);
      console.log('Connected to websocket server.');
      this.loadingConnect.dismiss();
    });

    this.ros.on('error', (error) => {
      this.connection.next(false);
      console.log('Error connecting to websocket server: ', error);
      this.loadingConnect.dismiss();
    });
  }

  rosWSTopicInit() {
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

    this.maxVel = 1;
    this.vel = 0.1;
  }

  loadSettings() {
    if (this.ros) {
      console.log('ROS WS Disconnecting...');
      this.ros.close();
    }
    this.database.getSettings().then(data => {
      this.rosWS_URL = data[0];
      this.rosWS_Port = data[1];
      this.rosWS_Topic_Vel = data[2];
      this.rosWS_Topic_Cam = data[3];
      this.rosWS_Topic_Sensor = data[4];
      this.rosWS_Topic_Odom = data[5];

      this.presentLoadingConnect();
      this.rosWSInit();

      this.connection.asObservable().subscribe(con => {
        if (con) {
          this.rosWSTopicInit();
        } else {
          if (this.count > 0) {
            this.showPrompt(0);
          }
          this.count++;
        }
      });
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

  showCamera(width, height) {
    if (this.viewer === undefined) {
      this.viewer = new MJPEGCANVAS.Viewer({
        divID: 'image',
        host: this.rosWS_URL.optValue,
        width: width,
        height: height,
        quality: 10,
        refreshRate: 60,
        topic: this.rosWS_Topic_Cam.optValue
      });
    }
  }

  showAlert() {
    let alert = this.alertCtrl.create({
      title: 'ROS WS Connection success!',
      subTitle: 'The ROS WS is available!',
      buttons: ['OK']
    });
    alert.present();
  }

  showPrompt(status: number) {
    // status : 0 error | 1 success
    const title = ["ROS WS Error!", "ROS WS"];

    const message = [
      "The ROS WS is not available. Do you want to change the ROS WS Url?",
      "The ROS WS is available!"
    ];

    let prompt = this.alertCtrl.create({
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
            this.presentLoadingConnect();
            if (this.ros) {
              console.log('ROS WS Disconnecting...');
              this.ros.close();
            }
            this.rosWSInit();
          }
        }
      ]
    });
    prompt.present();
  }

  presentLoadingInit() {
    this.loadingInit = this.loadingCtrl.create({
      content: `Please wait...`
    });

    this.loadingInit.present();
  }

  presentLoadingConnect() {
    if (this.loadingInit) {
      this.loadingInit.dismiss();
    }
    this.loadingConnect = this.loadingCtrl.create({
      content: `Trying to connect to ${this.rosWS_URL.optValue}:${this.rosWS_Port.optValue}`
    });

    this.loadingConnect.present();
  }
}
