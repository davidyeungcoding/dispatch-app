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
  accountsList: any = [];

  constructor(
    private redirectService: RedirectService,
    private searchService: SearchService,
    private authService: AuthService
  ) { }

  ngOnInit(): void {
    this.subscriptions.add(this.searchService.accountList.subscribe(_list => this.accountsList = _list));
    this.subscriptions.add(this.authService.authToken.subscribe(_token => this.token = _token));
  }

  ngAfterViewInit(): void {
    this.searchService.getFullAccountList(this.token).subscribe(_list => console.log(_list));
    console.log(this.accountsList)
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  onCancel(): void {
    this.redirectService.handleRedirect('dispatch');
  };
}
