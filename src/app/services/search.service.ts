import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';

import { catchError } from 'rxjs/operators';
import { BehaviorSubject, of } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class SearchService {
  private api = 'http://localhost:3000/users'; // dev
  // private api = 'users'; // production

  // =================
  // || Observables ||
  // =================

  private accountListSource = new BehaviorSubject(null);
  accountList = this.accountListSource.asObservable();

  constructor(
    private http: HttpClient
  ) { }

  // ======================
  // || Helper Functions ||
  // ======================

  buildHeader(token: string) {
    const httpOptions = {
      headers: new HttpHeaders({
        'Authorization': `${token}`
      })
    };
    return httpOptions;
  };

  // =====================
  // || Router Requests ||
  // =====================

  // checkUnique(payload: any, token: string) {
  //   const httpOptions = this.buildHeader(token);

  //   return this.http.post(`${this.api}/search`, payload, httpOptions).pipe(
  //     catchError(err => of(err))
  //   );
  // };

  getFullAccountList(token: string) {
    const httpOptions = this.buildHeader(token);
    console.log('getFullAcountList')

    return this.http.get(`${this.api}/full-user-list`, httpOptions).pipe(
      catchError(err => of(err))
    );
  };

  searchAccountsBy(term: string, parameter: string, token: string) {
    const httpOptions = this.buildHeader(token);
    
    return this.http.get(`${this.api}/search-user-list?term=${term}&parameter=${parameter}`, httpOptions).pipe(
      catchError(err => of(err))
    );
  };

  // ========================
  // || Change Observables ||
  // ========================

  changeAccountList(list: any): void {
    this.accountListSource.next(list);
  };
}
