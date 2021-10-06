import { AfterViewInit, Component, OnDestroy, OnInit, Input } from '@angular/core';
import { NgForm } from '@angular/forms';

import { AuthService } from 'src/app/services/auth.service';
import { SocketioService } from 'src/app/services/socketio.service';
import { EditAccountService } from 'src/app/services/edit-account.service';

import { Subscription } from 'rxjs';

@Component({
  selector: 'app-delete-user',
  templateUrl: './delete-user.component.html',
  styleUrls: ['./delete-user.component.css']
})
export class DeleteUserComponent implements OnInit, OnDestroy, AfterViewInit {
  @Input() targetDelete: any;
  @Input() accountList: any;
  private subscriptions: Subscription = new Subscription();
  private userData: any = null;
  private token: string = '';
  errorMessage: string = '';
  successMessage: string = '';

  constructor(
    private authService: AuthService,
    private socketioService: SocketioService,
    private editAccountService: EditAccountService
  ) { }

  ngOnInit(): void {
    this.subscriptions.add(this.authService.userData.subscribe(_user => this.userData = _user));
    this.subscriptions.add(this.authService.authToken.subscribe(_token => this.token = _token));
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
    if (this.userData._id === this.targetDelete._id) {
      this.errorMessage = 'Cannot delete your own account';
      $('#deleteError').css('display', 'inline');

      setTimeout(() => {
        form.reset({ username: '', password: '' });
        $('#deleteError').css('display', 'none');
        (<any>$('#confirmDeletion')).modal('hide');
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
      $('#deleteError').css('display', 'inline');
      form.reset({ username: username, password: '' });
      return true;
    } else return false;
  };

  // =======================
  // || General Functions ||
  // =======================
  
  onDeleteAccount(form: NgForm): void {
    if (this.onDeleteOwnAccount(form)) return;
    $('.msg-container').css('display', 'none');
    const username = form.value.username.trim();
    const password = form.value.password.trim();
    if (this.checkFilledForm(form, username, password)) return;

    const payload = {
      username: username,
      password: password,
      targetId: this.targetDelete._id
    };

    this.editAccountService.deleteUser(payload, this.token).subscribe(_res => {
      if (!_res.success) {
        this.errorMessage = _res.msg;
        $('#deleteError').css('display', 'inline');
        form.reset({ username: username, password: '' });
        return;
      };

      this.socketioService.emitDeleteUser(this.targetDelete._id);
      if (_res.token) this.authService.changeAuthToken(_res.token);
      this.removeUserFromList(payload.targetId);
      this.successMessage = _res.msg;
      $('#deleteSuccess').css('display', 'inline');

      setTimeout(() => {
        $('#deleteSuccess').css('display', 'none');
        form.reset({ username: '', password: '' });
        (<any>$('#confirmDeletion')).modal('hide');
      }, 1000);
    });
  };
}
