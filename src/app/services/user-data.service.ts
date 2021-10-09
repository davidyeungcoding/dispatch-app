import { Injectable } from '@angular/core';

import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class UserDataService {
  private userDataSource = new BehaviorSubject<any>(null);
  userData = this.userDataSource.asObservable();
  private authTokenSource = new BehaviorSubject<any>(null);
  authToken = this.authTokenSource.asObservable();

  constructor() { }

  // ======================
  // || Shared Functions ||
  // ======================

  getUserData(): any {
    return this.userDataSource.value;
  };

  getAuthToken(): any {
    return this.authTokenSource.value;
  };

  // ========================
  // || Change Observables ||
  // ========================

  changeAuthToken(token: string | null): void {
    this.authTokenSource.next(token);
    if (token && token !== localStorage.getItem('id_token')) localStorage.setItem('id_token', token);
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
    const stringUser = JSON.stringify(payload);
    if (stringUser !== localStorage.getItem('user')) localStorage.setItem('user', stringUser);
  };
}
