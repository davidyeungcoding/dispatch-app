import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { HomeComponent } from './components/home/home.component';
import { DispatchComponent } from './components/dispatch/dispatch.component';
import { AuthGuard } from './guards/auth.guard';

const routes: Routes = [
  { path: 'home', component: HomeComponent },
  { path: 'dispatch', canActivate: [AuthGuard], component: DispatchComponent },
  { path: '', redirectTo: 'home', pathMatch: 'full' },
  { path: '**', component: HomeComponent }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
