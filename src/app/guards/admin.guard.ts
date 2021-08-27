import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, RouterStateSnapshot, UrlTree } from '@angular/router';
import { Observable } from 'rxjs';

import { AuthService } from '../services/auth.service';
import { RedirectService } from '../services/redirect.service';

@Injectable({
  providedIn: 'root'
})
export class AdminGuard implements CanActivate {

  constructor(
    private authService: AuthService,
    private redirectService: RedirectService
  ) {}

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree {
    const localUser = localStorage.getItem('user');
    const user = !!localUser ? JSON.parse(localUser) : null;
    const authToken = localStorage.getItem('id_token');

    if (!user || !authToken) {
      this.redirectService.handleRedirect('home');
      return false;
    };

    this.authService.verifyAdmin({ _id: user._id }, authToken).subscribe(_status => {
      console.log(_status.status)
      return _status.status === 200 ? true : false;
    })
    return true;
  };
  
}
