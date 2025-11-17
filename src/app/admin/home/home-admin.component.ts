import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgxEchartsModule, provideEchartsCore } from 'ngx-echarts';
import { RouterLink } from '@angular/router';
import { EChartsOption } from 'echarts';

// Importar componentes reutilizables
import {
  StatsCardComponent,
  StatsCardData,
  MarketOverviewComponent,
  MarketAsset,
  PortfolioDistributionComponent,
  PortfolioAsset,
  TradingVolumeChartComponent,
} from '@app/shared/components';

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
  // Datos para stats cards del admin
  adminStatsCards: StatsCardData[] = [
    {
      title: 'Total Users',
      value: '2,547',
      subtitle: '+45 new today',
      icon: 'users',
      iconColor: 'blue',
      valueColor: 'primary',
      subtitleType: 'success',
    },
    {
      title: 'Total Revenue',
      value: '$1,234,567',
      subtitle: '+18.2% this month',
      icon: 'dollar-sign',
      iconColor: 'green',
      valueColor: 'success',
      subtitleType: 'success',
    },
    {
      title: 'Active Trades',
      value: '892',
      subtitle: 'Platform wide',
      icon: 'chart-line',
      iconColor: 'cyan',
      valueColor: 'info',
    },
    {
      title: 'Pending Withdrawals',
      value: '34',
      subtitle: 'Requires review',
      icon: 'clock',
      iconColor: 'orange',
      valueColor: 'warning',
    },
  ];

  // Datos del mercado para overview
  marketAssets: MarketAsset[] = [
    {
      name: 'Bitcoin',
      icon: 'fab fa-bitcoin',
      iconColor: 'text-warning',
      price: '$42,587.23',
      change: '+2.45%',
      changeType: 'success',
    },
    {
      name: 'Ethereum',
      icon: 'fab fa-ethereum',
      iconColor: 'text-primary',
      price: '$2,234.56',
      change: '+1.87%',
      changeType: 'success',
    },
    {
      name: 'Platform Volume',
      icon: 'fas fa-chart-bar',
      iconColor: 'text-info',
      price: '$12.4M',
      change: '+5.23%',
      changeType: 'success',
    },
    {
      name: 'Total Transactions',
      icon: 'fas fa-exchange-alt',
      iconColor: 'text-success',
      price: '15,847',
      change: '+8.91%',
      changeType: 'success',
    },
  ];

  // Datos del portfolio de la plataforma
  platformPortfolioChartOptions: any;
  platformAssets: PortfolioAsset[] = [
    {
      icon: 'fab fa-bitcoin',
      iconColor: 'text-warning',
      name: 'Bitcoin Holdings',
      value: '$5,234,120',
      amount: '122.8 BTC',
    },
    {
      icon: 'fab fa-ethereum',
      iconColor: 'text-primary',
      name: 'Ethereum Holdings',
      value: '$3,456,789',
      amount: '1547 ETH',
    },
    {
      icon: 'fas fa-coins',
      iconColor: 'text-info',
      name: 'Other Assets',
      value: '$2,123,456',
      amount: 'Multiple',
    },
    {
      icon: 'fas fa-dollar-sign',
      iconColor: 'text-success',
      name: 'Cash Reserves',
      value: '$8,950,000',
      amount: 'USD',
    },
  ];

  // Gráfico de actividad de la plataforma
  platformActivityChart: EChartsOption;

  ngOnInit(): void {
    this.initializeCharts();
  }

  private initializeCharts(): void {
    this.initPlatformPortfolioChart();
    this.initPlatformActivityChart();
  }

  private initPlatformPortfolioChart(): void {
    this.platformPortfolioChartOptions = {
      series: [5234120, 3456789, 2123456, 8950000],
      colors: ['#f7931a', '#627eea', '#00d4aa', '#10b981'],
      chart: {
        type: 'donut',
        width: 200,
      },
      legend: {
        show: false,
      },
      dataLabels: {
        enabled: false,
      },
      labels: ['Bitcoin', 'Ethereum', 'Others', 'Cash'],
      responsive: [
        {
          breakpoint: 480,
          options: {
            dataLabels: {
              enabled: true,
              formatter: function (val: any) {
                return val.toFixed(1) + '%';
              },
            },
            plotOptions: {
              pie: {
                expandOnClick: false,
              },
            },
          },
        },
      ],
    };
  }

  private initPlatformActivityChart(): void {
    this.platformActivityChart = {
      backgroundColor: 'transparent',
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: 'shadow',
        },
      },
      legend: {
        data: ['Deposits', 'Withdrawals', 'Trades'],
        textStyle: {
          color: '#9aa0ac',
        },
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '3%',
        containLabel: true,
      },
      xAxis: [
        {
          type: 'category',
          data: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
          axisLabel: {
            color: '#9aa0ac',
          },
          axisLine: {
            lineStyle: {
              color: 'rgba(255, 255, 255, 0.15)',
            },
          },
          splitLine: {
            show: false,
          },
        },
      ],
      yAxis: [
        {
          type: 'value',
          axisLabel: {
            color: '#9aa0ac',
            formatter: '${value}K',
          },
          axisLine: {
            lineStyle: {
              color: 'rgba(255, 255, 255, 0.15)',
            },
          },
          splitLine: {
            lineStyle: {
              color: 'rgba(255, 255, 255, 0.05)',
            },
          },
        },
      ],
      series: [
        {
          name: 'Deposits',
          type: 'bar',
          emphasis: {
            focus: 'series',
          },
          barWidth: 15,
          data: [220, 245, 190, 278, 310, 289, 267],
          itemStyle: {
            borderRadius: [6, 6, 0, 0],
          },
        },
        {
          name: 'Withdrawals',
          type: 'bar',
          emphasis: {
            focus: 'series',
          },
          barWidth: 15,
          data: [150, 178, 156, 198, 234, 212, 198],
          itemStyle: {
            borderRadius: [6, 6, 0, 0],
          },
        },
        {
          name: 'Trades',
          type: 'bar',
          emphasis: {
            focus: 'series',
          },
          barWidth: 15,
          data: [320, 356, 298, 389, 445, 423, 398],
          itemStyle: {
            borderRadius: [6, 6, 0, 0],
          },
        },
      ],
      color: ['#10b981', '#ef4444', '#3b82f6'],
    };
  }
}
