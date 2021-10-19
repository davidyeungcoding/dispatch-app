import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';

import { JwtHelperService } from '@auth0/angular-jwt';
import { RedirectService } from './redirect.service';
import { SocketioService } from './socketio.service';
import { ChatService } from './chat.service';
import { EditAccountService } from './edit-account.service';
import { UserDataService } from './user-data.service';

import { catchError } from 'rxjs/operators';
import { BehaviorSubject, of } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  // private api = 'http://localhost:3000/users'; // dev
  private api = 'users'; // production
  private httpOptions = {
    headers: new HttpHeaders({
      'Content-Type': 'application/json'
    })
  };
  private jwt: JwtHelperService = new JwtHelperService();

  // =================
  // || Observables ||
  // =================

  // private authTokenSource = new BehaviorSubject<any>(null);
  // authToken = this.authTokenSource.asObservable();
  // private userDataSource = new BehaviorSubject<any>(null);
  // userData = this.userDataSource.asObservable();

  constructor(
    private http: HttpClient,
    private redirectService: RedirectService,
    private socketioService: SocketioService,
    private chatService: ChatService,
    private editAccountService: EditAccountService,
    private userDataService: UserDataService
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
        if (res.token) this.userDataService.changeAuthToken(res.token);
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

  async isExpired(token: string, user: any): Promise<any> {
    const expired = this.jwt.isTokenExpired(token);
    if (!expired) return expired;

    const expiredCheck = await new Promise(resolve => {
      const payload = {
        user: user,
        token: token
      };

      this.editAccountService.requestNewToken(payload).subscribe(res => {
        if (!res.success) return resolve(true);
        this.userDataService.changeAuthToken(res.token);
        return resolve(false);
      });
    });

    return expiredCheck;
  };

  logout(user: any): void {
    if (user) {
      this.socketioService.emitLogout(user);
      this.onLogout(user._id).subscribe(_user => {});
    };

    this.chatService.changeOpenChats([]);
    this.redirectService.handleRedirect('home');
    this.userDataService.changeAuthToken(null);
    this.userDataService.changeUserData(null);
    localStorage.clear();
  };

  onReload(user: any, token: string): void {
    if (user && token) return;
    const localUser = this.parseLocalStorageUser();
    const localToken = localStorage.getItem('id_token');

    if (localUser && localToken) {
      this.userDataService.changeAuthToken(localStorage.getItem('id_token'));
      this.userDataService.changeUserData(localUser);
      this.socketioService.emitLogin(localUser);
      return;
    };
    
    this.logout(user);
  };

  // =======================
  // || Auth Guard Checks ||
  // =======================

  async handleDispatchCheck(token: string, user: any): Promise<boolean> {
    if (!token) return this.redirectService.falseCheckRedirect('home');
    const valid = await this.compareToken(token);
    const expired = await this.isExpired(token, user);

    if (expired || !valid) {
      this.logout(user);
      return false;
    };

    return true;
  };

  async handleAdminCheck(token: string, user: any): Promise<boolean> {
    if (!user || !token) return this.redirectService.falseCheckRedirect('home');
    if (typeof(user) === 'string') user = JSON.parse(user);
    const check = await this.adminCheckParser(user._id, token);
    if (!check) this.logout(user);
    return check;
  };

  // ========================
  // || Change Observables ||
  // ========================

  // changeAuthToken(token: string | null): void {
  //   this.authTokenSource.next(token);
  //   if (token && token !== localStorage.getItem('id_token')) localStorage.setItem('id_token', token);
  // };

  // changeUserData(user: any): void {
  //   if (!user) return this.userDataSource.next(null);
  //   let payload: any = {
  //     _id: user._id,
  //     username: user.username,
  //     name: user.name,
  //     accountType: user.accountType
  //   };

  //   if (user.accountType === 'doctor') {
  //     payload.status = user.status,
  //     payload.videoCall = user.videoCall
  //   };

  //   this.userDataSource.next(payload);
  //   const stringUser = JSON.stringify(payload);
  //   if (stringUser !== localStorage.getItem('user')) localStorage.setItem('user', stringUser);
  // };
}
