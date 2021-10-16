import { AfterViewInit, Component, OnDestroy, OnInit } from '@angular/core';

import { ChatService } from 'src/app/services/chat.service';
import { SocketioService } from 'src/app/services/socketio.service';
import { UserDataService } from 'src/app/services/user-data.service';

import { Subscription } from 'rxjs';
import { ChatEntry } from 'src/app/interfaces/chat-entry';

@Component({
  selector: 'app-dispatch',
  templateUrl: './dispatch.component.html',
  styleUrls: ['./dispatch.component.css']
})
export class DispatchComponent implements OnInit, AfterViewInit, OnDestroy {
  private subscriptions: Subscription = new Subscription();
  private openChats: any = [];
  currentLink: string = '';
  target: any = {};
  userData: any = {};
  userList: any = [];
  doctorList: any = [];
  doctorStatus: string = 'available';
  btnStatus: string = 'busy';

  constructor(
    private chatService: ChatService,
    private socketioService: SocketioService,
    private userDataService: UserDataService
  ) { }

  ngOnInit(): void {
    this.subscriptions.add(this.userDataService.userData.subscribe(_user => this.userData = _user));
    this.subscriptions.add(this.socketioService.userList.subscribe(_list => this.userList = _list));
    this.subscriptions.add(this.socketioService.doctorList.subscribe(_list => this.doctorList = _list));
    this.subscriptions.add(this.chatService.openChats.subscribe(_list => this.openChats = _list));
    this.socketioService.emitUserListRequest();
  }
  
  ngAfterViewInit(): void {
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  // ======================
  // || Helper Functions ||
  // ======================

  storeTarget(target: any): void {
    this.target = target;
  };

  onStoreVideoCall(link: string): void {
    this.currentLink = link;
  };

  // =======================
  // || General Functions ||
  // =======================

  onChangeStatus(): void {
    [this.btnStatus, this.doctorStatus] = [this.doctorStatus, this.btnStatus];
    this.userData.status = this.doctorStatus;
    this.socketioService.emitStatus(this.doctorStatus);
  };

  onCopyLink(link: string): void {
    const temp = document.createElement('textarea');
    document.body.appendChild(temp);
    temp.value = link;
    temp.select();
    document.execCommand('copy');
    document.body.removeChild(temp);
  };

  onStartChat(user: any): void {
    if (user._id === this.userData._id) return;
    const chatUser: ChatEntry = {
      targetId: this.userData._id,
      _id: user._id,
      name: user.name,
      messages: [],
      minimize: true
    };
    const chatEntry = this.openChats.find((log: ChatEntry) => log._id === user._id);
    
    if (!chatEntry) {
      this.openChats.push(chatUser);
      this.chatService.changeOpenChats(this.openChats);
    };
  };

  onScroll(direction: string): void {
    switch (direction) {
      case 'left':
        $('#dispatchScrollContent')[0].scrollLeft = 0;
        break;
      case 'right':
        $('#dispatchScrollContent')[0].scrollLeft = 767;
        break;
    };
  };
}
