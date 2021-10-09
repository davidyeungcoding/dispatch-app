import { AfterViewInit, Component, OnDestroy, OnInit } from '@angular/core';
import { NgForm } from '@angular/forms';

import { AuthService } from 'src/app/services/auth.service';
import { SocketioService } from 'src/app/services/socketio.service';
import { ChatService } from 'src/app/services/chat.service';
import { EditAccountService } from 'src/app/services/edit-account.service';
import { TextMessageService } from 'src/app/services/text-message.service';
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
  private target: any = {};
  private authToken: string = '';
  private openChats: any = [];
  private currentLink: string = '';
  userData: any = {};
  userList: any = [];
  doctorList: any = [];
  callLinkError: string = '';
  textResponse: any = {};

  constructor(
    private authService: AuthService,
    private socketioService: SocketioService,
    private chatService: ChatService,
    private editAccountService: EditAccountService,
    private textMessageService: TextMessageService,
    private userDataService: UserDataService
  ) { }

  ngOnInit(): void {
    this.subscriptions.add(this.userDataService.userData.subscribe(_user => this.userData = _user));
    this.subscriptions.add(this.socketioService.userList.subscribe(_list => this.userList = _list));
    this.subscriptions.add(this.socketioService.doctorList.subscribe(_list => this.doctorList = _list));
    this.subscriptions.add(this.userDataService.authToken.subscribe(_token => this.authToken = _token));
    this.subscriptions.add(this.chatService.openChats.subscribe(_list => this.openChats = _list));
    this.subscriptions.add(this.textMessageService.responseMessage.subscribe(_res => this.textResponse = _res));
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

  replaceClass(term: string): void {
    const included = $('#textResponse')[0].classList.contains(term);
    if (included) return;
    const replace = term === 'error-msg' ? 'success-msg' : 'error-msg';
    $('#textResponse').removeClass(replace);
    $('#textResponse').addClass(term);
  };

  testPhoneNumber(contact: string): boolean {
    const regex = /^\d{10}$/;
    return regex.test(contact) && contact.length === 10;
  };

  textError(message: string): void {
    const error = { success: false, msg: message };
    this.textMessageService.changeResponseMessage(error);
    this.replaceClass('error-msg');
    $('#textResponseContainer').css('display', 'inline');
    setTimeout(() => { $('#textResponseContainer').css('display', 'none') }, 2500);
  };

  // =======================
  // || General Functions ||
  // =======================

  onChangeStatus(status: string): void {
    if (this.userData.status === status) return;
    this.userData.status = status;
    this.socketioService.emitStatus(status);
  };

  onChangeCallLink(form: NgForm): void {
    $('#callLinkErrorContainer').css('display', 'none');
    const link = form.value.callLink.trim();

    if (!link) {
      this.callLinkError = 'Please enter a link in the above field';
      $('#callLinkErrorContainer').css('display', 'inline');
      setTimeout(() => { $('#callLinkErrorContainer').css('display', 'none') }, 1500);
      return;
    };

    const payload = {
      _id: this.userData._id,
      targetId: this.target._id,
      target: 'videoCall',
      change: link
    };

    this.editAccountService.editCallLink(payload, this.authToken).subscribe(_user => {
      if (!_user.success) {
        if (_user.status === 401 || _user.msg === 'User is not authorized for access') {
          this.callLinkError = 'Authorization has timed out. Please log back on and try again.';
          $('#callLinkErrorContainer').css('display', 'inline');

          setTimeout(() => {
            (<any>$('#editCallLink')).modal('toggle');
            const user = this.userData ? this.userData : this.authService.parseLocalStorageUser();
            this.authService.logout(user);
          }, 2000);

          return;
        };

        this.callLinkError = _user.msg;
        $('#callLinkErrorContainer').css('display', 'inline');
        return;
      };

      this.userData.videoCall = link;
      this.userDataService.changeUserData(this.userData);
      this.userDataService.changeAuthToken(_user.token);
      this.socketioService.emitLink(link);
      $('#callLinkSuccessContainer').css('display', 'inline');
      
      setTimeout(() => {
        form.reset({ callLink: '' });
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

  onStoreVideoCall(link: string): void {
    this.currentLink = link;
  };

  onSendTextMessage(form: NgForm): void {
    $('#textResponseContainer').css('display', 'none');
    const phoneNumber = form.value.phoneNumber;
    const message = `Contact your medical consultant at: ${this.currentLink}. Reply STOP to unsubscribe.`;
    if (!phoneNumber || !phoneNumber.trim()) return this.textError('Please enter a phone number');
    if (!this.testPhoneNumber(phoneNumber)) return this.textError('Please enter the area code followed by the phone number');
    this.socketioService.emitTextMessage({ sendTo: phoneNumber, message: message });
    
    setTimeout(() => {
      this.textResponse.success === true ? this.replaceClass('success-msg') : this.replaceClass('error-msg');
      $('#textResponseContainer').css('display', 'inline');
    }, 100);

    setTimeout(() => {
      form.reset({ callLink: '' });
      $('#textResponseContainer').css('display', 'none');
      (<any>$('#sendText')).modal('toggle');
    }, 1000);
  };
}
