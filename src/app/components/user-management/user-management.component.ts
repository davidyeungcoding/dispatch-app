import { AfterViewInit, Component, OnDestroy, OnInit } from '@angular/core';

import { RedirectService } from 'src/app/services/redirect.service';
import { SearchService } from 'src/app/services/search.service';
import { EditAccountService } from 'src/app/services/edit-account.service';
import { UserDataService } from 'src/app/services/user-data.service';

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
  activeName: boolean = false;
  activeUsername: boolean = false;
  activeVideoCall: boolean = false;
  activeAccountType: boolean = false;
  targetEdit: any = null;
  targetAccount: any = null;
  action: string = '';
  errorMessage: string = '';
  successMessage: string = '';
  accountList: any = [];
  editRequest: string = '';

  constructor(
    private redirectService: RedirectService,
    private searchService: SearchService,
    private editAccountService: EditAccountService,
    private userDataService: UserDataService
  ) { }

  ngOnInit(): void {
    this.subscriptions.add(this.searchService.accountList.subscribe(_list => this.accountList = _list));
    this.subscriptions.add(this.userDataService.authToken.subscribe(_token => this.token = _token));
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

  onMarkedUser(user: any, action: string): void {
    $('.msg-container').css('display', 'none');
    this.editRequest = action === 'delete' ? 'Delete User' : 'Reset Password';
    this.targetAccount = user;
    this.action = action;
  };

  onMarkedForEdit(user: any): void {
    $('.msg-container').css('display', 'none');
    this.targetEdit = user;
    this.editAccountService.resetActive();
    $('.edit-input').addClass('hide-content');
  };
}
