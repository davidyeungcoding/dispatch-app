import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

import { AuthService } from 'src/app/services/auth.service';
import { RedirectService } from 'src/app/services/redirect.service';
import { UserDataService } from 'src/app/services/user-data.service';

import { Subscription } from 'rxjs'; 

@Component({
  selector: 'app-nav',
  templateUrl: './nav.component.html',
  styleUrls: ['./nav.component.css']
})
export class NavComponent implements OnInit, OnDestroy {
  private subscriptions: Subscription = new Subscription();
  private userData: any = null;
  currentUser: any = {};

  constructor(
    private authService: AuthService,
    private redirectService: RedirectService,
    private userDataService: UserDataService,
    private route: ActivatedRoute
  ) { }

  ngOnInit(): void {
    this.subscriptions.add(this.userDataService.userData.subscribe(_user => this.currentUser = _user));
    this.subscriptions.add(this.userDataService.userData.subscribe(_user => this.userData = _user));
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  onLogout(): void {
    const user = this.userData ? this.userData : this.authService.parseLocalStorageUser();
    this.authService.logout(user);
  };

  onRedirect(destination: string): void {
    const current = this.route.snapshot.routeConfig?.path;
    if (current === destination) (<any>$('#offcanvasNav')).offcanvas('hide');
    this.redirectService.handleRedirect(destination);
  };
}
