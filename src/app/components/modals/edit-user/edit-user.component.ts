import { Component, Input, OnInit } from '@angular/core';
import { NgForm } from '@angular/forms';

@Component({
  selector: 'app-edit-user',
  templateUrl: './edit-user.component.html',
  styleUrls: ['./edit-user.component.css']
})
export class EditUserComponent implements OnInit {
  @Input() targetEdit: any;
  @Input() activeName: any;
  @Input() activeUsername: any;
  @Input() activeVideoCall: any;
  editErrorMessage: string = '';
  editSuccessMessage: string = '';

  constructor() { }

  ngOnInit(): void {
  }

  // ======================
  // || Helper Functions ||
  // ======================

  resetForm(form: NgForm): void {
    const payload: any = {
      name: form.value.name.trim(),
      userName: form.value.userName.trim(),
      // accountType: form.value.accountType,
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
      // accountType: form.value.accountType,
      editAdminUsername: '',
      editAdminPassword: ''
    };

    if (this.targetEdit.accountType === 'doctor') payload.videoCall = '';
    form.reset(payload);
  };

  checkForChanges(name: string, username: string): boolean { // need to come back and add accounting for account type
    if (name && this.activeName || username && this.activeUsername) return true;
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
    console.log(form.value);
    $('.msg-container').css('display', 'none');
    const adminUsername = form.value.editAdminUsername.trim();
    const adminPassword = form.value.editAdminPassword.trim();
    const name = form.value.name.trim();
    const username = form.value.userName.trim();
    // const accountType = form.value.editAccountType;
    let validForm = true;
    
    if (!this.checkForChanges(name, username)) {
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
        this.activeName = !this.activeName;
        break;
      case 'userName':
        this.activeUsername = !this.activeUsername;
        break;
      case 'videoCall':
        this.activeVideoCall = !this.activeVideoCall;
        break;
    };
  };
}
