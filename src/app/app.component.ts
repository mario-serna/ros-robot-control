import { Component, ViewChild } from '@angular/core';
import { Nav, Platform } from 'ionic-angular';
import { StatusBar } from '@ionic-native/status-bar';
import { SplashScreen } from '@ionic-native/splash-screen';

import { HomePage } from '../pages/home/home';
import { AlgorithmsPage } from '../pages/algorithms/algorithms';
import { SettingsPage } from '../pages/settings/settings';

@Component({
  templateUrl: 'app.html'
})
export class MyApp {
  @ViewChild(Nav) nav;

  rootPage: any = AlgorithmsPage;

  pages: Array<{ title: string, component: any, icon: string, action?: string }>;

  constructor(
    public platform: Platform,
    public statusBar: StatusBar,
    public splashScreen: SplashScreen,
  ) {
    this.initializeApp();

    // used for an example of ngFor and navigation
    this.pages = [
      { title: 'Pioneer Control', component: HomePage, icon: 'game-controller-a' },
      { title: 'Algorithms', component: AlgorithmsPage, icon: 'bug' },
      { title: 'Settings', component: SettingsPage, icon: 'settings' }
    ];
  }

  initializeApp() {
    this.platform.ready().then(() => {
      // Okay, so the platform is ready and our plugins are available.
      // Here you can do any higher level native things you might need.
      this.statusBar.styleDefault();
      this.splashScreen.hide();
    });
  }

  openPage(page) {
    // Reset the content nav to have just this page
    // we wouldn't want the back button to show in this scenario
    if (page.action) {
      this[page.action]();
    }
    if (page.title === 'Settings') {
      this.nav.push(SettingsPage);
    } else {
      this.nav.setRoot(page.component);
    }
  }
}

