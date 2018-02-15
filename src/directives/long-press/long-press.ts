import { Directive, ElementRef, EventEmitter, Input, OnDestroy, OnInit, OnChanges, SimpleChange, Output, NgZone } from '@angular/core';
import { Gesture } from 'ionic-angular/gestures/gesture';

/**
 * Generated class for the LongPressDirective directive.
 *
 * See https://angular.io/api/core/Directive for more info on Angular
 * Directives.
 */
@Directive({
  selector: '[ion-long-press]' // Attribute selector
})
export class LongPressDirective implements OnInit, OnChanges, OnDestroy {

  @Input() interval: number;
  @Input() stop: boolean;

  @Output() onPressStart: EventEmitter<any> = new EventEmitter();
  @Output() onPressing: EventEmitter<any> = new EventEmitter();
  @Output() onPressEnd: EventEmitter<any> = new EventEmitter();
  @Output() onStop: EventEmitter<any> = new EventEmitter();

  el: HTMLElement;
  pressGesture: Gesture;

  int: any;

  constructor(
    public zone: NgZone,
    el: ElementRef
  ) {
    this.el = el.nativeElement;
  }

  ngOnInit() {
    if (!this.interval) this.interval = 500;
    if (this.interval < 40) {
      throw new Error('A limit of 40ms is imposed so you don\'t destroy device performance. If you need less than a 40ms interval, please file an issue explaining your use case.');
    }
    this.pressGesture = new Gesture(this.el);
    this.pressGesture.listen();
    this.pressGesture.on('press', (e: any) => {
      this.onPressStart.emit(e);
      this.zone.run(() => {
        this.int = setInterval(() => {
          this.onPressing.emit();
        }, this.interval);
      });
    });

    this.pressGesture.on('pressup panend pancancel', (e: any) => {
      this.zone.run(() => {
        clearInterval(this.int);
      });
      this.onPressEnd.emit();
      // console.log(e.type);
    });

  }

  ngOnChanges(changes: { [propKey: string]: SimpleChange }) {
    // let stop = changes['stop'].currentValue;
    this.zone.run(() => {
      clearInterval(this.int);
    });
    this.onPressEnd.emit();
    // console.log('Long-press: ', stop);
  }

  ngOnDestroy() {
    this.zone.run(() => {
      clearInterval(this.int);
    });
    this.onPressEnd.emit();
    this.pressGesture.destroy();
  }
}
