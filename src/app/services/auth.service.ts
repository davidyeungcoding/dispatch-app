import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';

import { JwtHelperService } from '@auth0/angular-jwt';
import { RedirectService } from './redirect.service';

import { of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private api = 'http://localhost:3000/users';
  private httpOptions = {
    headers: new HttpHeaders({
      'Content-Type': 'application/json'
    })
  };
  private jwt: JwtHelperService = new JwtHelperService();

  // =================
  // || Observables ||
  // =================

  private authTokenSource = new BehaviorSubject<any>(null);
  authToken = this.authTokenSource.asObservable();
  private userDataSource = new BehaviorSubject<any>({});
  userData = this.userDataSource.asObservable();

  constructor(
    private http: HttpClient,
    private redirectService: RedirectService
  ) { }

  // =====================
  // || Router Requests ||
  // =====================

  authenticateUser(payload: any) {
    return this.http.post(`${this.api}/authenticate`, payload, this.httpOptions).pipe(
      catchError(err => of(err))
    );
  };

  validateToken(token: string) {
    const validateHeaders = {
      headers: new HttpHeaders({
        'Authorization': `${token}`
      })
    };

    return this.http.get(`${this.api}/verify-token`, validateHeaders).pipe(
      catchError(err => of(err))
    );
  };

  // ======================
  // || Shared Functions ||
  // ======================

  setLocalStorageUser(token: string, user: any): void {
    localStorage.setItem('id_token', token);
    localStorage.setItem('user', user);
  };

  isExpired(token: string): boolean {
    return this.jwt.isTokenExpired(token);
  };

  expirationDate(token: string): any { // delete later
    return this.jwt.getTokenExpirationDate(token);
  };

  logout(): void {
    this.changeAuthToken(null);
    this.changeUserData(null);
    localStorage.clear();
  };

  compareToken(token: string): void {
    this.validateToken(token).subscribe(res => {
      if (res.status !== 200) this.redirectService.handleRedirect('home');
    });
  };

  // ============================
  // || Change Observable Data ||
  // ============================

  changeAuthToken(token: string | null): void {
    this.authTokenSource.next(token);
  };

  changeUserData(user: any): void {
    let payload: any = {
      _id: user._id,
      username: user.username,
      name: user.name,
      accountType: user.accountType
    };

    if (user.accountType === 'doctor') {
      payload.status = user.status,
      payload.videoCall = user.videoCall
    };

    this.userDataSource.next(payload);
  };
}
