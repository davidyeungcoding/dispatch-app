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

  sendSocketioMessage(conversation: any, message: string): void {
    const targetUser = {
      targetId: conversation._id,
      _id: this.userData._id,
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

    conversation.messages.push(message);
    this.clearTextField(conversation, form);
    this.sendSocketioMessage(conversation, message.message);
    this.chatService.scrollDown(`#${conversation._id}ChatDisplay`);
  };

  resize(conversation: any): void {
    const node = $(`#${conversation._id}MinimizeContent`);
    conversation.minimize ? node.css('display', 'none') : node.css('display', 'inline');
    conversation.minimize = !conversation.minimize;
  };
}
