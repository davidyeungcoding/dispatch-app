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

  // ======================
  // || Helper Functions ||
  // ======================

  parseUserList(list: any): void {
    let users: any = [];
    let doctors: any = [];

    Object.values(list).forEach(user => {
      // @ts-ignore
      user.accountType === 'doctor' ? doctors.push(user) : users.push(user);
    });

    this.changeDoctorList(doctors);
    this.changeUserList(users);
  };

  // ===========
  // || Setup ||
  // ===========

  setupSocketConnection(): void {
    // this.socket = io('http://localhost:3000'); // dev
    this.socket = io();
  };

  // ==================
  // || Emit Changes ||
  // ==================

  emitDisconnect(user: any): void {
    if (!!this.socket) this.socket.disconnect(user);
  };

  emitLogout(user: any): void {
    this.socket.emit('logout', user);
  };

  emitLogin(user: any): void {
    this.socket.emit('login', user);
    if (user.accountType === 'doctor') this.emitStatus('available');
  };

  emitStatus(status: string): void {
    this.socket.emit('emit-status', status);
  };

  emitLink(link: string): void {
    this.socket.emit('emit-link', link);
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

    this.socket.on('link-change', (_userList: any) => {
      console.log('Link Change');
      console.log(_userList);
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
