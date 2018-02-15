import { Component, OnInit, OnDestroy } from '@angular/core';
import { Platform, NavController, AlertController, LoadingController } from 'ionic-angular';
import { DatabaseProvider } from '../../providers/database/database';
import { RosProvider } from '../../providers/ros/ros';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';

@Component({
  selector: 'page-home',
  templateUrl: 'home.html'
})
export class HomePage implements OnInit, OnDestroy {

  showCamera = false;
  isStop: boolean;

  width;
  height;

  constructor(
    public platform: Platform,
    public navCtrl: NavController,
    public alertCtrl: AlertController,
    public loadingCtrl: LoadingController,
    public database: DatabaseProvider,
    public rosProvider: RosProvider
  ) {
    this.rosProvider.connection = new BehaviorSubject(false);
    this.isStop = false;
    platform.ready().then((readySource) => {
      this.width = this.platform.width();
      this.height = this.platform.height();
    });
  }

  ngOnInit() {
  }

  ionViewDidLoad() {
    this.database.getDatabaseState().subscribe(ready => {
      if (ready) {
        console.log('Home Ready: ', ready);
        this.rosProvider.loadSettings();
      }
    });
  }

  showROSCamera() {
    let height = ((this.width - 32) * 480) / 640;
    this.rosProvider.showCamera(this.width - 32, height);
  }

  stop() {
    this.isStop = this.isStop ? false : true;
    this.rosProvider.stop();
  }

  ngOnDestroy() {
    this.rosProvider.ros.on('close', function () {
      console.log('Connection to websocket server closed.');
    });
  }

}
