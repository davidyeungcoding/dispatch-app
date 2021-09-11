import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';

import { catchError } from 'rxjs/operators';
import { of } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class EditAccountService {
  // private api = 'http://localhost:3000/users'; // dev
  private api = 'users'; // production
  // private httpOptions = {
  //   headers: new HttpHeaders({
  //     'Content-Type': 'application/json'
  //   })
  // };

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

  editUser(payload: any, token: string) {
    const validateHeader = this.buildHeader(token);

    return this.http.put(`${this.api}/edit`, payload, validateHeader).pipe(
      catchError(err => of(err))
    );
  };

  editAccount(payload: any, token: string) {
    const validateHeader = this.buildHeader(token);

    return this.http.put(`${this.api}/edit-account`, payload, validateHeader).pipe(
      catchError(err => of(err))
    );
  };
}
