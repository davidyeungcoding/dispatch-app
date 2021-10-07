import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';

import { catchError } from 'rxjs/operators';
import { BehaviorSubject, of } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class EditAccountService {
  private api = 'http://localhost:3000/users'; // dev
  // private api = 'users'; // production

  // ================
  // || Observable ||
  // ================

  private activeNameSource = new BehaviorSubject<boolean>(false);
  activeName = this.activeNameSource.asObservable();
  private activeUsernameSource = new BehaviorSubject<boolean>(false);
  activeUsername = this.activeUsernameSource.asObservable();
  private activeVideoCallSource = new BehaviorSubject<boolean>(false);
  activeVideoCall = this.activeVideoCallSource.asObservable();
  private activeAccountTypeSource = new BehaviorSubject<boolean>(false);
  activeAccountType = this.activeAccountTypeSource.asObservable();

  constructor(
    private http: HttpClient
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

  // =====================
  // || Router Requests ||
  // =====================

  editCallLink(payload: any, token: string) {
    const validateHeader = this.buildHeader(token);

    return this.http.put(`${this.api}/change-one`, payload, validateHeader).pipe(
      catchError(err => of(err))
    );
  };

  editAccount(payload: any, token: string) {
    const validateHeader = this.buildHeader(token);

    return this.http.put(`${this.api}/edit-account`, payload, validateHeader).pipe(
      catchError(err => of(err))
    );
  };

  deleteUser(payload: any, token: string) {
    const validateHeader = this.buildHeader(token);

    return this.http.post(`${this.api}/delete-user`, payload, validateHeader).pipe(
      catchError(err => of(err))
    );
  };

  updateUser(payload: any, token: string) {
    const validateHeader = this.buildHeader(token);

    return this.http.put(`${this.api}/update-user`, payload, validateHeader).pipe(
      catchError(err => of(err))
    );
  };

  requestNewToken(user: string) {
    return this.http.get(`${this.api}/request-new-token?user=${user}`).pipe(
      catchError(err => of(err))
    );
  };

  // ========================
  // || Change Observables ||
  // ========================

  changeActiveName(state: boolean): void {
    this.activeNameSource.next(state);
  };

  changeActiveUsername(state: boolean): void {
    this.activeUsernameSource.next(state);
  };

  changeActiveVideoCall(state: boolean): void {
    this.activeVideoCallSource.next(state);
  };
  changeActiveAccountType(state: boolean): void {
    this.activeAccountTypeSource.next(state);
  };

  resetActive(): void {
    this.changeActiveName(false);
    this.changeActiveUsername(false);
    this.changeActiveVideoCall(false);
    this.changeActiveAccountType(false);
  };
}
