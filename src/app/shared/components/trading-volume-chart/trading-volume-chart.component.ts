import { Component, input } from '@angular/core';
import { EChartsOption } from 'echarts';
import { NgxEchartsModule } from 'ngx-echarts';

@Component({
  selector: 'app-trading-volume-chart',
  standalone: true,
  imports: [NgxEchartsModule],
  template: `
    <div class="card h-100">
      <div class="card-header">
        <h5 class="mb-0"><i class="fas fa-chart-bar me-2"></i>{{ title() }}</h5>
      </div>
      <div class="card-body">
        <div
          echarts
          [options]="chartOptions()"
          class="echart-height"
        ></div>
      </div>
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
      }
      .echart-height {
        height: 300px;
      }
    `,
  ],
})
export class TradingVolumeChartComponent {
  title = input<string>('Trading Volume');
  chartOptions = input.required<EChartsOption>();
}
