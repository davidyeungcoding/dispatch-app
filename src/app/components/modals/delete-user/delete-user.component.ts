import { AfterViewInit, Component, OnDestroy, OnInit, Input } from '@angular/core';
import { NgForm } from '@angular/forms';

import { AuthService } from 'src/app/services/auth.service';
import { SocketioService } from 'src/app/services/socketio.service';
import { EditAccountService } from 'src/app/services/edit-account.service';
import { UserDataService } from 'src/app/services/user-data.service';

import { Subscription } from 'rxjs';

@Component({
  selector: 'app-delete-user',
  templateUrl: './delete-user.component.html',
  styleUrls: ['./delete-user.component.css']
})
export class DeleteUserComponent implements OnInit, OnDestroy, AfterViewInit {
  @Input() targetAccount: any;
  @Input() accountList: any;
  @Input() action: any;
  private subscriptions: Subscription = new Subscription();
  private userData: any = null;
  private token: string = '';
  errorMessage: string = '';
  successMessage: string = '';

  constructor(
    private authService: AuthService,
    private socketioService: SocketioService,
    private editAccountService: EditAccountService,
    private userDataService: UserDataService
  ) { }

  ngOnInit(): void {
    this.subscriptions.add(this.userDataService.userData.subscribe(_user => this.userData = _user));
    this.subscriptions.add(this.userDataService.authToken.subscribe(_token => this.token = _token));
  }
  
  ngAfterViewInit(): void {
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  // ======================
  // || Helper Functions ||
  // ======================

  onDeleteOwnAccount(form: NgForm): boolean {
    if (this.userData._id === this.targetAccount._id) {
      this.errorMessage = 'Cannot delete your own account';
      $('#confirmError').css('display', 'inline');

      setTimeout(() => {
        form.reset({ username: '', password: '' });
        $('#confirmError').css('display', 'none');
        (<any>$('#confirmModal')).modal('hide');
      }, 1500);

      return true;
    };

    return false;
  };

  removeUserFromList(id: string): void {
    for (let i = 0; i < this.accountList.length; i++) {
      const element = this.accountList[i];

      if (element._id === id) {
        this.accountList.splice(i, 1);
        break;
      };
    };
  };

  checkFilledForm(form: NgForm, username: string, password: string): boolean {
    if (!username || !password) {
      this.errorMessage = 'Please be sure to fill out all fields';
      $('#confirmError').css('display', 'inline');
      form.reset({ username: username, password: '' });
      return true;
    } else return false;
  };

  // =======================
  // || General Functions ||
  // =======================

  onDeleteAccount(form: NgForm, payload: any): void {
    if (this.onDeleteOwnAccount(form)) return;

    this.editAccountService.deleteUser(payload, this.token).subscribe(_res => {
      if (!_res.success) {
        this.errorMessage = _res.msg;
        $('#confirmError').css('display', 'inline');
        form.reset({ username: payload.username, password: '' });
        return;
      };

      this.socketioService.emitDeleteUser(this.targetAccount._id);
      if (_res.token) this.userDataService.changeAuthToken(_res.token);
      this.removeUserFromList(payload.targetId);
      this.successMessage = _res.msg;
      $('#confirmSuccess').css('display', 'inline');

      setTimeout(() => {
        $('#confirmSuccess').css('display', 'none');
        form.reset({ username: '', password: '' });
        (<any>$('#confirmModal')).modal('hide');
      }, 1000);
    });
  };

  onResetPassword(form: NgForm, payload: any): void {
    this.editAccountService.resetPassword(payload, this.token).subscribe(_res => {
      if (!_res.success) {
        this.errorMessage = _res.msg;
        $('#confirmError').css('display', 'inline');
        form.reset({ username: payload.username, password: '' });
        return;
      };

      if (_res.toekn) this.userDataService.changeAuthToken(_res.token);
      this.successMessage = _res.msg;
      $('#confirmSuccess').css('display', 'inline');
      form.reset({ username: '', password: '' });
    });
  };

  onSubmitConfirm(form: NgForm): void {
    $('.msg-container').css('display', 'none');
    const username = form.value.username.trim();
    const password = form.value.password.trim();
    if (this.checkFilledForm(form, username, password)) return;

    const payload = {
      username: username,
      password: password,
      targetId: this.targetAccount._id
    };

    switch (this.action) {
      case 'delete':
        this.onDeleteAccount(form, payload);
        break;
      case 'reset':
        this.onResetPassword(form, payload);
        break;
    };
  };
}
