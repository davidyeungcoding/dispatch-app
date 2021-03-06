import { Injectable } from '@angular/core';

import { BehaviorSubject } from 'rxjs';
import { ChatEntry } from '../interfaces/chat-entry';

@Injectable({
  providedIn: 'root'
})
export class ChatService {
  private openChatsSource = new BehaviorSubject<any>([]);
  openChats = this.openChatsSource.asObservable();

  constructor() { }

  // =======================
  // || General Functions ||
  // =======================

  receiveMessage(payload: any): void {
    let list = this.openChatsSource.value;
    const chatEntry: ChatEntry = list.find((entry: ChatEntry) => entry._id === payload._id);
    const minimizeValue = chatEntry ? chatEntry.minimize : true;
    const update: ChatEntry = {
      targetId: payload.target,
      _id: payload._id,
      name: payload.name,
      messages: [{
        personal: payload.messages[0].personal,
        message: payload.messages[0].message
      }],
      minimize: minimizeValue
    };
    chatEntry ? chatEntry.messages.push(update.messages[0]) : list.push(update);
    this.changeOpenChats(list);
    $(`#${payload._id}ChatControl`).addClass('new-message');
  };

  failedToDeliver(payload: any): void {
    const list = this.openChatsSource.value;
    const chatEntry: ChatEntry = list.find((entry: ChatEntry) => entry._id === payload.targetId);
    chatEntry.messages.push({
      personal: 'error',
      message: 'Unable to send message. User is no longer logged on.'
    });
  };

  // =======================
  // || Change Observable ||
  // =======================

  changeOpenChats(list: any): void {
    this.openChatsSource.next(list);
  };
}
