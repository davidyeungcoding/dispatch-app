import { Injectable } from '@angular/core';

import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ChatService {
  private openChatsSource = new BehaviorSubject<any>({});
  openChats = this.openChatsSource.asObservable();

  constructor() { }

  receiveMessage(payload: any): void {
    const list = this.openChatsSource.value;
    if (!list[payload._id]) list[payload._id] = [];

    list[payload._id].push({
      name: payload.name,
      messsage: payload.message
    });
  };

  // =======================
  // || Change Observable ||
  // =======================

  changeOpenChats(list: any): void {
    this.openChatsSource.next(list);
  };
}
