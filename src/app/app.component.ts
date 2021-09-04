import { Component, OnDestroy, OnInit } from '@angular/core';

import { SocketioService } from './services/socketio.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit, OnDestroy {
  title = 'dispatch-app';

  constructor(
    private socketioService: SocketioService
  ) {}

  ngOnInit(): void {
    this.socketioService.setupSocketConnection();
    this.socketioService.receiveStatusChange();
  }

  ngOnDestroy(): void {
    this.socketioService.emitDisconnect();
  }
}
