import { Component } from '@angular/core';
import { NavController, NavParams } from 'ionic-angular';
import { DatabaseProvider } from '../../providers/database/database';
import { RosProvider } from '../../providers/ros/ros';

/**
 * Generated class for the SettingsPage page.
 *
 * See https://ionicframework.com/docs/components/#navigation for more info on
 * Ionic pages and navigation.
 */

@Component({
  selector: 'page-settings',
  templateUrl: 'settings.html',
})
export class SettingsPage {

  settings = [];

  constructor(
    public navCtrl: NavController,
    public navParams: NavParams,
    public database: DatabaseProvider,
    public rosProvider: RosProvider
  ) {
  }

  ionViewDidLoad() {
    this.database.getDatabaseState().subscribe(ready => {
      if (ready) {
        console.log('Ready: ', ready);
        this.loadSettings();
      }
    });
  }

  loadSettings() {
    console.log('Loading settings...');
    this.database.getSettings().then(data => {
      this.settings = data;
      console.log('Settings: ', JSON.stringify(data));
    }, err => {
      console.log('Error loadSettings: ', err);
    });
  }

  save() {
    this.settings.forEach(setting => {
      this.database.setROSWSSetting(setting.id, setting.optValue);
    });
    // console.log(JSON.stringify(data));
    this.rosProvider.loadSettings();
  }

  resetDB() {
    this.database.cleanDB();
  }

  viewDB() {
    this.database.getSettings().then(data => {
      this.settings = data;
      console.log('Settings: ', JSON.stringify(data));
    });//.catch(e => console.log('Error view: ', e));
  }

}
