import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface MarketAsset {
  name: string;
  icon: string;
  iconColor: string;
  price: string;
  change: string;
  changeType: 'success' | 'danger';
}

@Component({
  selector: 'app-market-overview',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="card">
      <div class="card-body p-4">
        <h5 class="mb-3"><i class="fas fa-globe me-2"></i>{{ title() }}</h5>
        <div class="row g-3">
          @for (asset of assets(); track asset.name) {
          <div class="col-xl-3 col-lg-6">
            <div class="d-flex align-items-center">
              <div class="me-3">
                <i [class]="asset.icon + ' fa-2x ' + asset.iconColor"></i>
              </div>
              <div>
                <small class="text-muted">{{ asset.name }}</small>
                <h6 class="mb-0">{{ asset.price }}</h6>
                <small [class]="'text-' + asset.changeType">
                  <i
                    [class]="
                      'fas fa-arrow-' +
                      (asset.changeType === 'success' ? 'up' : 'down')
                    "
                  ></i>
                  {{ asset.change }}
                </small>
              </div>
            </div>
          </div>
          }
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
      }
    `,
  ],
})
export class MarketOverviewComponent {
  title = input<string>('Market Overview');
  assets = input.required<MarketAsset[]>();
}
