import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-auth-layout',
  templateUrl: './auth-layout.component.html',
  styleUrls: [],
  standalone: true,
  imports: [RouterOutlet],
})
export class AuthLayoutComponent {
  constructor() {}
}
