import { Component, OnDestroy, OnInit } from '@angular/core';
import { NgForm } from '@angular/forms';

import { ChatService } from 'src/app/services/chat.service';
import { SocketioService } from 'src/app/services/socketio.service';
import { AuthService } from 'src/app/services/auth.service';

import { Subscription } from 'rxjs';
import { ChatMessage } from 'src/app/interfaces/chat-message';
import { ChatEntry } from 'src/app/interfaces/chat-entry';

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

  // onSendMessage(conversation: any, form: NgForm): void {
  //   const parsedMessage = form.value.message.trim();
  //   form.value.message = '';
  //   $(`#${Object.values(conversation)[0]}Chat`).val('');
  //   if (!parsedMessage) return;
  //   const message = { 
  //     name: 'You',
  //     message: parsedMessage
  //    };
  //   const payload = {
  //     _id: this.userData._id,
  //     name: this.userData.name,
  //     targetSocket: conversation.socketId,
  //     message: parsedMessage
  //   };
  //   console.log('=================================')
  //   // @ts-ignore
  //   console.log(Object.values(conversation))
  //   // @ts-ignore
  //   console.log(Object.values(conversation)[1].messages)
  //   // @ts-ignore
  //   Object.values(conversation)[1].messages.push(message);
  //   // this.chatService.changeOpenChats(this.openChats[conversation._id] = conversation);
  //   // this.socketioService.emitSendMessage(payload);
  // };

  // ======================
  // || Helper Functions ||
  // ======================

  clearTextField(conversation: any, form: NgForm): void {
    form.value.message = '';
    $(`#${conversation._id}Chat`).val('');
  };

  // ========================
  // || Socketio Functions ||
  // ========================

  sendSocketioMessage(targetSocket: string, message: string): void {
    const targetUser: ChatEntry = {
      _id: this.userData._id,
      socketId: targetSocket,
      name: this.userData.name,
      messages: [{
        personal: false,
        message: message
      }]
    };

    this.socketioService.emitSendMessage(targetUser);
  };

  // =======================
  // || General Functions ||
  // =======================

  onSendMessage(conversation: any, form: NgForm): void {
    let parsedMessage = form.value.message.trim();

    if (!parsedMessage) {
      this.clearTextField(conversation, form);
      return;
    };

    const message: ChatMessage = {
      personal: true,
      message: parsedMessage
    };

    console.log(conversation)
    conversation.messages.push(message);
    this.clearTextField(conversation, form);
    this.chatService.changeOpenChats(this.openChats);
    this.sendSocketioMessage(conversation.socketId, message.message);
  };
}
