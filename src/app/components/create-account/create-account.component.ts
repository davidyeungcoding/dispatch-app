import { Component, OnDestroy, OnInit } from '@angular/core';
import { NgForm } from '@angular/forms';

import { AuthService } from 'src/app/services/auth.service';
import { RedirectService } from 'src/app/services/redirect.service';

import { Subscription } from 'rxjs';

@Component({
  selector: 'app-create-account',
  templateUrl: './create-account.component.html',
  styleUrls: ['./create-account.component.css']
})
export class CreateAccountComponent implements OnInit, OnDestroy {
  private subscriptions: Subscription = new Subscription();
  private userData: any = {};
  createErrorMsg: string = '';
  createSuccessMsg: string = '';
  successfulUserCreation: string = 'Successfully create new user';

  constructor(
    private authService: AuthService,
    private redirectService: RedirectService
  ) { }

  ngOnInit(): void {
    this.subscriptions.add(this.authService.userData.subscribe(_user => this.userData = _user));
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  onCreateSubmit(form: NgForm): void {
    $('#createErrorMsgContainer').css('display', 'none');

    if (!form.value.username.trim() || !form.value.password.trim() || !form.value.name.trim() || !form.value.accountType) {
      this.createErrorMsg = 'Please be sure to fill out all fields and select a role';
      $('#createErrorMsgContainer').css('display', 'inline');
      $('#createPassword').val('');
      form.reset({
        username: form.value.username.trim(),
        password: '',
        name: form.value.name.trim(),
        accountType: form.value.accountType
      });

      return;
    };

    const payload = {
      creatorId: this.userData._id,
      username: form.value.username.trim(),
      password: form.value.password.trim(),
      name: form.value.name.trim(),
      accountType: form.value.accountType
    };
    console.log(this.userData)
    console.log(payload)

    this.authService.createUser(payload, localStorage.getItem('id_token')!).subscribe(_user => {
      if (!_user.success) {
        this.createErrorMsg = _user.msg;
        $('#createErrorMsgContainer').css('display', 'inline');
        return;
      };
      
      this.createSuccessMsg = _user.msg;
      $('#createSuccessMsgContainer').css('display', 'inline');

      setTimeout(() => {
        this.redirectService.handleRedirect('dispatch');
        $('#createSuccessMsgContainer').css('display', 'none');
      }, 3000);
    });
  };

  onCancelCreate(): void {
    this.redirectService.handleRedirect('dispatch');
  };
}
