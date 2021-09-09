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

  private authTokenSource = new BehaviorSubject<any>(null);
  authToken = this.authTokenSource.asObservable();
  private userDataSource = new BehaviorSubject<any>({});
  userData = this.userDataSource.asObservable();

  constructor(
    private http: HttpClient,
    private redirectService: RedirectService,
    private socketioService: SocketioService,
    private chatService: ChatService
  ) { }

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
        resolve(_status.status === 200 ? true : false);
      });
    });
  };

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

  // validateToken(token: string) {
  //   const validateHeader = {
  //     headers: new HttpHeaders({
  //       'Authorization': `${token}`
  //     })
  //   };

  //   return this.http.get(`${this.api}/verify-token`, validateHeader).pipe(
  //     catchError(err => of(err))
  //   );
  // };

  verifyAdmin(id: any, token: string) {
    const validateHeader = this.buildHeader(token);

    return this.http.post(`${this.api}/verify-admin`, id, validateHeader).pipe(
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

  logout(): void {
    this.chatService.changeOpenChats([]);
    if (localStorage.getItem('user')) this.socketioService.emitLogout(localStorage.getItem('user'));
    this.redirectService.handleRedirect('home');
    this.changeAuthToken(null);
    this.changeUserData(null);
    localStorage.clear();
  };

  // compareToken(token: string): void {
  //   this.validateToken(token).subscribe(res => {
  //     if (res.status !== 200) !!localStorage.getItem('user') ? this.logout()
  //     : this.redirectService.handleRedirect('home');
  //   });
  // };

  // =======================
  // || Auth Guard Checks ||
  // =======================

  handleDispatchCheck(): boolean {
    const token = localStorage.getItem('id_token');
    if (!token) return this.redirectService.falseCheckRedirect('home');

    if (this.isExpired(token)) {
      this.logout();
      return false;
    };

    return true;
  };

  async handleAdminCheck(): Promise<boolean> {
    const token = localStorage.getItem('id_token');
    const user = localStorage.getItem('user');
    if (!user || !token) return this.redirectService.falseCheckRedirect('home');
    const check = await this.adminCheckParser(JSON.parse(user)._id, token);
    if (!check) this.logout();
    return check;
  };

  // ============================
  // || Change Observable Data ||
  // ============================

  changeAuthToken(token: string | null): void {
    this.authTokenSource.next(token);
  };

  changeUserData(user: any): void {
    if (!user) return this.userDataSource.next(user);
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
