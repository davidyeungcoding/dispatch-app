import { AfterViewInit, Component, OnDestroy, OnInit } from '@angular/core';

import { AuthService } from 'src/app/services/auth.service';
import { SocketioService } from 'src/app/services/socketio.service';

import { Subscription } from 'rxjs';

@Component({
  selector: 'app-dispatch',
  templateUrl: './dispatch.component.html',
  styleUrls: ['./dispatch.component.css']
})
export class DispatchComponent implements OnInit, AfterViewInit, OnDestroy {
  private subscriptions: Subscription = new Subscription();
  userData: any = {};
  userList: any = [];
  doctorList: any = [];

  constructor(
    private authService: AuthService,
    private socketioService: SocketioService
  ) { }

  ngOnInit(): void {
    this.subscriptions.add(this.authService.compareToken(localStorage.getItem('id_token')!));
    this.subscriptions.add(this.authService.userData.subscribe(_user => this.userData = _user));
    this.subscriptions.add(this.socketioService.userList.subscribe(_list => this.userList = _list));
    this.subscriptions.add(this.socketioService.doctorList.subscribe(_list => this.doctorList = _list));
  }
  
  ngAfterViewInit(): void {
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  onChangeStatus(status: string): void {
    this.socketioService.emitStatus(status);
  };
}
