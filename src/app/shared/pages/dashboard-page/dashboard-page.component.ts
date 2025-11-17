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
  // Usando signal input (Angular 17.1+)
  pageType = input<DashboardPageType>('client');

  // Signal para el tipo de página actual
  protected readonly currentPageType = signal<DashboardPageType>('client');

  // Inyección moderna usando inject()
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);

  ngOnInit(): void {
    // Inicializar con el valor del input
    this.currentPageType.set(this.pageType());

    // Usar takeUntilDestroyed en lugar de Subject
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
