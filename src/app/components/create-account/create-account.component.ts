import { Component, OnDestroy, OnInit } from '@angular/core';
import { NgForm } from '@angular/forms';

import { AuthService } from 'src/app/services/auth.service';
import { RedirectService } from 'src/app/services/redirect.service';
import { UserDataService } from 'src/app/services/user-data.service';

import { Subscription } from 'rxjs';

@Component({
  selector: 'app-create-account',
  templateUrl: './create-account.component.html',
  styleUrls: ['./create-account.component.css']
})
export class CreateAccountComponent implements OnInit, OnDestroy {
  private subscriptions: Subscription = new Subscription();
  private token: string = '';
  private userData: any = null;
  createErrorMsg: string = '';
  createSuccessMsg: string = '';
  successfulUserCreation: string = 'Successfully create new user';

  constructor(
    private authService: AuthService,
    private redirectService: RedirectService,
    private userDataService: UserDataService
  ) { }

  ngOnInit(): void {
    this.subscriptions.add(this.userDataService.authToken.subscribe(_token => this.token = _token));
    this.subscriptions.add(this.userDataService.userData.subscribe(_user => this.userData = _user));
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  // ======================
  // || Helper Functions ||
  // ======================

  resetForm(form: NgForm): void {
    form.reset({
      username: form.value.username.trim(),
      password: '',
      name: form.value.name.trim(),
      accountType: form.value.accountType,
      adminUsername: '',
      adminPassword: ''
    });
  };

  checkFilledForm(form: NgForm): boolean {
    const username = form.value.username;
    const password = form.value.password;
    const name = form.value.name;
    const accountType = form.value.accountType;
    const adminUsername = form.value.adminUsername;
    const adminPassword = form.value.adminPassword;


    if (!username || !username.trim() || !password || !password.trim() || !name || !name.trim()
    || !accountType || !adminUsername || !adminUsername.trim() || !adminPassword|| !adminPassword.trim()) {
      this.createErrorMsg = 'Please be sure to fill out all fields and select a role';
      $('#createErrorMsgContainer').css('display', 'inline');
      this.resetForm(form);
      return false;
    };

    return true;
  };

  sendCreateRequest(payload: any): Promise<any> {
    return new Promise(resolve => {
      this.authService.createUser(payload, this.token).subscribe(_res => {
        if (_res.token) this.userDataService.changeAuthToken(_res.token);
        return resolve(_res);
      });
    });
  };

  // =======================
  // || General Functions ||
  // =======================

  async onCreateSubmit(form: NgForm): Promise<void> {
    $('#createErrorMsgContainer').css('display', 'none');
    if (!this.checkFilledForm(form)) return;

    const payload = {
      admin: {
        username: form.value.adminUsername.trim(),
        password: form.value.adminPassword.trim()
      },
      newUser: {
        username: form.value.username.trim(),
        password: form.value.password.trim(),
        name: form.value.name.trim(),
        accountType: form.value.accountType
      }
    };

    const status = await this.sendCreateRequest(payload);

    if (!status.success) {
      this.createErrorMsg = status.msg;
      $('#createErrorMsgContainer').css('display', 'inline');
      const user = this.userData ? this.userData : this.authService.parseLocalStorageUser()
      if (status.status === 400) setTimeout(() => this.authService.logout(user), 2000);
      this.resetForm(form);
      return;
    };

    this.createSuccessMsg = status.msg;
    $('#createSuccessMsgContainer').css('display', 'inline');

    setTimeout(() => {
      this.redirectService.handleRedirect('dispatch');
    }, 1000);
  };

  onCancelCreate(): void {
    this.redirectService.handleRedirect('dispatch');
  };
}
