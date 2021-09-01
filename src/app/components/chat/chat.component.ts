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

  onSendMessage(target: any, sentMessage: string): void {
    const message = { 
      name: 'You',
      message: sentMessage
     };
    const payload = {
      _id: this.userData._id,
      name: this.userData.name,
      targetSocket: target.socketId,
      message: sentMessage
    };
    target.messages.push(message);
    this.chatService.changeOpenChats(this.openChats[target._id] = target);
    this.socketioService.emitSendMessage(payload);
  };

  // onSendMessage(form: NgForm, target: any): void {
  //   const message = form.value.message.trim();
  //   if (!message) return;
  //   const payload = {
  //     _id: this.userData._id,
  //     name: this.userData.name,
  //     message: message,

  //   }

  // }
}
