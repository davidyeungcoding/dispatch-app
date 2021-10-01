import { AfterViewInit, Component, OnDestroy, OnInit } from '@angular/core';
import { NgForm } from '@angular/forms';

import { RedirectService } from 'src/app/services/redirect.service';
import { SearchService } from 'src/app/services/search.service';
import { AuthService } from 'src/app/services/auth.service';
import { EditAccountService } from 'src/app/services/edit-account.service';

import { Subscription } from 'rxjs';

@Component({
  selector: 'app-user-management',
  templateUrl: './user-management.component.html',
  styleUrls: ['./user-management.component.css']
})
export class UserManagementComponent implements OnInit, AfterViewInit, OnDestroy {
  private subscriptions: Subscription = new Subscription();
  private token: string = '';
  private currentOrder: string = 'name';
  private reverse: boolean = false;
  private userData: any = null;
  errorMessage: string = '';
  successMessage: string = '';
  targetUser: any = null;
  accountList: any = [];

  constructor(
    private redirectService: RedirectService,
    private searchService: SearchService,
    private authService: AuthService,
    private editAccountService: EditAccountService
  ) { }

  ngOnInit(): void {
    this.subscriptions.add(this.searchService.accountList.subscribe(_list => this.accountList = _list));
    this.subscriptions.add(this.authService.authToken.subscribe(_token => this.token = _token));
    this.subscriptions.add(this.authService.userData.subscribe(_user => this.userData = _user));
    this.getAccountList(this.token);
  }

  ngAfterViewInit(): void {
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  // ======================
  // || Helper Functions ||
  // ======================

  sortList(list: any, term: string): any {
    return list.sort((a: any, b: any) => {
      const parseA = !!a[term] ? a[term].toUpperCase() : '';
      const parseB = !!b[term] ? b[term].toUpperCase() : '';
      
      return parseA < parseB ? -1
      : parseA > parseB ? 1
      : 0;
    });
  };

  assignActiveSort(term: string, match: boolean): void {
    this.reverse ? $(`#${this.currentOrder}Reverse`).removeClass('active-sort')
    : $(`#${this.currentOrder}Normal`).removeClass('active-sort');
    
    match && !this.reverse ? $(`#${term}Reverse`).addClass('active-sort')
    : $(`#${term}Normal`).addClass('active-sort');
  };

  onDeleteOwnAccount(): boolean {
    if (this.userData._id === this.targetUser._id) {
      this.errorMessage = 'Cannot delete your own account';
      $('#deleteError').css('display', 'inline');

      setTimeout(() => {
        $('#deleteError').css('display', 'none');
        (<any>$('#confirmDeletion')).modal('toggle');
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

  // =======================
  // || General Functions ||
  // =======================

  getAccountList(token: string): void {
    this.searchService.getFullAccountList(token).subscribe(_list => {
      this.accountList = this.sortList(_list.msg, 'name');
    });
  };

  onCancel(): void {
    this.redirectService.handleRedirect('dispatch');
  };

  onSortBy(term: string): void {
    if (this.currentOrder === term) {
      this.assignActiveSort(term, true);
      this.reverse = !this.reverse;
      this.accountList.reverse();
      return
    };
    
    this.assignActiveSort(term, false);
    this.reverse = false;
    this.currentOrder = term;
    this.sortList(this.accountList, term);
  };

  onMarkedForDeletion(user: any): void {
    this.targetUser = user;
  };
  
  onDeleteAccount(form: NgForm): void {
    if (this.onDeleteOwnAccount()) return;
    $('.msg-container').css('display', 'none');
    const username = form.value.username.trim();
    const password = form.value.password.trim();

    if (!username || !password) {
      this.errorMessage = 'Please be sure to fill out all fields'
      $('#deleteError').css('display', 'inline');
      form.reset({ username: username, password: '' });
      return;
    };

    const payload = {
      username: username,
      password: password,
      targetId: this.targetUser._id
    };

    this.editAccountService.deleteUser(payload, this.token).subscribe(_res => {
      if (!_res.success) {
        this.errorMessage = _res.msg;
        $('#deleteError').css('display', 'inline');
        form.reset({ username: username, password: '' });
        return;
      };

      if (_res.token) this.authService.changeAuthToken(_res.token);
      this.removeUserFromList(payload.targetId);
      this.successMessage = _res.msg;
      $('#deleteSuccess').css('display', 'inline');

      setTimeout(() => {
        $('#deleteSuccess').css('display', 'none');
        form.reset({ username: '', password: '' });
        this.targetUser = null;
        (<any>$('#confirmDeletion')).modal('toggle');
      }, 1000);
    });
  };

  onEditUser(user: any): void {
    console.log(user)
  };
}
