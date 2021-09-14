import { Component, OnDestroy, OnInit } from '@angular/core';
import { NgForm } from '@angular/forms';

import { AuthService } from 'src/app/services/auth.service';
import { RedirectService } from 'src/app/services/redirect.service';
import { EditAccountService } from 'src/app/services/edit-account.service';
import { SocketioService } from 'src/app/services/socketio.service';

import { Subscription } from 'rxjs';

@Component({
  selector: 'app-edit-account',
  templateUrl: './edit-account.component.html',
  styleUrls: ['./edit-account.component.css']
})
export class EditAccountComponent implements OnInit, OnDestroy {
  private subscriptions: Subscription = new Subscription();
  private token: string = '';
  userData: any = {};
  errorMsg: string = '';
  successMsg: string = '';
  username: boolean = false;
  password: boolean = false;
  name: boolean = false;

  constructor(
    private authServcie: AuthService,
    private redirectService: RedirectService,
    private editAccountService: EditAccountService,
    private socketIoService: SocketioService
  ) { }

  ngOnInit(): void {
    this.subscriptions.add(this.authServcie.userData.subscribe(_user => this.userData = _user));
    this.subscriptions.add(this.authServcie.authToken.subscribe(_token => this.token = _token));
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  // ======================
  // || Helper Functions ||
  // ======================

  resetForm(form: NgForm): void {
    form.reset({ username: form.value.username.trim() })
  }

  checkRequiredFields(form: NgForm): boolean {
    const username = form.value.username;
    const password = form.value.password;

    if (!username || !username.trim() || !password || !password.trim()) {
      if (!username || !username.trim()) $('#usernameErrContainer').css('display', 'inline');
      $('#passwordErrContainer').css('display', 'inline');
      this.resetForm(form);
      return false;
    };

    return true;
  };

  checkForChanges(payload: any, form: NgForm): boolean {
    if (!payload.newUsername && !payload.newPassword && !payload.newName) {
      this.errorMsg = 'No changes were submitted';
      $('#errorMsgContainer').css('display', 'inline');
      $('#passwordErrContainer').css('display', 'inline');
      this.resetForm(form);
      return false;
    };
    
    return true;
  };

  buildPayload(form: NgForm): any {
    const payload: any = {
      username: form.value.username,
      password: form.value.password
    };

    if (form.value.newUsername && form.value.newUsername.trim()) payload.newUsername = form.value.newUsername;
    if (form.value.newPassword && form.value.newPassword.trim()) payload.newPassword = form.value.newPassword;
    if (form.value.newName && form.value.newName.trim()) payload.newName = form.value.newName;
    console.log(`username: ${payload.newUsername} || password: ${payload.newPassword} || name: ${payload.newName}`);
    return payload;
  };

  // =======================
  // || General Functions ||
  // =======================

  onShowContent(input: string): void {
    switch (input) {
      case 'username':
        this.username = !this.username;
        break;
      case 'password':
        this.password = !this.password;
        break;
      case 'name':
        this.name = !this.name;
        break;
    };
  };
  
  onSubmitForm(form: NgForm): void {
    $('.msg-container').css('display', 'none');
    if (!this.checkRequiredFields(form)) return;
    const payload = this.buildPayload(form);
    if (!this.checkForChanges(payload, form)) return;

    this.editAccountService.editAccount(payload, this.token).subscribe(_res => {
      if (_res.status === 401) {
        this.errorMsg = 'Invalid user access';
        $('#errorMsgContainer').css('display', 'inline');
        setTimeout(() => this.authServcie.logout(), 1500);
        return;
      } else if (_res.status !== 200) {
        this.errorMsg = _res.msg;
        $('#errorMsgContainer').css('display', 'inline');
        return;
      };

      this.authServcie.changeUserData(_res.msg);
      this.authServcie.changeAuthToken(_res.token);
      this.socketIoService.emitAccountUpdate(_res.msg);
      this.successMsg = 'Account has been updated';
      $('#successMsgContainer').css('display', 'inline');
      setTimeout(() => this.redirectService.handleRedirect('dispatch'), 1500);
    });
  };

  onCancelEdit(): void {
    this.redirectService.handleRedirect('dispatch');
  };
}
