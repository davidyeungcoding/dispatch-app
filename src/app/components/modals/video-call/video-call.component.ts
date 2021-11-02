import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { NgForm } from '@angular/forms';

import { AuthService } from 'src/app/services/auth.service';
import { UserDataService } from 'src/app/services/user-data.service';
import { SocketioService } from 'src/app/services/socketio.service';
import { EditAccountService } from 'src/app/services/edit-account.service';

import { Subscription } from 'rxjs';

@Component({
  selector: 'app-video-call',
  templateUrl: './video-call.component.html',
  styleUrls: ['./video-call.component.css']
})
export class VideoCallComponent implements OnInit, OnDestroy {
  @Input() target: any;
  private subscriptions: Subscription = new Subscription();
  private userData: any = {};
  private authToken: string = '';
  callLinkError: string = '';

  constructor(
    private authService: AuthService,
    private userDataService: UserDataService,
    private socketioService: SocketioService,
    private editAccountService: EditAccountService
  ) { }

  ngOnInit(): void {
    this.subscriptions.add(this.userDataService.userData.subscribe(_user => this.userData = _user));
    this.subscriptions.add(this.userDataService.authToken.subscribe(_token => this.authToken = _token));
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  onChangeCallLink(form: NgForm): void {
    $('#callLinkErrorContainer').css('display', 'none');
    const link = form.value.callLink.trim();

    if (!link) {
      this.callLinkError = 'No changes detected';
      $('#callLinkErrorContainer').css('display', 'inline');
      form.reset({ callLink: '' });
      setTimeout(() => { $('#callLinkErrorContainer').css('display', 'none') }, 1500);
      return;
    };

    const payload = {
      _id: this.userData._id,
      targetId: this.target._id,
      target: 'videoCall',
      change: link
    };

    this.editAccountService.editCallLink(payload, this.authToken).subscribe(_user => {
      if (!_user.success) {
        if (_user.status === 401 || _user.msg === 'User is not authorized for access') {
          this.callLinkError = 'Authorization has expired. Please log back on and try again.';
          $('#callLinkErrorContainer').css('display', 'inline');

          setTimeout(() => {
            (<any>$('#editCallLink')).modal('hide');
            const user = this.userData ? this.userData : this.authService.parseLocalStorageUser();
            this.authService.logout(user);
          }, 2000);

          return;
        };

        this.callLinkError = _user.msg;
        $('callLinkErrorContainer').css('display', 'inline');
        return;
      };

      this.userData.videoCall = link;
      this.userDataService.changeUserData(this.userData);
      this.userDataService.changeAuthToken(_user.token);
      this.socketioService.emitLink(link);
      $('#callLinkSuccessContainer').css('display', 'inline');

      setTimeout(() => {
        form.reset({ callLink: '' });
        $('#callLinkSuccessContainer').css('display', 'none');
        (<any>$('#editCallLink')).modal('hide');
      }, 1000);
    });
  };
}
