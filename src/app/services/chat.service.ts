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
    console.log('++++++++++++++++++++++++++++++++++++++')
    console.log('received message')
    console.log(list)
    const update: ChatEntry = {
      _id: payload._id,
      socketId: payload.socketId,
      name: payload.name,
      messages: [{
        personal: payload.messages.personal,
        message: payload.messages[0]
      }]
    };
    const chatEntry: ChatEntry = list.find((entry: ChatEntry) => entry._id === update._id);
    chatEntry ? chatEntry.messages.push(update.messages[0]) : list.push(update);
    console.log('list update')
    console.log(list)
    console.log('++++++++++++++++++++++++++++++++++++++')
    this.changeOpenChats(list);
  };

  // =======================
  // || Change Observable ||
  // =======================

  changeOpenChats(list: any): void {
    this.openChatsSource.next(list);
    console.log('0000000000000000000000000000000000000000')
    console.log(this.openChatsSource.value);
    console.log('0000000000000000000000000000000000000000')
  };
}
