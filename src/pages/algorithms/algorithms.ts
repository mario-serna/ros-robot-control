import { Component, ViewChild, ElementRef, OnInit, OnDestroy } from '@angular/core';
import { Platform, NavController, AlertController, LoadingController, ModalController } from 'ionic-angular';
import { DatabaseProvider } from '../../providers/database/database';
import { RosProvider } from '../../providers/ros/ros';
import { RunInfoModalPage } from './../run-info-modal/run-info-modal';

/**
 * Generated class for the AlgorithmsPage page.
 *
 * See https://ionicframework.com/docs/components/#navigation for more info on
 * Ionic pages and navigation.
 */

@Component({
  selector: 'page-algorithms',
  templateUrl: 'algorithms.html',
})
export class AlgorithmsPage implements OnInit, OnDestroy {

  @ViewChild("image") inputChild: ElementRef;

  showCamera = false;
  showMarker = false;
  isStop: boolean;
  disable: boolean;
  isActive: boolean;
  opt: string;

  inputTemp: any;

  width;
  height;
  quality;
  fixed_frame;

  constructor(
    public platform: Platform,
    public navCtrl: NavController,
    public alertCtrl: AlertController,
    public loadingCtrl: LoadingController,
    public modalCtrl: ModalController,
    public database: DatabaseProvider,
    public rosProvider: RosProvider
  ) {
    this.quality = 25;
    this.fixed_frame = "odom";
    this.opt = "info";
    this.isStop = false;
    this.isActive = false;
    this.disable = false;
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
        console.log('Algorithms Ready: ', ready);
        this.rosProvider.loadSettings();
      }
    });
  }

  presentRunInfoModal() {
    let runInfoModal = this.modalCtrl.create(RunInfoModalPage, { data: this.rosProvider.runInfo });
    runInfoModal.present();
  }

  checkOpt() {
    console.log("Changed!")
    if (this.rosProvider.bugServiceRequest.algorithm == 1) {
      this.disable = true;
      this.rosProvider.bugServiceRequest.reverse = false;
      this.rosProvider.bugServiceRequest.choose = false;
    } else if (this.rosProvider.bugServiceRequest.algorithm == 6) {
      this.disable = true;
      this.rosProvider.bugServiceRequest.reverse = false;
      this.rosProvider.bugServiceRequest.choose = true;
    } else {
      this.disable = false;
    }
  }

  moveFocus(nextElement) {
    nextElement.setFocus();
  }

  showROSCamera() {
    this.width = this.platform.width();
    this.height = this.platform.height();
    console.log("Widht: ", this.width, "| Height: ", this.height);

    this.rosProvider.showCamera(this.width, this.height, this.quality);
  }

  showROSMarkers() {
    this.width = this.platform.width();
    this.height = this.platform.height();
    console.log("Widht: ", this.width, "| Height: ", this.height);

    this.rosProvider.showMarkers(this.width, this.height, this.fixed_frame);
  }

  ngOnDestroy() {
    this.rosProvider.shutdown();
  }

}
