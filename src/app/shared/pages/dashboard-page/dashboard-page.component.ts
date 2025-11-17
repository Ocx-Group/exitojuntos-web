import {
  Component,
  DestroyRef,
  inject,
  input,
  OnInit,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Data } from '@angular/router';

import { HomeComponent } from '@app/client/home/home.component';
import { HomeAdminComponent } from '@app/admin/home/home-admin.component';

export type DashboardPageType = 'client' | 'admin';

@Component({
  selector: 'app-dashboard-page',
  standalone: true,
  templateUrl: './dashboard-page.component.html',
  styleUrls: ['./dashboard-page.component.scss'],
  imports: [HomeComponent, HomeAdminComponent],
})
export class DashboardPageComponent implements OnInit {
  pageType = input<DashboardPageType>('client');
  protected readonly currentPageType = signal<DashboardPageType>('client');
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);

  ngOnInit(): void {
    this.currentPageType.set(this.pageType());

    this.route.data
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(data => this.applyRouteData(data));
  }

  private applyRouteData(data: Data): void {
    const dataType = (data['pageType'] as DashboardPageType) || this.pageType();
    if (dataType === 'admin' || dataType === 'client') {
      this.currentPageType.set(dataType);
    }
  }
}
