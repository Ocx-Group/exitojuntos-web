import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LoadingBarModule } from '@ngx-loading-bar/core';
@Component({
  selector: 'app-page-loader',
  templateUrl: './page-loader.component.html',
  styleUrls: ['./page-loader.component.sass'],
  standalone: true,
  imports: [CommonModule, LoadingBarModule],
})
export class PageLoaderComponent {
  constructor() {}
}
