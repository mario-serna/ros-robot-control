import { BrowserModule } from '@angular/platform-browser';
import { ErrorHandler, NgModule } from '@angular/core';
import { IonicApp, IonicErrorHandler, IonicModule } from 'ionic-angular';
import { SplashScreen } from '@ionic-native/splash-screen';
import { StatusBar } from '@ionic-native/status-bar';
import { HttpModule } from '@angular/http';
import { IonicStorageModule } from '@ionic/storage';
import { SQLite } from '@ionic-native/sqlite';
import { SQLitePorter } from '@ionic-native/sqlite-porter';

import { MyApp } from './app.component';
import { HomePage } from '../pages/home/home';
import { AlgorithmsPage } from '../pages/algorithms/algorithms';
import { SettingsPage } from '../pages/settings/settings';
import { RunInfoModalPage } from '../pages/run-info-modal/run-info-modal';

import { DatabaseProvider } from '../providers/database/database';
import { RosProvider } from '../providers/ros/ros';
import { DirectivesModule } from '../directives/directives.module';

@NgModule({
  declarations: [
    MyApp,
    HomePage,
    AlgorithmsPage,
    SettingsPage,
    RunInfoModalPage
  ],
  imports: [
    BrowserModule,
    HttpModule,
    DirectivesModule,
    IonicStorageModule.forRoot(),
    IonicModule.forRoot(MyApp,{
      scrollPadding: false,
      scrollAssist: true
    })
  ],
  bootstrap: [IonicApp],
  entryComponents: [
    MyApp,
    HomePage,
    AlgorithmsPage,
    SettingsPage,
    RunInfoModalPage
  ],
  providers: [
    StatusBar,
    SplashScreen,
    { provide: ErrorHandler, useClass: IonicErrorHandler },
    DatabaseProvider,
    SQLite,
    SQLitePorter,
    RosProvider
  ]
})
export class AppModule { }
