import { Component, OnDestroy, OnInit } from '@angular/core';

import { AuthService } from './services/auth.service';
import { SocketioService } from './services/socketio.service';
import { UserDataService } from './services/user-data.service';

import { Subscription } from 'rxjs';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit, OnDestroy {
  private subscriptions: Subscription = new Subscription();
  private userData: any = null;
  private authToken: string = '';
  title = 'dispatch-app';

  constructor(
    private socketioService: SocketioService,
    private authService: AuthService,
    private userDataService: UserDataService
  ) {}

  ngOnInit(): void {
    this.subscriptions.add(this.userDataService.userData.subscribe(_user => this.userData = _user));
    this.subscriptions.add(this.userDataService.authToken.subscribe(_token => this.authToken = _token));
    this.socketioService.setupSocketConnection();
    this.socketioService.receiveStatusChange();
    this.authService.onReload(this.userData, this.authToken);
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }
}
