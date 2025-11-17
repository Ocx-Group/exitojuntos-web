import {
  Component,
  CUSTOM_ELEMENTS_SCHEMA,
  OnInit,
  ViewChild,
} from '@angular/core';
import { ChartComponent, NgApexchartsModule } from 'ng-apexcharts';

import { UserAffiliate } from '@app/core/models/user-affiliate-model/user.affiliate.model';
import { AuthService } from '@app/core/service/authentication-service/auth.service';

import { EChartsOption } from 'echarts';
import { ToastrService } from 'ngx-toastr';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { NgxEchartsModule, provideEchartsCore } from 'ngx-echarts';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-main',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    NgApexchartsModule,
    TranslateModule,
    NgxEchartsModule,
    RouterLink,
  ],
  providers: [
    provideEchartsCore({
      echarts: () => import('echarts'),
    }),
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class HomeComponent implements OnInit {
  public user: UserAffiliate;
  area_line_chart: EChartsOption;
  volumeChart: EChartsOption;
  currentYear: number;
  previousYear: number;
  @ViewChild('chart') chart1: ChartComponent;
  canSeePaymentModels: boolean = false;
  exitojuntosInfo = {
    usdValue: 1250000,
    tokenAmount: 5000000,
    marketCap: 10000000,
    change24h: 5.75,
    contractAddress: '0x7c482FF834dfb546A8E48C14f3C34652E9826723',
    bnbAddress: '',
  };

  public portfolioChartOptions: any;
  public pieChartOptionsModel1A: any;
  public pieChartOptionsModel1B: any;

  constructor(
    private readonly authService: AuthService,
    private readonly toastr: ToastrService,
  ) {
    this.portfolioChartOptions = {
      series: [],
      chart: {},
      labels: [],
      responsive: [],
      dataLabels: {},
      legend: {},
    };
    this.pieChartOptionsModel1A = {
      series: [],
      chart: {},
      labels: [],
      responsive: [],
      dataLabels: {},
      legend: {},
    };
    this.pieChartOptionsModel1B = {
      series: [],
      chart: {},
      labels: [],
      responsive: [],
      dataLabels: {},
      legend: {},
    };

    this.currentYear = new Date().getFullYear();
    this.previousYear = this.currentYear - 1;
  }

  ngOnInit(): void {
    // Usar signal para obtener el usuario afiliado
    this.user = this.authService.userAffiliate();
    this.initializeBalanceCharts();
  }

  private initializeBalanceCharts(): void {
    try {
      this.initPortfolioChart();
      this.initVolumeChart();
    } catch (error) {
      console.error('Error initializing charts:', error);
    }
  }

  get registerUrl() {
    const phone = this.user?.phone;
    return phone
      ? `https://www.exitojuntos.net/welcome/${phone.toString()}`
      : '';
  }

  private initPortfolioChart(): void {
    // Datos quemados para portfolio de trading
    this.portfolioChartOptions = {
      series: [21293.61, 11172.8, 3124.5, 5782.54],
      colors: ['#f7931a', '#627eea', '#f3ba2f', '#00d4aa'],
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
      labels: ['Bitcoin', 'Ethereum', 'BNB', 'Others'],
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

  openNewWindow(url: string) {
    window.open(url);
  }

  private initVolumeChart(): void {
    this.volumeChart = {
      backgroundColor: 'transparent',
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: 'shadow',
        },
      },
      legend: {
        data: ['Buy Volume', 'Sell Volume'],
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
          name: 'Buy Volume',
          type: 'bar',
          stack: 'volume',
          emphasis: {
            focus: 'series',
          },
          barWidth: 18,
          data: [120, 132, 101, 134, 190, 230, 210],
          itemStyle: {
            borderRadius: [6, 6, 0, 0],
          },
        },
        {
          name: 'Sell Volume',
          type: 'bar',
          stack: 'volume',
          emphasis: {
            focus: 'series',
          },
          barWidth: 18,
          data: [220, 182, 191, 234, 290, 330, 310],
          itemStyle: {
            borderRadius: [6, 6, 0, 0],
          },
        },
      ],
      color: ['#10b981', '#ef4444'],
    };
  }

  copyToClipboard(text: string, type: string) {
    if (text != '') {
      navigator.clipboard
        .writeText(text)
        .then(() => {
          this.showCopyNotification(type);
        })
        .catch(err => {
          console.error('Error al copiar:', err);
        });
    }
  }

  private showCopyNotification(type: string) {
    this.toastr.success(`${type} copiado al portapapeles`);
  }
}
