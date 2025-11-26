import { Component, OnInit } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-reset',
  templateUrl: './reset.component.html',
  styleUrls: ['./reset.component.scss'],
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
})
export class ResetComponent implements OnInit {
  constructor() {}

  ngOnInit(): void {}
}
