import { Platform } from 'ionic-angular';
import { SQLitePorter } from '@ionic-native/sqlite-porter';
import { SQLite, SQLiteObject } from '@ionic-native/sqlite';
import { Storage } from '@ionic/storage';
import { Http } from '@angular/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import 'rxjs/add/operator/map';

/*
  Generated class for the DatabaseProvider provider.

  See https://angular.io/guide/dependency-injection for more info on providers
  and Angular DI.
*/
@Injectable()
export class DatabaseProvider {

  database: SQLiteObject;
  private databaseReady: BehaviorSubject<boolean>;

  constructor(
    public http: Http,
    public sqlite: SQLite,
    public sqlitePorter: SQLitePorter,
    public storage: Storage,
    public platform: Platform
  ) {
    this.databaseReady = new BehaviorSubject(false);
    this.platform.ready().then(() => {
      this.sqlite.create({
        name: 'data',
        location: 'default'
      })
        .then((db: SQLiteObject) => {
          this.database = db;
          this.storage.get('database_filled').then(val => {
            // console.log('Val: ', val);
            if (val) {
              this.databaseReady.next(true);
              // console.log('DB Filled');
              this.getSettings();
            } else {
              this.fillDatabase();
              // console.log('DB OK');
            }
          });
        });
    });
  }

  fillDatabase() {
    this.http.get('assets/dummyData.sql')
      .map(res => res.text())
      .subscribe(sql => {
        // console.log('Sql: ', sql);
        this.sqlitePorter.importSqlToDb(this.database, sql)
          .then(data => {
            this.databaseReady.next(true);
            this.storage.set('database_filled', true);
            // console.log('Filling DB');
          })
          .catch(e => console.log('Error fillDatabase: ', JSON.stringify(e)));
      });

  }

  getDatabaseState() {
    return this.databaseReady.asObservable();
  }

  setROSWSSetting(id: number, val: string) {
    let sql = "UPDATE Settings SET optValue = ? WHERE id = ?";
    this.database.executeSql(sql, [val, id]).then((response) => {
      // console.log(response);
      return response;
    });
  }

  getSettings(): any {
    let sql = "SELECT * FROM Settings";
    let settings = [];
    return this.database.executeSql(sql, []).then((data) => {
      if (data.rows.length > 0) {
        for (let i = 0; i < data.rows.length; i++) {
          settings.push(
            {
              id: data.rows.item(i).id,
              optName: data.rows.item(i).optName,
              optValue: data.rows.item(i).optValue
            });
        }
        // console.log('Rows: ', data.rows.length);
      }
      // console.log('Query: ', JSON.stringify(settings));
      return settings;
    }, err => {
      console.log('Error getSettings: ', JSON.stringify(err));
      return [];
    });
  }

  cleanDB() {
    this.http.get('assets/dropData.sql')
      .map(res => res.text())
      .subscribe(sql => {
        console.log('Sql: ', sql);
        this.sqlitePorter.importSqlToDb(this.database, sql)
          .then(data => {
            this.databaseReady.next(false);
            this.storage.set('database_filled', false);
            console.log('DB Dropped');
          })
          .catch(e => console.log('Error drop DB: ', JSON.stringify(e)));
      });
  }
}
