import { AfterViewInit, Component, OnDestroy, OnInit } from '@angular/core';
import { NgForm } from '@angular/forms';

import { AuthService } from 'src/app/services/auth.service';
import { SocketioService } from 'src/app/services/socketio.service';
import { ChatService } from 'src/app/services/chat.service';

import { Subscription } from 'rxjs';

@Component({
  selector: 'app-dispatch',
  templateUrl: './dispatch.component.html',
  styleUrls: ['./dispatch.component.css']
})
export class DispatchComponent implements OnInit, AfterViewInit, OnDestroy {
  private subscriptions: Subscription = new Subscription();
  private target: any = {};
  private authToken: string = '';
  private openChats: any = {};
  userData: any = {};
  userList: any = [];
  doctorList: any = [];
  callLinkError: string = '';

  constructor(
    private authService: AuthService,
    private socketioService: SocketioService,
    private chatService: ChatService
  ) { }

  ngOnInit(): void {
    this.subscriptions.add(this.authService.userData.subscribe(_user => this.userData = _user));
    this.subscriptions.add(this.socketioService.userList.subscribe(_list => this.userList = _list));
    this.subscriptions.add(this.socketioService.doctorList.subscribe(_list => this.doctorList = _list));
    this.subscriptions.add(this.authService.authToken.subscribe(_token => this.authToken = _token));
    this.subscriptions.add(this.chatService.openChats.subscribe(_list => this.openChats = _list));
    this.socketioService.emitUserListRequest();
  }
  
  ngAfterViewInit(): void {
    console.log('======================================')
    console.log(this.userList);
    console.log('======================================')
    console.log(this.userData)
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  // ======================
  // || Helper Functions ||
  // ======================

  clearModalEntry(form: NgForm): void {
    form.reset({ callLink: '' });
    $('#callLink').val('');
  };

  storeTarget(target: any): void {
    this.target = target;
  };

  // =======================
  // || General Functions ||
  // =======================

  onChangeStatus(status: string): void {
    console.log(this.userData.status === status)
    if (this.userData.status === status) return;
    this.userData.status = status;
    console.log(this.userData.status);
    this.socketioService.emitStatus(status);
  };

  onChangeCallLink(form: NgForm): void {
    $('#callLinkErrorContainer').css('display', 'none');
    const link = form.value.callLink.trim();

    if (!link) {
      this.callLinkError = 'Please enter a link in the above field';
      $('#callLinkErrorContainer').css('display', 'inline');
      return;
    };

    const payload = {
      _id: this.userData._id,
      targetId: this.target._id,
      target: 'videoCall',
      change: link
    };

    this.authService.editUser(payload, this.authToken).subscribe(_user => {
      if (!_user.success) {
        this.callLinkError = _user.msg;
        $('#callLinkErrorContainer').css('display', 'inline');
        return;
      };

      this.socketioService.emitLink(link);
      $('#callLinkSuccessContainer').css('display', 'inline');
      
      setTimeout(() => {
        this.clearModalEntry(form);
        $('#callLinkSuccessContainer').css('display', 'none');
        (<any>$('#editCallLink')).modal('toggle');
      }, 1000);
    });
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
    if (this.openChats[user._id]) return; // show chat box if closed
    const payload = {
      _id: user._id,
      socketId: user.socketId,
      name: user.name,
      messages: []
    };

    this.openChats[user._id] = payload;
    this.chatService.changeOpenChats(this.openChats);
    console.log(this.openChats);
  };
}
