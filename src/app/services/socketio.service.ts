import { Injectable } from '@angular/core';

import { BehaviorSubject } from 'rxjs';
import { io } from 'socket.io-client';

@Injectable({
  providedIn: 'root'
})
export class SocketioService {
  socket: any;

  // =================
  // || Observables ||
  // =================

  private userListSource = new BehaviorSubject([]);
  userList = this.userListSource.asObservable();
  private doctorListSource = new BehaviorSubject([]);
  doctorList = this.doctorListSource.asObservable();

  constructor() { }

  parseUserList(list: any): void {
    let users: any = [];
    let doctors: any = [];

    Object.values(list).forEach(user => {
      // @ts-ignore
      user.accountType === 'doctor' ? doctors.push(user) : users.push(user);
    });

    // for (let i = 0; i < Object.values(list).length; i++) {
    //   let user: any = Object.values(list)[i];
    //   user.socketId = Object.keys(list)[i];
    //   user.accountType === 'doctor' ? doctors.push(user) : users.push(user);
    // };

    this.changeDoctorList(doctors);
    this.changeUserList(users);
  };

  // ===========
  // || Setup ||
  // ===========

  setupSocketConnection(): void {
    this.socket = io('http://localhost:3000');
  };

  // ==================
  // || Emit Changes ||
  // ==================

  emitDisconnect(user: any): void {
    if (!!this.socket) this.socket.disconnect(user);
  };

  emitLogin(user: any): void {
    this.socket.emit('login', user);
    console.log(user)
    if (user.accountType === 'doctor') this.emitStatus('available');
  };

  emitStatus(status: string): void {
    this.socket.emit('emit-status', status);
  };

  // =====================
  // || Receive Updates ||
  // =====================

  receiveStatusChange(): void {
    this.socket.on('status-change', (_userList: any) => {
      console.log('Status Change');
      console.log(_userList); // set to update user list from a service to track changes
      this.parseUserList(_userList);
    });

    this.socket.on('user-list-update', (_userList: any) => {
      console.log('User List Update');
      console.log(_userList); // set to update user list from a service to track changes
      this.parseUserList(_userList);
    });
  };

  // =======================
  // || Change Observable ||
  // =======================

  changeUserList(list: any): void {
    this.userListSource.next(list);
  };
  
  changeDoctorList(list: any): void {
    this.doctorListSource.next(list);
  };
}
