import { LogoService } from '@app/core/service/logo-service/logo.service';
import { Component, Input, OnDestroy, ViewEncapsulation } from '@angular/core';
import { Subscription } from 'rxjs';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-logo',
  templateUrl: './logo.component.html',
  styleUrls: ['./logo.component.scss'],
  encapsulation: ViewEncapsulation.None,
  standalone: true,
  imports: [CommonModule],
})
export class LogoComponent implements OnDestroy {
  logoSrc!: string;
  @Input() logoClass: string = '';
  private readonly subscription: Subscription;

  constructor(private readonly logoService: LogoService) {
    this.subscription = this.logoService.isDarkTheme$.subscribe(isDark => {
      this.logoSrc = this.logoService.getLogoSrc();
    });
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }
}
