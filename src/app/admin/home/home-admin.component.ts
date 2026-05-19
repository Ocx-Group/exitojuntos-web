import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgxEchartsModule, provideEchartsCore } from 'ngx-echarts';
import { RouterLink } from '@angular/router';
import { EChartsOption } from 'echarts';

import {
  StatsCardComponent,
  StatsCardData,
  MarketOverviewComponent,
  MarketAsset,
  PortfolioDistributionComponent,
  PortfolioAsset,
  TradingVolumeChartComponent,
} from '@app/shared/components';

import {
  ADMIN_STATS_CARDS,
  MARKET_ASSETS,
  PLATFORM_ASSETS,
  PLATFORM_PORTFOLIO_CHART_OPTIONS,
  PLATFORM_ACTIVITY_CHART,
} from './home-admin.data';

@Component({
  selector: 'app-home-admin',
  templateUrl: './home-admin.component.html',
  styleUrls: ['./home-admin.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    NgxEchartsModule,
    RouterLink,
    StatsCardComponent,
    MarketOverviewComponent,
    PortfolioDistributionComponent,
    TradingVolumeChartComponent,
  ],
  providers: [
    provideEchartsCore({
      echarts: () => import('echarts'),
    }),
  ],
})
export class HomeAdminComponent implements OnInit {
  protected adminStatsCards: StatsCardData[] = ADMIN_STATS_CARDS;
  protected marketAssets: MarketAsset[] = MARKET_ASSETS;
  protected platformAssets: PortfolioAsset[] = PLATFORM_ASSETS;
  protected platformPortfolioChartOptions = PLATFORM_PORTFOLIO_CHART_OPTIONS;
  protected platformActivityChart!: EChartsOption;

  ngOnInit(): void {
    this.platformActivityChart = PLATFORM_ACTIVITY_CHART;
  }
}
