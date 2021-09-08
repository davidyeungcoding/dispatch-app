import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { HomeComponent } from './components/home/home.component';
import { DispatchComponent } from './components/dispatch/dispatch.component';
import { CreateAccountComponent } from './components/create-account/create-account.component';
import { EditAccountComponent } from './components/edit-account/edit-account.component';

import { AuthGuard } from './guards/auth.guard';
import { AdminGuard } from './guards/admin.guard';

const routes: Routes = [
  { path: 'home', component: HomeComponent },
  { path: 'dispatch', canActivate: [AuthGuard], component: DispatchComponent },
  { path: 'create-account', canActivate: [AdminGuard], component: CreateAccountComponent},
  { path: 'edit-account', component: EditAccountComponent },
  { path: '', redirectTo: 'home', pathMatch: 'full' },
  { path: '**', component: HomeComponent }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
