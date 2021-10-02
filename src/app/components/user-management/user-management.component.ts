import { AfterViewInit, Component, OnDestroy, OnInit } from '@angular/core';

import { RedirectService } from 'src/app/services/redirect.service';
import { SearchService } from 'src/app/services/search.service';
import { AuthService } from 'src/app/services/auth.service';

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
  targetEdit: any = null;
  targetDelete: any = null;
  errorMessage: string = '';
  successMessage: string = '';
  accountList: any = [];

  constructor(
    private redirectService: RedirectService,
    private searchService: SearchService,
    private authService: AuthService
  ) { }

  ngOnInit(): void {
    this.subscriptions.add(this.searchService.accountList.subscribe(_list => this.accountList = _list));
    this.subscriptions.add(this.authService.authToken.subscribe(_token => this.token = _token));
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

  onMarkedForDeletion(user: any): void {
    this.targetDelete = user;
  };

  onMarkedForEdit(user: any): void {
    this.targetEdit = user;
  };
}
