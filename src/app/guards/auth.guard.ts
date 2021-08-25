import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, RouterStateSnapshot, UrlTree } from '@angular/router';

import { AuthService } from '../services/auth.service';
import { RedirectService } from '../services/redirect.service';

import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {
  
  constructor(
    private authService: AuthService,
    private redirectService: RedirectService
  ) {}

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree {
    const authToken = localStorage.getItem('id_token');

    if (!!authToken) {
      try {
        return !this.authService.isExpired(authToken);
      } catch {
        this.redirectService.handleRedirect('home');
        return false;
      };
    };
    
    this.redirectService.handleRedirect('home');
    return false;
  };
  
}
