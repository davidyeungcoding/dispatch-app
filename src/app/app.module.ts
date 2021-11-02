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
import { DeleteUserComponent } from './components/modals/delete-user/delete-user.component';
import { EditUserComponent } from './components/modals/edit-user/edit-user.component';
import { VideoCallComponent } from './components/modals/video-call/video-call.component';
import { SendTextComponent } from './components/modals/send-text/send-text.component';
import { ChatMonitorDirective } from './directives/chat-monitor.directive';
import { NavbarIntersectionDirective } from './directives/navbar-intersection.directive';

@NgModule({
  declarations: [
    AppComponent,
    HomeComponent,
    DispatchComponent,
    NavComponent,
    CreateAccountComponent,
    ChatComponent,
    EditAccountComponent,
    UserManagementComponent,
    DeleteUserComponent,
    EditUserComponent,
    VideoCallComponent,
    SendTextComponent,
    ChatMonitorDirective,
    NavbarIntersectionDirective
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
