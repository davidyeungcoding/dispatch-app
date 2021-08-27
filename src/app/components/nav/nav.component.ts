import { Component, OnDestroy, OnInit } from '@angular/core';

import { AuthService } from 'src/app/services/auth.service';
import { RedirectService } from 'src/app/services/redirect.service';

import { Subscription } from 'rxjs'; 

@Component({
  selector: 'app-nav',
  templateUrl: './nav.component.html',
  styleUrls: ['./nav.component.css']
})
export class NavComponent implements OnInit, OnDestroy {
  private subscriptions: Subscription = new Subscription();
  currentUser: any = {};

  constructor(
    private authService: AuthService,
    private redirectService: RedirectService
  ) { }

  ngOnInit(): void {
    this.subscriptions.add(this.authService.userData.subscribe(_user => this.currentUser = _user));
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  onLogout(): void {
    this.authService.logout();
  };

  onRedirect(destination: string): void {
    this.redirectService.handleRedirect(destination);
  };
}
