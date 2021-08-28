import { AfterViewInit, Component, OnDestroy, OnInit } from '@angular/core';
import { NgForm } from '@angular/forms';

import { AuthService } from 'src/app/services/auth.service';
import { SocketioService } from 'src/app/services/socketio.service';

import { Subscription } from 'rxjs';

@Component({
  selector: 'app-dispatch',
  templateUrl: './dispatch.component.html',
  styleUrls: ['./dispatch.component.css']
})
export class DispatchComponent implements OnInit, AfterViewInit, OnDestroy {
  private subscriptions: Subscription = new Subscription();
  private target: any = {};
  private authToken: string = '';
  userData: any = {};
  userList: any = [];
  doctorList: any = [];
  callLinkError: string = '';

  constructor(
    private authService: AuthService,
    private socketioService: SocketioService
  ) { }

  ngOnInit(): void {
    // this.subscriptions.add(this.authService.compareToken(localStorage.getItem('id_token')!));
    this.subscriptions.add(this.authService.userData.subscribe(_user => this.userData = _user));
    this.subscriptions.add(this.socketioService.userList.subscribe(_list => this.userList = _list));
    this.subscriptions.add(this.socketioService.doctorList.subscribe(_list => this.doctorList = _list));
    this.subscriptions.add(this.authService.authToken.subscribe(_token => this.authToken = _token));
  }
  
  ngAfterViewInit(): void {
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  // ======================
  // || Helper Functions ||
  // ======================

  clearModalEntry(form: NgForm): void {
    form.reset({ callLink: '' });
    $('#callLink').val('');
  };

  storeTarget(target: any): void {
    this.target = target;
  };

  // =======================
  // || General Functions ||
  // =======================

  onChangeStatus(status: string): void {
    this.socketioService.emitStatus(status);
  };

  onChangeCallLink(form: NgForm): void {
    $('#callLinkErrorContainer').css('display', 'none');
    const link = form.value.callLink.trim();

    if (!link) {
      this.callLinkError = 'Please enter a link in the above field';
      $('#callLinkErrorContainer').css('display', 'inline');
      return;
    };

    const payload = {
      _id: this.userData._id,
      targetId: this.target._id,
      target: 'videoCall',
      change: link
    };

    this.authService.editUser(payload, this.authToken).subscribe(_user => {
      if (!_user.success) {
        this.callLinkError = _user.msg;
        $('#callLinkErrorContainer').css('display', 'inline');
        return;
      };

      this.socketioService.emitLink(link);
      $('#callLinkSuccessContainer').css('display', 'inline');
      
      setTimeout(() => {
        this.clearModalEntry(form);
        $('#callLinkSuccessContainer').css('display', 'none');
        (<any>$('#editCallLink')).modal('toggle');
      }, 1000);
    });
  };
}
