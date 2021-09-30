import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';

import { JwtHelperService } from '@auth0/angular-jwt';
import { RedirectService } from './redirect.service';
import { SocketioService } from './socketio.service';
import { ChatService } from './chat.service';

import { catchError } from 'rxjs/operators';
import { BehaviorSubject, of } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private api = 'http://localhost:3000/users'; // dev
  // private api = 'users'; // production
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
  private userDataSource = new BehaviorSubject<any>(null);
  userData = this.userDataSource.asObservable();

  constructor(
    private http: HttpClient,
    private redirectService: RedirectService,
    private socketioService: SocketioService,
    private chatService: ChatService
  ) { }

  // =====================
  // || Router Requests ||
  // =====================

  createUser(payload: any, token: string) {
    const validateHeader = this.buildHeader(token);

    return this.http.post(`${this.api}/create`, payload, validateHeader).pipe(
      catchError(err => of(err))
    );
  };

  authenticateUser(payload: any) {
    return this.http.post(`${this.api}/authenticate`, payload, this.httpOptions).pipe(
      catchError(err => of(err))
    );
  };

  validateToken(token: string) {
    const validateHeader = {
      headers: new HttpHeaders({
        'Authorization': `${token}`
      })
    };

    return this.http.get(`${this.api}/verify-token`, validateHeader).pipe(
      catchError(err => of(err))
    );
  };

  verifyAdmin(id: any, token: string) {
    const validateHeader = this.buildHeader(token);

    return this.http.post(`${this.api}/verify-admin`, id, validateHeader).pipe(
      catchError(err => of(err))
    );
  };

  onLogout(id: string) {
    return this.http.get(`${this.api}/logout?_id=${id}`).pipe(
      catchError(err => of(err))
    );
  };

  requestNewToken(user: string) {
    return this.http.get(`${this.api}/request-new-token?user=${user}`).pipe(
      catchError(err => of(err))
    );
  };

  // ======================
  // || Helper Functions ||
  // ======================

  buildHeader(token: string) {
    const validateHeader = {
      headers: new HttpHeaders({
        'Authorization': token,
        'Content-Type': 'application/json'
      })
    };
    return validateHeader;
  };

  adminCheckParser(id: string, token: string): Promise<boolean> {
    return new Promise(resolve => {
      this.verifyAdmin({ _id: id }, token).subscribe(_status => {
        if (_status.token) localStorage.setItem('id_token', _status.token);
        return resolve(_status.status === 200 ? true : false);
      });
    });
  };

  parseLocalStorageUser(): any {
    let user = localStorage.getItem('user');
    
    if (user) {
      try { user = JSON.parse(user) }
      catch { user = null };
    };

    return user;
  };

  compareToken(token: string): Promise<boolean> {
    return new Promise(resolve => {
      this.validateToken(token).subscribe(res => {
        if (res.token) this.changeAuthToken(res.token);
        return resolve(res.status === 200 ? true : false);
      });
    });
  };

  // ======================
  // || Shared Functions ||
  // ======================

  setLocalStorageUser(token: string, user: string): void {
    localStorage.setItem('id_token', token);
    localStorage.setItem('user', user);
  };

  async isExpired(token: string): Promise<any> {
    const expired = this.jwt.isTokenExpired(token);
    if (!expired) return expired;

    const expiredCheck = await new Promise(resolve => {
      this.requestNewToken(JSON.stringify(this.userDataSource.value)).subscribe(res => {
        if (!res.success) return resolve(true);
        this.changeAuthToken(res.token);
        return resolve(false);
      });
    });

    return expiredCheck;
  };

  logout(): void {
    const user = this.userDataSource.value ? this.userDataSource.value
    : this.parseLocalStorageUser();

    if (user) {
      this.socketioService.emitLogout(user);
      this.onLogout(user._id).subscribe(_user => {});
    };

    this.chatService.changeOpenChats([]);
    this.redirectService.handleRedirect('home');
    this.changeAuthToken(null);
    this.changeUserData(null);
    localStorage.clear();
  };

  onReload(): void {
    if (this.userDataSource.value && this.authTokenSource.value) return;
    const localUser = this.parseLocalStorageUser();
    const localToken = localStorage.getItem('id_token');

    if (localUser && localToken) {
      this.changeAuthToken(localStorage.getItem('id_token'));
      this.changeUserData(localUser);
      this.socketioService.emitLogin(this.userDataSource.value);
      return;
    };
    
    this.logout();
  };

  // =======================
  // || Auth Guard Checks ||
  // =======================

  async handleDispatchCheck(): Promise<boolean> {
    const token = this.authTokenSource.value ? this.authTokenSource.value
    : localStorage.getItem('id_token');
    if (!token) return this.redirectService.falseCheckRedirect('home');
    const valid = await this.compareToken(token);
    const expired = await this.isExpired(token);

    if (expired || !valid) {
      this.logout();
      return false;
    };

    return true;
  };

  async handleAdminCheck(): Promise<boolean> {
    const token = this.authTokenSource.value ? this.authTokenSource.value
    : localStorage.getItem('id_token');
    let user = this.userDataSource.value ? this.userDataSource.value
    : localStorage.getItem('user');
    if (!user || !token) return this.redirectService.falseCheckRedirect('home');
    if (typeof(user) === 'string') user = JSON.parse(user);
    const check = await this.adminCheckParser(user._id, token);
    if (!check) this.logout();
    return check;
  };

  // ========================
  // || Change Observables ||
  // ========================

  changeAuthToken(token: string | null): void {
    this.authTokenSource.next(token);
    if (token) localStorage.setItem('id_token', token);
  };

  changeUserData(user: any): void {
    if (!user) return this.userDataSource.next(null);
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
    localStorage.setItem('user', JSON.stringify(payload));
  };
}
