import { Injectable } from '@angular/core';

import { ChatService } from './chat.service';
import { TextMessageService } from './text-message.service';
import { EditAccountService } from './edit-account.service';

import { BehaviorSubject } from 'rxjs';
import { io } from 'socket.io-client';

@Injectable({
  providedIn: 'root'
})
export class SocketioService {
  private socket: any;

  // =================
  // || Observables ||
  // =================

  private userListSource = new BehaviorSubject([]);
  userList = this.userListSource.asObservable();
  private doctorListSource = new BehaviorSubject([]);
  doctorList = this.doctorListSource.asObservable();
  private conversionListSource = new BehaviorSubject({});
  conversionList = this.conversionListSource.asObservable();

  constructor(
    private chatService: ChatService,
    private editAccountService: EditAccountService,
    private textMessageService: TextMessageService
  ) { }
  
  // ===========
  // || Setup ||
  // ===========

  setupSocketConnection(): void {
    this.socket = io('http://localhost:3000'); // dev
    // this.socket = io(); // production
  };

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

  // ==================
  // || Emit Changes ||
  // ==================

  emitDisconnect(): void {
    if (!!this.socket) this.socket.disconnect();
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

  emitUserListRequest(): void {
    this.socket.emit('request-user-list');
  };

  emitSendMessage(payload: any): void {
    this.socket.emit('send-message', payload);
  };

  emitAccountUpdate(payload: any): void {
    this.socket.emit('update-account', payload);
  };

  emitTextMessage(payload: any) {
    this.socket.emit('send-text', payload);
  };

  emitDeleteUser(id: string) {
    this.socket.emit('delete-user', id);
  };

  emitSendUserUpdate(user: any) {
    this.socket.emit('send-user-update', user);
  };

  // =====================
  // || Receive Updates ||
  // =====================

  receiveStatusChange(): void {
    this.socket.on('status-change', (_userList: any) => {
      this.parseUserList(_userList);
    });

    this.socket.on('user-list-update', (_userList: any) => {
      this.parseUserList(_userList);
    });

    this.socket.on('link-change', (_userList: any) => {
      this.parseUserList(_userList);
    });

    this.socket.on('socket-conversion', (conversion: any) => {
      this.changeConversionList(conversion);
    });

    this.socket.on('update-chat', (payload: any) => {
      this.chatService.receiveMessage(payload);
    });

    this.socket.on('failed-to-deliver-message', (payload: any) => {
      this.chatService.failedToDeliver(payload);
    });

    this.socket.on('failed-to-send-text', (payload: any) => {
      this.textMessageService.changeResponseMessage(payload);
    });

    this.socket.on('sent-text', (payload: any) => {
      this.textMessageService.processTextResponse(payload);
    });

    this.socket.on('force-logout', () => {
      localStorage.clear();
      location.reload();
    });

    this.socket.on('receive-user-update', (user: any) => {
      localStorage.setItem('user', JSON.stringify(user));

      if (!localStorage.getItem('id_token')) {
        localStorage.clear();
        location.reload();
        return;
      };
      
      const payload = {
        user: user,
        token: localStorage.getItem('id_token')
      };

      this.editAccountService.requestNewToken(payload).subscribe(_token => {
        _token.success ? localStorage.setItem('id_token', _token.token)
        : localStorage.clear();
        location.reload();
      });
    });
  };

  // ========================
  // || Change Observables ||
  // ========================

  changeUserList(list: any): void {
    this.userListSource.next(list);
  };
  
  changeDoctorList(list: any): void {
    this.doctorListSource.next(list);
  };

  changeConversionList(list: any): void {
    this.conversionListSource.next(list);
  };
}
