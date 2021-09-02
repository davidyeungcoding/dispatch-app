import { Component, OnDestroy, OnInit } from '@angular/core';
import { NgForm } from '@angular/forms';

import { ChatService } from 'src/app/services/chat.service';
import { SocketioService } from 'src/app/services/socketio.service';
import { AuthService } from 'src/app/services/auth.service';

import { Subscription } from 'rxjs';

@Component({
  selector: 'app-chat',
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.css']
})
export class ChatComponent implements OnInit, OnDestroy {
  private subscriptions: Subscription = new Subscription();
  private userData: any = {};
  openChats: any = {};

  constructor(
    private chatService: ChatService,
    private socketioService: SocketioService,
    private authService: AuthService
  ) { }

  ngOnInit(): void {
    this.subscriptions.add(this.chatService.openChats.subscribe(_list => this.openChats = _list));
    this.subscriptions.add(this.authService.userData.subscribe(_user => this.userData = _user));
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  onSendMessage(conversation: any, form: NgForm): void {
    const parsedMessage = form.value.message.trim();
    form.value.message = '';
    $(`#${Object.values(conversation)[0]}Chat`).val('');
    if (!parsedMessage) return;
    const message = { 
      name: 'You',
      message: parsedMessage
     };
    const payload = {
      _id: this.userData._id,
      name: this.userData.name,
      targetSocket: conversation.socketId,
      message: parsedMessage
    };
    console.log('=================================')
    // @ts-ignore
    console.log(Object.values(conversation))
    // @ts-ignore
    console.log(Object.values(conversation)[1].messages)
    // @ts-ignore
    Object.values(conversation)[1].messages.push(message);
    // this.chatService.changeOpenChats(this.openChats[conversation._id] = conversation);
    // this.socketioService.emitSendMessage(payload);
  };
}
