import { Component } from '@angular/core';
import { NavController, NavParams, ViewController } from 'ionic-angular';

/**
 * Generated class for the RunInfoModalPage page.
 *
 * See https://ionicframework.com/docs/components/#navigation for more info on
 * Ionic pages and navigation.
 */

@Component({
  selector: 'page-run-info-modal',
  templateUrl: 'run-info-modal.html',
})
export class RunInfoModalPage {

  data: Array<any>;

  algorithms = ["Bug0", "Bug1", "Bug2", "DistBug", "Intelligent-Bug", "Intensitive-Bug", "TangentBug", "PointBug"];
  stateIcon = ["clock", "play", "navigate", "pause", "flag"];

  constructor(
    public navCtrl: NavController,
    public navParams: NavParams,
    public viewCtrl: ViewController
  ) {
    //console.log('User: ', navParams.get('userId'));
    this.data = navParams.get('data');
  }

  ionViewDidLoad() {
    console.log('ionViewDidLoad RunInfoModalPage');
  }

  closeModal() {
    this.viewCtrl.dismiss();
  }

}
