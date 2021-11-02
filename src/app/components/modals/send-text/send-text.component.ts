import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { NgForm } from '@angular/forms';

import { SocketioService } from 'src/app/services/socketio.service';
import { TextMessageService } from 'src/app/services/text-message.service';

import { Subscription } from 'rxjs';

@Component({
  selector: 'app-send-text',
  templateUrl: './send-text.component.html',
  styleUrls: ['./send-text.component.css']
})
export class SendTextComponent implements OnInit, OnDestroy {
  @Input() currentLink: any;
  private subscriptions: Subscription = new Subscription();
  textResponse: any = {};

  constructor(
    private socketioService: SocketioService,
    private textMessageService: TextMessageService
  ) { }

  ngOnInit(): void {
    this.subscriptions.add(this.textMessageService.responseMessage.subscribe(_res => this.textResponse = _res));
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  // ======================
  // || Helper Functions ||
  // ======================

  testPhoneNumber(contact: string): boolean {
    const regex = /^\d{10}$/;
    return regex.test(contact);
  };

  replaceClass(term: string): void {
    const included = $('#textResponse')[0].classList.contains(term);
    if (included) return;
    const replace = term === 'error-msg' ? 'success-msg' : 'error-msg';
    $('#textResponse').removeClass(replace);
    $('#textResponse').addClass(term);
  };

  textError(message: string): void {
    const error = { success: false, msg: message };
    this.textMessageService.changeResponseMessage(error);
    this.replaceClass('error-msg');
    $('#textResponseContainer').css('display', 'inline');
    setTimeout(() => { $('#textResponseContainer').css('display', 'none') }, 1500);
  };

  // =======================
  // || General Functions ||
  // =======================

  onSendTextMessage(form: NgForm): void {
    $('#textResponseContainer').css('dsiplay', 'none');
    const phoneNumber = form.value.phoneNumber.trim();
    if (!phoneNumber) return this.textError('Please enter a phone number');
    if (!this.testPhoneNumber(phoneNumber)) return this.textError('Invalid phone number');
    const link = this.currentLink;
    if (!link) return this.textError('Missing link associated with doctor');
    const message = `Contact your medical consultant at: ${link}. Reply STOP to unsubscribe.`;
    this.socketioService.emitTextMessage({ sendTo: phoneNumber, message: message });

    setTimeout(() => {
      this.textResponse.success === true ? this.replaceClass('success-msg') : this.replaceClass('error-msg');
      $('#textResponseContainer').css('display', 'inline');
    }, 100);

    setTimeout(() => {
      form.reset({ phoneNumber: '' });
      $('#textResponseContainer').css('display', 'none');
      (<any>$('#sendText')).modal('hide');
    }, 1100);
  };
}
