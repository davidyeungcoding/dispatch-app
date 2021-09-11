import { Component, OnInit } from '@angular/core';
import { NgForm } from '@angular/forms';

import { AuthService } from 'src/app/services/auth.service';
import { RedirectService } from 'src/app/services/redirect.service';
import { SocketioService } from 'src/app/services/socketio.service';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit {
  loginErrorMsg: string = '';

  constructor(
    private authService: AuthService,
    private redirectService: RedirectService,
    private socketioService: SocketioService
  ) { }

  ngOnInit(): void {
  }

  // ======================
  // || Helper Functions ||
  // ======================

  clearForm(form: NgForm): void {
    form.reset({ username: form.value.username.trim() });
  };

  loginError(form: NgForm, msg: string): void {
    this.clearForm(form);
    this.loginErrorMsg = msg;
    $('#loginErrorMsgContainer').css('display', 'inline');
  };

  authenticateUser(payload: any): Promise<any> {
    return new Promise(resolve => {
      this.authService.authenticateUser(payload).subscribe(_user => {
        if (!_user.success) return resolve({ token: null, user: null });
        return resolve({ token: _user.token, user: _user.user });
      });
    });
  };
  
  // ========================
  // || Generaal Functions ||
  // ========================

  async onLoginSubmit(form: NgForm): Promise<void> {
    const username = form.value.username;
    const password = form.value.password;
    $('#loginErrorMsgContainer').css('display', 'none');
    
    if (!username || !username.trim() || !password || !password.trim()) {
      this.loginError(form, 'Please fill out both fields');
      return;
    };

    const payload = {
      username: username.trim(),
      password: password.trim()
    };

    const res = await this.authenticateUser(payload);
    if (!res.user) return this.loginError(form, 'Username and password do not match');
    this.socketioService.emitLogin(res.user);
    this.authService.setLocalStorageUser(res.token, JSON.stringify(res.user));
    this.authService.changeAuthToken(res.token);
    this.authService.changeUserData(res.user);
    this.redirectService.handleRedirect('dispatch');
  };
}
