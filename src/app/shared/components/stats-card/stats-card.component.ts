import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface StatsCardData {
  title: string;
  value: string;
  subtitle: string;
  icon: string;
  iconColor: 'blue' | 'green' | 'emerald' | 'cyan' | 'purple' | 'orange';
  valueColor: 'primary' | 'success' | 'danger' | 'info' | 'warning';
  subtitleType?: 'success' | 'danger' | 'muted';
}

@Component({
  selector: 'app-stats-card',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="card">
      <div class="card-bg">
        <div class="p-3 d-flex justify-content-between">
          <div class="col">
            <small class="text-muted">{{ data().title }}</small>
            <h4 class="mb-0 text-{{ data().valueColor }}">
              {{ data().value }}
            </h4>
            <small [class]="'text-' + (data().subtitleType || 'muted')">
              {{ data().subtitle }}
            </small>
          </div>
          <i
            [class]="
              'fas fa-' +
              data().icon +
              ' card-icon col-' +
              data().iconColor +
              ' font-30 col-auto'
            "
          ></i>
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
export class StatsCardComponent {
  data = input.required<StatsCardData>();
}
