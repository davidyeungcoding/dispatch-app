import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { NgForm } from '@angular/forms';

import { EditAccountService } from 'src/app/services/edit-account.service';
import { RedirectService } from 'src/app/services/redirect.service';
import { SearchService } from 'src/app/services/search.service';
import { AuthService } from 'src/app/services/auth.service';

import { Subscription } from 'rxjs';

@Component({
  selector: 'app-edit-user',
  templateUrl: './edit-user.component.html',
  styleUrls: ['./edit-user.component.css']
})
export class EditUserComponent implements OnInit, OnDestroy {
  @Input() targetEdit: any;
  @Input() accountList: any;
  private subscriptions: Subscription = new Subscription();
  private token: string = '';
  private userData: any = null;
  activeName: boolean = false;
  activeUsername: boolean = false;
  activeVideoCall: boolean = false;
  activeAccountType: boolean = false;
  editErrorMessage: string = '';
  editSuccessMessage: string = 'User successfully udpated';

  constructor(
    private editAccountService: EditAccountService,
    private redirectService: RedirectService,
    private authService: AuthService
  ) { }

  ngOnInit(): void {
    this.subscriptions.add(this.editAccountService.activeName.subscribe(_activeName => this.activeName = _activeName));
    this.subscriptions.add(this.editAccountService.activeUsername.subscribe(_activeUsername => this.activeUsername = _activeUsername));
    this.subscriptions.add(this.editAccountService.activeVideoCall.subscribe(_activeVideoCall => this.activeVideoCall = _activeVideoCall));
    this.subscriptions.add(this.editAccountService.activeAccountType.subscribe(_activeAccountType => this.activeAccountType = _activeAccountType));
    this.subscriptions.add(this.authService.authToken.subscribe(_token => this.token = _token));
    this.subscriptions.add(this.authService.userData.subscribe(_user => this.userData = _user));
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  // ======================
  // || Helper Functions ||
  // ======================

  resetForm(form: NgForm): void {
    const payload: any = {
      name: form.value.name.trim(),
      userName: form.value.userName.trim(),
      accountType: form.value.accountType,
      editAdminUsername: form.value.editAdminUsername.trim(),
      editAdminPassword: ''
    };

    if (this.targetEdit.accountType === 'doctor') payload.videoCall = form.value.videoCall.trim();
    form.reset(payload);
  };

  clearForm(form: NgForm): void {
    const payload: any = {
      name: '',
      userName: '',
      accountType: '',
      editAdminUsername: '',
      editAdminPassword: ''
    };

    if (this.targetEdit.accountType === 'doctor') payload.videoCall = '';
    form.reset(payload);
  };

  checkForChanges(name: string, username: string, accountType: string): boolean {
    if (name && this.activeName || username && this.activeUsername || accountType && this.activeAccountType) return true;
    this.editErrorMessage = 'No changes detected';
    return false;
  };

  doctorFormCheck(form: NgForm): boolean {
    return form.value.videoCall.trim() && this.activeVideoCall ? true : false;
  };

  checkForAdminCredentials(adminUsername: string, adminPassword: string): boolean {
    if (!adminUsername || !adminPassword) {
      this.editErrorMessage = 'Plese be sure to fill out admin credientials';
      return false;
    };

    return true;
  };

  buildPayload(form: NgForm, name: string, username: string, accountType: string,
    adminUsername: string, adminPassword: string): any {
    const payload: any = {
      user: {
        _id: this.targetEdit._id
      },
      admin: {
        username: adminUsername,
        password: adminPassword
      }
    };

    if (this.activeName && name) payload.user.name = name;
    if (this.activeUsername && username) payload.user.username = username;
    if (this.activeAccountType && accountType) payload.user.accountType = accountType;
    if (this.activeVideoCall) payload.user.videoCall = form.value.videoCall.trim();
    return payload;
  };

  replaceUser(user: any): void {
    const index = this.accountList.findIndex((element: any) => element._id === this.targetEdit._id);
    this.accountList[index] = user;
  };

  // =======================
  // || General Functions ||
  // =======================

  onSubmitChange(form: NgForm): void {
    $('.msg-container').css('display', 'none');
    const adminUsername = form.value.editAdminUsername.trim();
    const adminPassword = form.value.editAdminPassword.trim();
    const name = form.value.name.trim();
    const username = form.value.userName.trim();
    const accountType = form.value.accountType;
    let validForm = true;
    
    if (!this.checkForChanges(name, username, accountType)) {
      validForm = this.targetEdit.accountType === 'doctor'
      && this.doctorFormCheck(form) ? true : false;
    };

    validForm = validForm ? this.checkForAdminCredentials(adminUsername, adminPassword)
    : false;
    
    if (!validForm) {
      this.resetForm(form);
      $('#editError').css('display', 'inline');
      return;
    };

    const payload = this.buildPayload(form, name, username, accountType, adminUsername, adminPassword);

    this.editAccountService.updateUser(payload, this.token).subscribe(_user => {
      if (_user.token) this.authService.changeAuthToken(_user.token);

      if (!_user.success) {
        this.editErrorMessage = _user.msg;
        $('#editError').css('display', 'inline');

        if (_user.status === 400) {
          setTimeout(() => {
            (<any>$('#editUser')).modal('hide');
            this.authService.logout();
          }, 2000);
        } else if (_user.status === 401 && _user.msg !== 'Username and password mismatch') {
          setTimeout(() => {
            (<any>$('#editUser')).modal('hide');
            this.redirectService.handleRedirect('dispatch');
          }, 2000);
        };

        return;
      };

      // insert socketio update
      if (this.targetEdit._id === this.userData._id) this.authService.changeUserData(_user.user);
      this.replaceUser(_user.user);
      $('#editSuccess').css('display', 'inline');
  
      setTimeout(() => {
        $('#editSuccess').css('display', 'none');
        this.clearForm(form);
        (<any>$('#editUser')).modal('hide');
      }, 1000);
    });
  };

  makeVisible(target: string): void {
    $(`#${target}`)[0].classList.contains('form-input') ? $(`#${target}`).removeClass('form-input')
    : $(`#${target}`).addClass('form-input');

    switch (target) {
      case 'name':
        this.editAccountService.changeActiveName(!this.activeName);
        break;
      case 'userName':
        this.editAccountService.changeActiveUsername(!this.activeUsername);
        break;
      case 'videoCall':
        this.editAccountService.changeActiveVideoCall(!this.activeVideoCall);
        break;
      case 'accountType':
        this.editAccountService.changeActiveAccountType(!this.activeAccountType);
        break;
    };
  };
}
