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

  clearForm(form: any): void {
    form.reset({ username: form.value.username.trim() });
  };

  onLoginSubmit(form: NgForm): void {
    $('#loginErrorMsgContainer').css('display', 'none');
    
    if (!form.value.username || !form.value.username.trim()
    || !form.value.password || !form.value.password.trim()) {
      this.clearForm(form);
      this.loginErrorMsg = 'Please fill out both fields';
      $('#loginErrorMsgContainer').css('display', 'inline');
      return;
    };

    const payload = {
      username: form.value.username.trim(),
      password: form.value.password.trim()
    };

    this.authService.authenticateUser(payload).subscribe(_user => {
      if (_user.success) {
        const tempUser: any = {
          _id: _user.user._id,
          name: _user.user.name,
          accountType: _user.user.accountType
        };
        if (_user.user.accountType === 'doctor') tempUser.videoCall = _user.user.videoCall;

        this.socketioService.emitLogin(tempUser);
        this.authService.setLocalStorageUser(_user.token, JSON.stringify(tempUser));
        this.authService.changeAuthToken(_user.token);
        this.authService.changeUserData(_user.user);
        this.redirectService.handleRedirect('dispatch');
      };

      this.loginErrorMsg = 'Username and password do not match';
      $('#loginErrorMsgContainer').css('display', 'inline');
      this.clearForm(form);
    });
  };
}
