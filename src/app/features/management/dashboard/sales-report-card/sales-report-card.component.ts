import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatMenuModule } from '@angular/material/menu';
import { BaseChartDirective } from 'ng2-charts';
import { Chart, ChartData, ChartOptions, registerables } from 'chart.js';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { saleStore } from '../../../../store/sales/sale.store';
import { userStore } from '../../../../store/users/user.store';
import { productStore } from '../../../../store/products/product.store';

Chart.register(...registerables);

export type GroupBy = 'payment' | 'cashier' | 'product' | 'category' | 'all';
export type Period = 'day' | 'week' | 'month' | 'custom';
export type ViewMode = 'chart' | 'table';

export interface ReportRow {
  label: string;
  revenue: number;
  /** Total units sold (sum of LineItem.quantity) */
  count: number;
}

const GROUP_LABELS: Record<GroupBy, string> = {
  payment: 'By Payment Method',
  cashier: 'By Cashier',
  product: 'By Product (Revenue)',
  category: 'Items Sold',
  all: 'All 3 in 1',
};

// ── Date helpers ──────────────────────────────────────────
function toISODate(d: Date): string {
  return d.toISOString().split('T')[0];
}

function computeDateRange(period: 'day' | 'week' | 'month'): { startDate: string; endDate: string } {
  const now = new Date();
  const end = toISODate(now);
  if (period === 'day') return { startDate: end, endDate: end };
  if (period === 'week') {
    const start = new Date(now);
    start.setDate(now.getDate() - 6);
    return { startDate: toISODate(start), endDate: end };
  }
  // month
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  return { startDate: toISODate(start), endDate: end };
}

@Component({
  selector: 'app-sales-report-card',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    MatTooltipModule,
    MatMenuModule,
    BaseChartDirective,
  ],
  templateUrl: './sales-report-card.component.html',
  styleUrl: './sales-report-card.component.scss',
})
export class SalesReportCardComponent implements OnInit {
  private readonly salesStore = inject(saleStore);
  private readonly userStore = inject(userStore);
  private readonly productStore = inject(productStore);

  // ── State signals ─────────────────────────────────────────
  readonly groupBy = signal<GroupBy>('category');
  readonly period = signal<Period>('day');
  readonly viewMode = signal<ViewMode>('chart');
  readonly customFrom = signal<string>('');
  readonly customTo = signal<string>('');

  readonly isLoading = this.salesStore.isLoading;

  readonly groupOptions: { value: GroupBy; label: string }[] = [
    { value: 'category', label: 'Items Sold' },
    { value: 'payment', label: 'By Payment Method' },
    { value: 'cashier', label: 'By Cashier' },
    { value: 'product', label: 'By Product (Revenue)' },
    { value: 'all', label: 'All 3 in 1' },
  ];

  readonly periodOptions: { value: Period; label: string }[] = [
    { value: 'day', label: 'Day' },
    { value: 'week', label: 'Week' },
    { value: 'month', label: 'Month' },
    { value: 'custom', label: 'Custom' },
  ];

  readonly displayedColumns = ['label', 'count', 'revenue'];

  // ── Confirmed line items filtered by current period ───────
  // Reads period(), customFrom(), customTo() so the computed chain
  // reacts immediately when period tabs or date inputs change.
  private readonly confirmedLineItems = computed(() => {
    const p = this.period();
    const from = this.customFrom();
    const to = this.customTo();
    const now = new Date();

    return this.salesStore
      .items()
      .filter((sale) => {
        if (!sale.confirmed) return false;
        if (!sale.createdAt) return false;
        const d = new Date(sale.createdAt);
        if (isNaN(d.getTime())) return false;

        if (p === 'day') {
          return d.toDateString() === now.toDateString();
        }
        if (p === 'week') {
          const weekAgo = new Date(now);
          weekAgo.setDate(now.getDate() - 6);
          weekAgo.setHours(0, 0, 0, 0);
          return d >= weekAgo;
        }
        if (p === 'month') {
          return (
            d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
          );
        }
        if (p === 'custom') {
          if (!from || !to) return false;
          const fromDate = new Date(from);
          fromDate.setHours(0, 0, 0, 0);
          const toDate = new Date(to);
          toDate.setHours(23, 59, 59, 999);
          return d >= fromDate && d <= toDate;
        }
        return true;
      })
      .flatMap((sale) =>
        sale.items.map((item) => ({
          ...item,
          cashierId: (sale as any).cashierId,
          paymentMethod: (sale as any).paymentMethod ?? null,
        })),
      );
  });

  // ── KPIs ──────────────────────────────────────────────────
  readonly totalRevenue = computed(() =>
    this.confirmedLineItems().reduce((sum, item) => sum + item.subTotal, 0),
  );

  readonly totalItemsSold = computed(() =>
    this.confirmedLineItems().reduce((sum, item) => sum + (item.quantity ?? 1), 0),
  );

  // ── Aggregated rows ────────────────────────────────────────

  /** Payment method rows — sorted by units sold desc */
  private readonly paymentRows = computed<ReportRow[]>(() => {
    const map = new Map<string, ReportRow>();
    for (const item of this.confirmedLineItems()) {
      const label = item.paymentMethod ?? 'Unknown';
      const row = map.get(label) ?? { label, revenue: 0, count: 0 };
      row.revenue += item.subTotal;
      row.count += item.quantity ?? 1;
      map.set(label, row);
    }
    return Array.from(map.values()).sort((a, b) => b.count - a.count);
  });

  /** Cashier rows — sorted by units sold desc */
  private readonly cashierRows = computed<ReportRow[]>(() => {
    const map = new Map<string, ReportRow>();
    for (const item of this.confirmedLineItems()) {
      const cashierId = item.cashierId?._id ?? item.cashierId;
      const user = this.userStore.users().find((u) => u._id === cashierId);
      const label = user ? `${user.firstName} ${user.lastName}` : 'Unknown';
      const row = map.get(label) ?? { label, revenue: 0, count: 0 };
      row.revenue += item.subTotal;
      row.count += item.quantity ?? 1;
      map.set(label, row);
    }
    return Array.from(map.values()).sort((a, b) => b.count - a.count);
  });

  /** Product rows — sorted by REVENUE desc (revenue-first perspective) */
  private readonly productRows = computed<ReportRow[]>(() => {
    const map = new Map<string, ReportRow>();
    for (const item of this.confirmedLineItems()) {
      const product = this.productStore.products().find((p) => p._id === item.productId);
      const label = product?.name ?? item.productName ?? 'Unknown';
      const row = map.get(label) ?? { label, revenue: 0, count: 0 };
      row.revenue += item.subTotal;
      row.count += item.quantity ?? 1;
      map.set(label, row);
    }
    return Array.from(map.values()).sort((a, b) => b.revenue - a.revenue);
  });

  /**
   * Items-sold rows — individual product names sorted by UNITS SOLD desc.
   * Shows specific items like "Coffee", "Sausage" from most to least sold.
   */
  private readonly itemsSoldRows = computed<ReportRow[]>(() => {
    const map = new Map<string, ReportRow>();
    for (const item of this.confirmedLineItems()) {
      const product = this.productStore.products().find((p) => p._id === item.productId);
      const label = product?.name ?? item.productName ?? 'Unknown';
      const row = map.get(label) ?? { label, revenue: 0, count: 0 };
      row.revenue += item.subTotal;
      row.count += item.quantity ?? 1;
      map.set(label, row);
    }
    return Array.from(map.values()).sort((a, b) => b.count - a.count);
  });

  // ── Active rows (switches on groupBy) ─────────────────────
  readonly activeRows = computed<ReportRow[]>(() => {
    const g = this.groupBy();
    if (g === 'cashier') return this.cashierRows();
    if (g === 'product') return this.productRows();
    if (g === 'category') return this.itemsSoldRows();
    if (g === 'all') return this.allRows();
    return this.paymentRows();
  });

  // ── "All 3 in 1" — top 3 entries from each grouping ──────
  private readonly allRows = computed<ReportRow[]>(() => {
    const top = (rows: ReportRow[], prefix: string) =>
      rows.slice(0, 3).map((r) => ({ ...r, label: `${prefix}: ${r.label}` }));
    return [
      ...top(this.itemsSoldRows(), 'Top Items'),
      ...top(this.cashierRows(), 'Cashier'),
      ...top(this.paymentRows(), 'Payment'),
    ];
  });

  // ── Chart configuration ────────────────────────────────────
  readonly chartData = computed<ChartData<'bar'>>(() => {
    const rows = this.activeRows();
    return {
      labels: rows.map((r) => r.label),
      datasets: [
        {
          label: 'Units Sold',
          data: rows.map((r) => r.count),
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
          label: (ctx) => ` ${ctx.raw as number} units`,
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

  // ── Lifecycle ──────────────────────────────────────────────
  ngOnInit(): void {
    // Fire the initial API call for the default 'day' period
    this.fetchForCurrentPeriod();
  }

  // ── Helpers ────────────────────────────────────────────────
  get chartTitle(): string {
    return `${GROUP_LABELS[this.groupBy()]}`;
  }

  formatCurrency(v: number): string {
    return `Ksh ${v.toFixed(2)}`;
  }

  // ── Private: trigger API with computed date range ──────────
  private fetchForCurrentPeriod(): void {
    const p = this.period();
    if (p === 'custom') {
      this.tryFetchCustomRange();
      return;
    }
    const range = computeDateRange(p);
    this.salesStore.loadSales(range);
  }

  private tryFetchCustomRange(): void {
    const from = this.customFrom();
    const to = this.customTo();
    if (from && to && from <= to) {
      this.salesStore.loadSales({ startDate: from, endDate: to });
    }
  }

  // ── Actions ────────────────────────────────────────────────
  setGroupBy(value: GroupBy): void {
    this.groupBy.set(value);
  }

  setPeriod(value: Period): void {
    this.period.set(value);
    if (value !== 'custom') {
      const range = computeDateRange(value);
      this.salesStore.loadSales(range);
    }
    // For custom: wait for both date inputs to be filled
  }

  setViewMode(value: ViewMode): void {
    this.viewMode.set(value);
  }

  onCustomFromChange(value: string): void {
    this.customFrom.set(value);
    this.tryFetchCustomRange();
  }

  onCustomToChange(value: string): void {
    this.customTo.set(value);
    this.tryFetchCustomRange();
  }

  exportCsv(): void {
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

  exportPdf(): void {
    const rows = this.activeRows();
    const period = this.period();
    const groupLabel = GROUP_LABELS[this.groupBy()];
    const periodLabel =
      period === 'custom'
        ? `${this.customFrom()} – ${this.customTo()}`
        : period.charAt(0).toUpperCase() + period.slice(1);

    const doc = new jsPDF();

    // ── Header ────────────────────────────────────────────
    doc.setFillColor(37, 99, 235);
    doc.rect(0, 0, 210, 28, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('Sales Report', 14, 16);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`${groupLabel}  ·  Period: ${periodLabel}`, 14, 23);

    // ── KPI summary ───────────────────────────────────────
    doc.setTextColor(15, 23, 42);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('Total Revenue', 14, 40);
    doc.text('Total Items Sold', 80, 40);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(14);
    doc.setTextColor(37, 99, 235);
    doc.text(`Ksh ${this.totalRevenue().toFixed(2)}`, 14, 49);
    doc.text(`${this.totalItemsSold()}`, 80, 49);

    // ── Divider ───────────────────────────────────────────
    doc.setDrawColor(226, 232, 240);
    doc.line(14, 54, 196, 54);

    // ── Data table ────────────────────────────────────────
    const colLabel = this.groupBy() === 'category' ? 'Item'
      : this.groupBy() === 'cashier' ? 'Cashier'
      : this.groupBy() === 'product' ? 'Product'
      : this.groupBy() === 'payment' ? 'Payment Method'
      : 'Group';

    autoTable(doc, {
      startY: 60,
      head: [[colLabel, 'Units Sold', 'Revenue (Ksh)']],
      body: rows.map((r) => [r.label, r.count.toString(), `Ksh ${r.revenue.toFixed(2)}`]),
      styles: {
        fontSize: 9,
        cellPadding: 5,
        font: 'helvetica',
      },
      headStyles: {
        fillColor: [37, 99, 235],
        textColor: 255,
        fontStyle: 'bold',
        halign: 'left',
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252],
      },
      columnStyles: {
        1: { halign: 'right' },
        2: { halign: 'right' },
      },
    });

    // ── Footer ────────────────────────────────────────────
    const pageCount = (doc as any).internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184);
      doc.setFont('helvetica', 'normal');
      doc.text(
        `Generated ${new Date().toLocaleDateString()}  ·  Page ${i} of ${pageCount}`,
        14,
        doc.internal.pageSize.height - 8,
      );
    }

    doc.save(`sales-report-${period}-${this.groupBy()}.pdf`);
  }
}
