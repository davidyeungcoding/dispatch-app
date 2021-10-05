import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { NgForm } from '@angular/forms';

import { EditAccountService } from 'src/app/services/edit-account.service';

import { Subscription } from 'rxjs';

@Component({
  selector: 'app-edit-user',
  templateUrl: './edit-user.component.html',
  styleUrls: ['./edit-user.component.css']
})
export class EditUserComponent implements OnInit, OnDestroy {
  @Input() targetEdit: any;
  private subscriptions: Subscription = new Subscription();
  activeName: boolean = false;
  activeUsername: boolean = false;
  activeVideoCall: boolean = false;
  activeAccountType: boolean = false;
  editErrorMessage: string = '';
  editSuccessMessage: string = '';

  constructor(
    private editAccountService: EditAccountService
  ) { }

  ngOnInit(): void {
    this.subscriptions.add(this.editAccountService.activeName.subscribe(_activeName => this.activeName = _activeName));
    this.subscriptions.add(this.editAccountService.activeUsername.subscribe(_activeUsername => this.activeUsername = _activeUsername));
    this.subscriptions.add(this.editAccountService.activeVideoCall.subscribe(_activeVideoCall => this.activeVideoCall = _activeVideoCall));
    this.subscriptions.add(this.editAccountService.activeAccountType.subscribe(_activeAccountType => this.activeAccountType = _activeAccountType));
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

    const payload: any = {
      user: {},
      admin: {
        username: adminUsername,
        password: adminPassword
      }
    };

    if (this.activeName && name) payload.user.name = name;
    if (this.activeUsername && username) payload.user.username = username;
    if (this.activeAccountType && accountType) payload.user.accountType = accountType;
    if (this.activeVideoCall) payload.user.videoCall = form.value.videoCall.trim();
    this.editSuccessMessage = 'User successfully udpated';
    $('#editSuccess').css('display', 'inline');

    setTimeout(() => {
      $('#editSuccess').css('display', 'none');
      this.clearForm(form);
      (<any>$('#editUser')).modal('hide');
    }, 1000);
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
