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
  private subscription: Subscription = new Subscription();
  userList: any = [];
  doctorList: any = [];

  constructor(
    private authService: AuthService,
    private socketioService: SocketioService
  ) { }

  ngOnInit(): void {
    this.subscription.add(this.authService.compareToken(localStorage.getItem('id_token')!));
    this.subscription.add(this.socketioService.userList.subscribe(_list => this.userList = _list));
    this.subscription.add(this.socketioService.doctorList.subscribe(_list => this.doctorList = _list));
  }
  
  ngAfterViewInit(): void {
    console.log(this.userList);
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

}
