import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { BaseChartDirective } from 'ng2-charts';
import { Chart, ChartData, ChartOptions, registerables } from 'chart.js';
import { saleStore } from '../../../../store/sales/sale.store';
import { userStore } from '../../../../store/users/user.store';
import { productStore } from '../../../../store/products/product.store';

Chart.register(...registerables);

export type GroupBy = 'payment' | 'cashier' | 'product' | 'all';
export type Period = 'day' | 'week' | 'month';
export type ViewMode = 'chart' | 'table';

export interface ReportRow {
  label: string;
  revenue: number;
  count: number;
}

const GROUP_LABELS: Record<GroupBy, string> = {
  payment: 'By Payment Method',
  cashier: 'By Cashier',
  product: 'By Product',
  all: 'All 3 in 1',
};

@Component({
  selector: 'app-sales-report-card',
  standalone: true,
  imports: [
    CommonModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    MatTooltipModule,
    BaseChartDirective,
  ],
  templateUrl: './sales-report-card.component.html',
  styleUrl: './sales-report-card.component.scss',
})
export class SalesReportCardComponent {
  private readonly salesStore = inject(saleStore);
  private readonly userStore = inject(userStore);
  private readonly productStore = inject(productStore);

  // ── State signals ────────────────────────────────────────
  readonly groupBy = signal<GroupBy>('payment');
  readonly period = signal<Period>('day');
  readonly viewMode = signal<ViewMode>('chart');

  readonly groupOptions: { value: GroupBy; label: string }[] = [
    { value: 'payment', label: 'By Payment Method' },
    { value: 'cashier', label: 'By Cashier' },
    { value: 'product', label: 'By Product' },
    { value: 'all', label: 'All 3 in 1' },
  ];

  readonly periodOptions: { value: Period; label: string }[] = [
    { value: 'day', label: 'Day' },
    { value: 'week', label: 'Week' },
    { value: 'month', label: 'Month' },
  ];

  readonly displayedColumns = ['label', 'count', 'revenue'];

  // ── Filtered line items within the selected period ───────
  private readonly filteredLineItems = computed(() => {
    const now = new Date();
    const p = this.period();
    return this.salesStore
      .items()
      .filter((sale) => {
        if (!sale.createdAt) return false;
        const d = new Date(sale.createdAt);
        if (isNaN(d.getTime())) return false;
        if (p === 'day') return d.toDateString() === now.toDateString();
        if (p === 'week') {
          const weekAgo = new Date(now);
          weekAgo.setDate(now.getDate() - 6);
          return d >= weekAgo;
        }
        // month
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
      })
      .flatMap((sale) =>
        sale.items
          .filter((item) => item.confirmed)
          .map((item) => ({ ...item, shiftId: sale.shiftId, cashierId: (sale as any).cashierId })),
      );
  });

  // ── Total revenue for KPI ────────────────────────────────
  readonly totalRevenue = computed(() =>
    this.filteredLineItems().reduce((sum, item) => sum + item.subTotal, 0),
  );

  // ── Aggregated rows for a single grouping ────────────────
  private readonly paymentRows = computed<ReportRow[]>(() => {
    const map = new Map<string, ReportRow>();
    for (const item of this.filteredLineItems()) {
      const label = item.paymentMethod ?? 'Unknown';
      const existing = map.get(label) ?? { label, revenue: 0, count: 0 };
      existing.revenue += item.subTotal;
      existing.count += 1;
      map.set(label, existing);
    }
    return Array.from(map.values()).sort((a, b) => b.revenue - a.revenue);
  });

  private readonly cashierRows = computed<ReportRow[]>(() => {
    const map = new Map<string, ReportRow>();
    for (const item of this.filteredLineItems()) {
      const cashierId = item.cashierId?._id ?? item.cashierId;
      const user = this.userStore.users().find((u) => u._id === cashierId);
      const label = user ? `${user.firstName} ${user.lastName}` : 'Unknown';
      const existing = map.get(label) ?? { label, revenue: 0, count: 0 };
      existing.revenue += item.subTotal;
      existing.count += 1;
      map.set(label, existing);
    }
    return Array.from(map.values()).sort((a, b) => b.revenue - a.revenue);
  });

  private readonly productRows = computed<ReportRow[]>(() => {
    const map = new Map<string, ReportRow>();
    for (const item of this.filteredLineItems()) {
      const product = this.productStore.products().find((p) => p._id === item.productId);
      const label = product?.name ?? 'Unknown';
      const existing = map.get(label) ?? { label, revenue: 0, count: 0 };
      existing.revenue += item.subTotal;
      existing.count += 1;
      map.set(label, existing);
    }
    return Array.from(map.values()).sort((a, b) => b.revenue - a.revenue);
  });

  // ── Active rows (switches on groupBy) ───────────────────
  readonly activeRows = computed<ReportRow[]>(() => {
    const g = this.groupBy();
    if (g === 'cashier') return this.cashierRows();
    if (g === 'product') return this.productRows();
    if (g === 'all') return this.allRows();
    return this.paymentRows();
  });

  // ── "All 3 in 1" — top 3 entries from each grouping ─────
  private readonly allRows = computed<ReportRow[]>(() => {
    const top = (rows: ReportRow[], prefix: string) =>
      rows.slice(0, 3).map((r) => ({ ...r, label: `${prefix}: ${r.label}` }));
    return [
      ...top(this.paymentRows(), 'Payment'),
      ...top(this.cashierRows(), 'Cashier'),
      ...top(this.productRows(), 'Product'),
    ];
  });

  // ── Chart configuration ──────────────────────────────────
  readonly chartData = computed<ChartData<'bar'>>(() => {
    const rows = this.activeRows();
    return {
      labels: rows.map((r) => r.label),
      datasets: [
        {
          label: 'Revenue (Ksh)',
          data: rows.map((r) => r.revenue),
          backgroundColor: '#BFDBFE',
          hoverBackgroundColor: '#93C5FD',
          borderRadius: 6,
          borderSkipped: false,
        },
      ],
    };
  });

  readonly chartOptions: ChartOptions<'bar'> = {
    responsive: true,
    maintainAspectRatio: false,
    animation: { duration: 500, easing: 'easeInOutQuart' },
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (ctx) => ` Ksh ${(ctx.raw as number).toFixed(2)}`,
        },
        backgroundColor: '#0f172a',
        titleColor: '#f8fafc',
        bodyColor: '#cbd5e1',
        padding: 10,
        cornerRadius: 8,
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: {
          font: { family: 'Inter, system-ui, sans-serif', size: 12 },
          color: '#64748b',
          maxRotation: 30,
        },
      },
      y: {
        beginAtZero: true,
        grid: { color: '#e2e8f0' },
        ticks: {
          font: { family: 'Inter, system-ui, sans-serif', size: 12 },
          color: '#64748b',
          callback: (v) => `${v}`,
        },
      },
    },
  };

  // ── Helpers ──────────────────────────────────────────────
  get chartTitle(): string {
    return `Sales: ${GROUP_LABELS[this.groupBy()]}`;
  }

  formatCurrency(v: number): string {
    return `Ksh ${v.toFixed(2)}`;
  }

  // ── Actions ──────────────────────────────────────────────
  setGroupBy(value: GroupBy) {
    this.groupBy.set(value);
  }

  setPeriod(value: Period) {
    this.period.set(value);
  }

  setViewMode(value: ViewMode) {
    this.viewMode.set(value);
  }

  exportCsv() {
    const rows = this.activeRows();
    const header = 'Label,Units Sold,Revenue (Ksh)\n';
    const body = rows.map((r) => `"${r.label}",${r.count},${r.revenue.toFixed(2)}`).join('\n');
    const blob = new Blob([header + body], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sales-report-${this.period()}-${this.groupBy()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }
}
