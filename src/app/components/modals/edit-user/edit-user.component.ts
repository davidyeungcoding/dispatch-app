import { Component, Input, OnInit } from '@angular/core';
import { NgForm } from '@angular/forms';

@Component({
  selector: 'app-edit-user',
  templateUrl: './edit-user.component.html',
  styleUrls: ['./edit-user.component.css']
})
export class EditUserComponent implements OnInit {
  @Input() targetEdit: any;

  constructor() { }

  ngOnInit(): void {
  }

  onSubmitChange(form: NgForm): void {
    console.log(form);
  };
}
