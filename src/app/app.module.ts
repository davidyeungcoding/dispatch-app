import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { AppRoutingModule } from './app-routing.module';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { JwtHelperService, JwtModule } from '@auth0/angular-jwt';

import { AppComponent } from './app.component';
import { HomeComponent } from './components/home/home.component';
import { DispatchComponent } from './components/dispatch/dispatch.component';
import { NavComponent } from './components/nav/nav.component';
import { CreateAccountComponent } from './components/create-account/create-account.component';
import { ChatComponent } from './components/chat/chat.component';
import { EditAccountComponent } from './components/edit-account/edit-account.component';
import { UserManagementComponent } from './components/user-management/user-management.component';

@NgModule({
  declarations: [
    AppComponent,
    HomeComponent,
    DispatchComponent,
    NavComponent,
    CreateAccountComponent,
    ChatComponent,
    EditAccountComponent,
    UserManagementComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    FormsModule,
    HttpClientModule,
    JwtModule.forRoot({
      config: {
        tokenGetter: () => {
          return localStorage.getItem('id_token');
        }
      }
    })
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
