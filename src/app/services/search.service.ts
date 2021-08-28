import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';

import { catchError } from 'rxjs/operators';
import { of } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class SearchService {
  // private api = 'http://localhost/users';
  private api = 'users';
  private httpOptions = {
    headers: new HttpHeaders({
      'Content-Type': 'application/json'
    })
  };

  constructor(
    private http: HttpClient
  ) { }

  // =====================
  // || Router Requests ||
  // =====================

  checkUnique(payload: any) {
    return this.http.post(`${this.api}/search`, payload, this.httpOptions).pipe(
      catchError(err => of(err))
    );
  };
}
