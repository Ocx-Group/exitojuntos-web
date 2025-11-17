import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ChartComponent,
  NgApexchartsModule,
  ApexNonAxisChartSeries,
  ApexChart,
  ApexResponsive,
  ApexDataLabels,
  ApexLegend,
} from 'ng-apexcharts';

export interface PortfolioAsset {
  icon: string;
  iconColor: string;
  name: string;
  value: string;
  amount: string;
}

export interface PortfolioChartOptions {
  series?: ApexNonAxisChartSeries;
  chart?: ApexChart;
  responsive?: ApexResponsive[];
  labels?: string[];
  colors?: string[];
  dataLabels?: ApexDataLabels;
  legend?: ApexLegend;
}

@Component({
  selector: 'app-portfolio-distribution',
  standalone: true,
  imports: [CommonModule, NgApexchartsModule, ChartComponent],
  template: `
    <div class="card h-100">
      <div class="card-header">
        <h5 class="mb-0">
          <i class="fas fa-chart-pie me-2"></i>Portfolio Distribution
        </h5>
      </div>
      <div class="card-body">
        <div id="chart1">
          <apx-chart
            [series]="chartOptions().series!"
            [chart]="chartOptions().chart!"
            [labels]="chartOptions().labels!"
            [responsive]="chartOptions().responsive!"
            [dataLabels]="chartOptions().dataLabels!"
            [legend]="chartOptions().legend!"
            [colors]="chartOptions().colors!"
            class="apex-pie-center"
          >
          </apx-chart>
        </div>
        <div class="table m-t-5">
          <table class="table align-items-center table-row-border">
            <tbody>
              @for (asset of assets(); track asset.name) {
              <tr>
                <td>
                  <i
                    [class]="asset.icon + ' ' + asset.iconColor + ' msr-2'"
                  ></i>
                  {{ asset.name }}
                </td>
                <td class="text-end">
                  <strong>{{ asset.value }}</strong>
                  <small class="d-block text-muted">{{ asset.amount }}</small>
                </td>
              </tr>
              }
            </tbody>
          </table>
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
export class PortfolioDistributionComponent {
  chartOptions = input.required<PortfolioChartOptions>();
  assets = input.required<PortfolioAsset[]>();
}
