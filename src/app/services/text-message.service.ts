import { Injectable } from '@angular/core';

import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class TextMessageService {
  private emptyResponse = {
    success: false,
    msg: ''
  };

  // =================
  // || Observables ||
  // =================

  private responseMessageSource = new BehaviorSubject<any>(this.emptyResponse);
  responseMessage = this.responseMessageSource.asObservable();

  constructor() { }

  // ======================
  // || Shared Functions ||
  // ======================

  processTextResponse(payload: any): void {
    this.changeResponseMessage(payload);
  };
  
  // ========================
  // || Change Observables ||
  // ========================

  changeResponseMessage(payload: any): void {
    this.responseMessageSource.next(payload);
  };
}
