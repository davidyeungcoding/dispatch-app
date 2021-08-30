import { Injectable } from '@angular/core';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class RedirectService {

  constructor(
    private router: Router
  ) { }

  handleRedirect(route: string): void {
    this.router.navigate([`/${route}`]);
  };

  falseCheckRedirect(route: string): boolean {
    this.router.navigate([`/${route}`]);
    return false;
  };
}
