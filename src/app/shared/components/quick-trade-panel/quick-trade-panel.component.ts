import { Component, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

export interface TradeData {
  asset: string;
  orderType: string;
  amount: number;
  total: number;
}

@Component({
  selector: 'app-quick-trade-panel',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="card">
      <div class="card-header bg-gradient-primary text-white">
        <h5 class="mb-0"><i class="fas fa-bolt me-2"></i>Quick Trade</h5>
      </div>
      <div class="card-body">
        <div class="row g-3">
          <div class="col-md-6">
            <label
              class="form-label"
              for="selectAsset"
              >Select Asset</label
            >
            <select
              class="form-select"
              id="selectAsset"
              [(ngModel)]="selectedAsset"
            >
              <option value="BTC">Bitcoin (BTC)</option>
              <option value="ETH">Ethereum (ETH)</option>
              <option value="BNB">BNB</option>
              <option value="ADA">Cardano (ADA)</option>
              <option value="SOL">Solana (SOL)</option>
            </select>
          </div>
          <div class="col-md-6">
            <label
              class="form-label"
              for="orderType"
              >Order Type</label
            >
            <select
              class="form-select"
              id="orderType"
              [(ngModel)]="selectedOrderType"
            >
              <option value="market">Market Order</option>
              <option value="limit">Limit Order</option>
              <option value="stop">Stop Loss</option>
            </select>
          </div>
          <div class="col-md-6">
            <label
              class="form-label"
              for="tradeAmount"
              >Amount</label
            >
            <input
              type="number"
              class="form-control"
              id="tradeAmount"
              placeholder="0.00"
              [(ngModel)]="amount"
              (ngModelChange)="updateTotal()"
            />
          </div>
          <div class="col-md-6">
            <label
              class="form-label"
              for="tradeTotal"
              >Total (USD)</label
            >
            <input
              type="number"
              class="form-control"
              id="tradeTotal"
              placeholder="0.00"
              [value]="total"
              readonly
            />
          </div>
          <div class="col-12">
            <div class="d-flex gap-2">
              <button
                class="btn btn-success flex-fill"
                (click)="onBuy()"
              >
                <i class="fas fa-arrow-up me-2"></i>Buy
              </button>
              <button
                class="btn btn-danger flex-fill"
                (click)="onSell()"
              >
                <i class="fas fa-arrow-down me-2"></i>Sell
              </button>
            </div>
          </div>
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
export class QuickTradePanelComponent {
  selectedAsset = 'BTC';
  selectedOrderType = 'market';
  amount = 0.5;
  total = 21293.61;

  // Outputs para emitir eventos
  buy = output<TradeData>();
  sell = output<TradeData>();

  // Precios de ejemplo
  private readonly prices: { [key: string]: number } = {
    BTC: 42587.23,
    ETH: 2234.56,
    BNB: 312.45,
    ADA: 0.52,
    SOL: 98.45,
  };

  updateTotal(): void {
    const price = this.prices[this.selectedAsset] || 0;
    this.total = this.amount * price;
  }

  onBuy(): void {
    this.buy.emit({
      asset: this.selectedAsset,
      orderType: this.selectedOrderType,
      amount: this.amount,
      total: this.total,
    });
  }

  onSell(): void {
    this.sell.emit({
      asset: this.selectedAsset,
      orderType: this.selectedOrderType,
      amount: this.amount,
      total: this.total,
    });
  }
}
