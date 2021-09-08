import { Component, OnDestroy, OnInit } from '@angular/core';
import { NgForm } from '@angular/forms';

import { AuthService } from 'src/app/services/auth.service';
import { RedirectService } from 'src/app/services/redirect.service';

import { Subscription } from 'rxjs';

@Component({
  selector: 'app-edit-account',
  templateUrl: './edit-account.component.html',
  styleUrls: ['./edit-account.component.css']
})
export class EditAccountComponent implements OnInit, OnDestroy {
  private subscriptions: Subscription = new Subscription();
  userData: any = {};
  errorMsg: string = '';
  username: boolean = false;
  password: boolean = false;
  name: boolean = false;

  constructor(
    private redirectService: RedirectService,
    private authServcie: AuthService
  ) { }

  ngOnInit(): void {
    this.subscriptions.add(this.authServcie.userData.subscribe(_user => this.userData = _user));
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
    if (!form.value.username || !form.value.username.trim()
    || !form.value.password || !form.value.password.trim()) {
      if (!form.value.username || !form.value.username.trim()) $('#usernameErrContainer').css('display', 'inline');
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
    console.log(payload)
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
    console.log(form.value);
    $('.err-container').css('display', 'none');
    if (!this.checkRequiredFields(form)) return;
    const payload = this.buildPayload(form);

    if (!payload.newUsername && !payload.newPassword && !payload.newName) {
      this.errorMsg = 'No changes were submitted';
      $('#submitErrContainer').css('display', 'inline');
      $('#passwordErrContainer').css('display', 'inline');
      this.resetForm(form);
      return;
    };
  };

  onCancelEdit(): void {
    this.redirectService.handleRedirect('dispatch');
  };
}
