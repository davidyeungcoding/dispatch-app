import { AfterViewInit, Component, OnDestroy, OnInit } from '@angular/core';

import { AuthService } from 'src/app/services/auth.service';

@Component({
  selector: 'app-dispatch',
  templateUrl: './dispatch.component.html',
  styleUrls: ['./dispatch.component.css']
})
export class DispatchComponent implements OnInit, AfterViewInit, OnDestroy {

  constructor(
    private authService: AuthService
  ) { }

  ngOnInit(): void {
    this.authService.compareToken(localStorage.getItem('id_token')!);
  }
  
  ngAfterViewInit(): void {
  }

  ngOnDestroy(): void {
  }

}
