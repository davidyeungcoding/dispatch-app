import { Component, OnDestroy, OnInit } from '@angular/core';

import { AuthService } from './services/auth.service';
import { SocketioService } from './services/socketio.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit, OnDestroy {
  title = 'dispatch-app';

  constructor(
    private socketioService: SocketioService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.socketioService.setupSocketConnection();
    this.socketioService.receiveStatusChange();
    this.authService.onReload();
  }

  ngOnDestroy(): void {
  }
}
