import { inject, Injectable } from '@angular/core';
import { RequisitionItem, Shift } from '../models/shift.model';
import { SaleItem } from '../models/sale.model';
import { productStore } from '../../store/products/product.store';
import { userStore } from '../../store/users/user.store';

export interface ShiftReportData {
  /** The shift that was just closed (should have endTime set). */
  shift: Shift;
  openedByName: string;
  closedByName: string;
  /** All confirmed + pending sales that belong to this shift. */
  sales: SaleItem[];
  /** userId → "First Last" lookup map built by the caller. */
  userMap: Record<string, string>;
  /** Stock additions recorded during the shift. */
  requisitions?: RequisitionItem[];
}

@Injectable({ providedIn: 'root' })
export class ShiftReportService {
  productList = inject(productStore).products();
  userList = inject(userStore).users();
  print(data: ShiftReportData): void {
    const html = this.buildReportHtml(data);
    const win = window.open('', '_blank', 'width=460,height=900,toolbar=0,menubar=0,scrollbars=1');
    if (!win) return;
    win.document.write(html);
    win.document.close();
    win.onload = () => {
      win.focus();
      win.print();
      win.onafterprint = () => win.close();
    };
  }

  private mapProductNameById(id: string): string {
    return this.productList.find((p) => p._id === id)?.name ?? 'Unknown Product';
  }

  private mapStaffNameById(id: string) {
    // return this.userList.find((u) => u._id === id)
    //   ? `${this.userList.find((u) => u._id === id)?.firstName ?? ''}`.trim()
    //   : 'Unknown Staff';
    console.log('show id in mapStaffNameById:', id);
    const user = this.userList.find((u) => u._id === id);
    if (user) {
      const name = `${user.firstName}`.trim();
      console.log('resolved staff name:', name);
      return name;
    } else {
      console.warn('Staff ID not found in user list:', id);
      return 'Unknown Staff';
    }
  }

  // ── Master HTML builder ───────────────────────────────────────────────────
  private buildReportHtml(data: ShiftReportData): string {
    const { shift, openedByName, closedByName, sales, userMap, requisitions = [] } = data;

    const now = new Date();
    const shiftDay = this.formatFullDate(new Date(shift.startTime));
    const openTime = this.formatTime(new Date(shift.startTime));
    const closeTime = shift.endTime
      ? this.formatTime(new Date(shift.endTime))
      : this.formatTime(now);
    const duration = this.formatDuration(
      new Date(shift.startTime),
      shift.endTime ? new Date(shift.endTime) : now,
    );

    const confirmedSales = sales.filter((s) => s.confirmed);
    const pendingSales = sales.filter((s) => !s.confirmed);

    // ── Derive first & last order numbers ────────────────────────────────────
    const sortedByDate = [...sales].sort(
      (a, b) =>
        new Date((a as any).createdAt ?? 0).getTime() -
        new Date((b as any).createdAt ?? 0).getTime(),
    );
    const firstOrder = sortedByDate.length ? this.saleLabel(sortedByDate[0]) : '—';
    const lastOrder = sortedByDate.length
      ? this.saleLabel(sortedByDate[sortedByDate.length - 1])
      : '—';

    const stars = '*'.repeat(48);
    const divider = '─'.repeat(48);

    // ── Section 1 – Shift Overview ───────────────────────────────────────────
    const sec1 = `
      <p class="section-header">SHIFT OVERVIEW</p>
      <table class="kv-table">
        <tr><td class="kv-key">Opened By</td><td class="kv-val">${this.esc(openedByName)}</td></tr>
        <tr><td class="kv-key">Open Time</td><td class="kv-val">${openTime}</td></tr>
        <tr><td class="kv-key">Closed By</td><td class="kv-val">${this.esc(closedByName)}</td></tr>
        <tr><td class="kv-key">Close Time</td><td class="kv-val">${closeTime}</td></tr>
        <tr><td class="kv-key">Duration</td><td class="kv-val">${duration}</td></tr>
        <tr><td class="kv-key">1st Order</td><td class="kv-val">${firstOrder}</td></tr>
        <tr><td class="kv-key">Last Order</td><td class="kv-val">${lastOrder}</td></tr>
        <tr><td class="kv-key">Total Sales</td><td class="kv-val">${confirmedSales.length}</td></tr>
        <tr class="kv-total"><td class="kv-key">Total Revenue</td><td class="kv-val">${this.formatKsh(confirmedSales.reduce((s, x) => s + x.totalAmount, 0))}</td></tr>
      </table>`;

    // ── Section 2 – Sales by Payment Method ──────────────────────────────────
    const paymentTotals: Record<string, number> = {};
    confirmedSales.forEach((s) => {
      const pm = (s as any).paymentMethod ?? 'Unknown';
      paymentTotals[pm] = (paymentTotals[pm] ?? 0) + s.totalAmount;
    });
    const paymentRows = Object.entries(paymentTotals)
      .sort((a, b) => b[1] - a[1])
      .map(
        ([method, amt]) =>
          `<tr><td>${this.esc(method)}</td><td class="num">${this.formatKsh(amt)}</td></tr>`,
      )
      .join('');
    const paymentTotal = Object.values(paymentTotals).reduce((s, v) => s + v, 0);

    const sec2 = `
      <p class="section-header">SALES BY PAYMENT METHOD</p>
      <table class="data-table">
        <thead><tr><th>Method</th><th class="num">Amount</th></tr></thead>
        <tbody>
          ${paymentRows || '<tr><td colspan="2" class="none">No confirmed sales</td></tr>'}
          <tr class="total-row"><td>TOTAL</td><td class="num">${this.formatKsh(paymentTotal)}</td></tr>
        </tbody>
      </table>`;

    // ── Section 3 placeholder (voided sales require backend support) ─────────
    const sec3 = '';

    // ── Section 4 – Sales by Staff ─────────────────────────────────────────
    const cashierMap: Record<string, { count: number; total: number; name: string }> = {};
    confirmedSales.forEach((s) => {
      const rawId = (s as any).cashierId;
      const id = typeof rawId === 'string' ? rawId : (rawId?._id ?? 'unknown');

      // Resolve full name: prefer userMap lookup, then populated object, then id string
      const fullName =
        userMap[id] ??
        (typeof rawId === 'object' && rawId !== null
          ? `${rawId?.firstName ?? ''} ${rawId?.lastName ?? ''}`.trim()
          : null);

      // Show first name only; fall back to shortened id if nothing resolved
      const name = fullName ? fullName.split(' ')[0] : this.mapStaffNameById(id);

      if (!cashierMap[id]) cashierMap[id] = { count: 0, total: 0, name };
      cashierMap[id].count++;
      cashierMap[id].total += s.totalAmount;
    });
    const cashierRows = Object.values(cashierMap)
      .sort((a, b) => b.total - a.total)
      .map(
        (c) =>
          `<tr><td>${this.esc(c.name)}</td><td class="num">${c.count}</td><td class="num">${this.formatKsh(c.total)}</td></tr>`,
      )
      .join('');
    const cashierTotalCount = Object.values(cashierMap).reduce((s, c) => s + c.count, 0);
    const cashierTotalAmt = Object.values(cashierMap).reduce((s, c) => s + c.total, 0);

    const sec4 = `
      <p class="section-header">SALES BY STAFF</p>
      <table class="data-table">
        <thead><tr><th>Staff</th><th class="num">Sales</th><th class="num">Total</th></tr></thead>
        <tbody>
          ${cashierRows || '<tr><td colspan="3" class="none">No confirmed sales</td></tr>'}
          <tr class="total-row">
            <td>TOTAL</td>
            <td class="num">${cashierTotalCount}</td>
            <td class="num">${this.formatKsh(cashierTotalAmt)}</td>
          </tr>
        </tbody>
      </table>`;

    // ── Section 5 – Items Sold ────────────────────────────────────────────────
    const itemMap: Record<string, { name: string; qty: number; unitPrice: number; total: number }> =
      {};
    confirmedSales.forEach((s) => {
      s.items.forEach((item) => {
        // productId may arrive as a populated object { _id, name } from the API
        const rawProductId = (item as any).productId;
        const isPopulated = typeof rawProductId === 'object' && rawProductId !== null;
        const key: string = isPopulated
          ? (rawProductId._id ?? 'unknown')
          : (rawProductId ?? item.productName ?? 'unknown');
        const resolvedName: string = isPopulated
          ? (rawProductId.name ?? item.productName ?? key)
          : ((item.productName ?? null) as any);

        if (!itemMap[key]) {
          itemMap[key] = {
            name: resolvedName || key,
            qty: 0,
            unitPrice: item.unitPrice,
            total: 0,
          };
        }
        itemMap[key].qty += item.quantity;
        itemMap[key].total += item.subTotal;
      });
    });
    const itemsSorted = Object.values(itemMap).sort((a, b) => b.qty - a.qty);
    const itemRows = itemsSorted
      .map(
        (it) =>
          `<tr>
             <td class="item-name">${this.esc(this.mapProductNameById(it.name))}</td>
             <td class="num">${it.qty}</td>
             <td class="num">${it.unitPrice.toFixed(2)}</td>
             <td class="num">${this.formatKsh(it.total)}</td>
           </tr>`,
      )
      .join('');
    const itemTotalQty = itemsSorted.reduce((s, i) => s + i.qty, 0);
    const itemTotalAmt = itemsSorted.reduce((s, i) => s + i.total, 0);

    const sec5 = `
      <p class="section-header">ITEMS SOLD</p>
      <table class="data-table items-wide">
        <thead><tr><th>Item</th><th class="num">Qty</th><th class="num">Unit</th><th class="num">Total</th></tr></thead>
        <tbody>
          ${itemRows || '<tr><td colspan="4" class="none">No items sold</td></tr>'}
          <tr class="total-row">
            <td>TOTAL</td>
            <td class="num">${itemTotalQty}</td>
            <td></td>
            <td class="num">${this.formatKsh(itemTotalAmt)}</td>
          </tr>
        </tbody>
      </table>`;

    // ── Section 6 – Kitchen Requisitions ─────────────────────────────────────
    const reqRows = requisitions
      .map(
        (r) =>
          `<tr>
             <td>${this.esc(r.productName.toUpperCase())}</td>
             <td class="num">${r.quantity}</td>
             <td>${this.mapStaffNameById(r.addedBy ?? 'unknown')}</td>
             <td>${this.formatTime(new Date(r.addedAt))}</td>
           </tr>`,
      )
      .join('');
    const sec6 = `
      <p class="section-header">5. KITCHEN REQUISITIONS</p>
      ${
        requisitions.length === 0
          ? '<p class="none-msg">No requisitions recorded this shift.</p>'
          : `<table class="data-table">
               <thead>
                 <tr><th>Item</th><th class="num">Qty Added</th><th>Added By</th><th>Time</th></tr>
               </thead>
               <tbody>${reqRows}</tbody>
             </table>`
      }`;

    // ── Assemble full document ────────────────────────────────────────────────
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>Shift Summary</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }

    body {
      font-family: 'Courier New', Courier, monospace;
      font-size: 9pt;
      font-weight: 700;
      background: #fff;
      color: #000;
    }

    .report {
      width: 80mm;
      max-width: 80mm;
      margin: 0 auto;
      padding: 4mm 2mm;
    }

    /* ── Title ── */
    .report-title {
      text-align: center;
      font-size: 18pt;
      font-weight: 900;
      text-transform: uppercase;
      margin: 6px 0 2px;
      letter-spacing: 0.5px;
    }

    .report-subtitle {
      text-align: center;
      font-size: 8.5pt;
      font-weight: 700;
      margin: 2px 0 4px;
    }

    /* ── Stars / Dividers ── */
    .stars {
      font-size: 7.5pt;
      text-align: center;
      margin: 3px 0;
      overflow: hidden;
      white-space: nowrap;
    }

    .divider {
      border-top: 1px solid #000;
      margin: 5px 0;
    }

    /* ── Section headers ── */
    .section-header {
      font-size: 8pt;
      font-weight: 900;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin: 8px 0 3px;
      border-bottom: 1px solid #000;
      padding-bottom: 1px;
    }

    /* ── Key-Value table (Shift Overview) ── */
    .kv-table {
      width: 100%;
      border-collapse: collapse;
    }

    .kv-table td {
      font-size: 8.5pt;
      padding: 1px 2px;
      vertical-align: top;
    }

    .kv-key {
      width: 46%;
      font-weight: 700;
    }

    .kv-val {
      width: 54%;
    }

    .kv-total td {
      font-weight: 900;
      border-top: 1px solid #000;
      padding-top: 3px;
    }

    /* ── Data tables ── */
    .data-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 2px;
    }

    .data-table th,
    .data-table td {
      font-size: 8pt;
      padding: 2px 3px;
      border: 1px solid #000;
    }

    .data-table thead th {
      font-weight: 900;
      background: #fff;
      text-align: left;
    }

    .data-table .num {
      text-align: right;
    }

    .total-row td {
      font-weight: 900;
      border-top: 2px solid #000;
    }

    .none {
      text-align: center;
      font-style: italic;
    }

    /* ── Items table ── */
    .items-wide .item-name {
      width: 38%;
      word-break: break-word;
      font-size: 7.5pt;
    }

    /* ── None message ── */
    .none-msg {
      font-size: 8pt;
      font-style: italic;
      text-align: center;
      padding: 3px 0;
      color: #333;
    }

    /* ── Footer ── */
    .shift-closed {
      text-align: center;
      font-size: 16pt;
      font-weight: 900;
      text-transform: uppercase;
      margin: 8px 0 4px;
      letter-spacing: 1px;
    }

    @media print {
      @page { size: 80mm auto; margin: 0; }
      body { margin: 0; padding: 0; }
      .report { width: 80mm; max-width: 80mm; }
    }
  </style>
</head>
<body>
  <div class="report">
    <p class="stars">${stars}</p>
    <p class="report-title">SHIFT SUMMARY</p>
    <p class="report-subtitle">${shiftDay}</p>
    <p class="stars">${stars}</p>

    ${sec1}
    <div class="divider"></div>

    ${sec2}
    <div class="divider"></div>

    ${sec4}
    <div class="divider"></div>

    ${sec5}
    <div class="divider"></div>

    ${sec6}

    <p class="stars">${stars}</p>
    <p class="shift-closed">SHIFT CLOSED</p>
    <p class="stars">${stars}</p>
  </div>
</body>
</html>`;
  }

  // ── Private helpers ───────────────────────────────────────────────────────

  private saleLabel(sale: SaleItem): string {
    return sale.saleId ? `#${sale.saleId}` : `#${(sale._id ?? '').slice(-6).toUpperCase()}`;
  }

  private resolveCashier(sale: SaleItem, userMap: Record<string, string>): string {
    const rawId = (sale as any).cashierId;
    if (!rawId) return 'Unknown';
    const id = typeof rawId === 'string' ? rawId : rawId._id;
    return (
      userMap[id] ??
      (typeof rawId === 'object'
        ? `${rawId?.firstName ?? ''} ${rawId?.lastName ?? ''}`.trim()
        : 'Unknown')
    );
  }

  private formatFullDate(d: Date): string {
    return d.toLocaleDateString([], {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }

  private formatTime(d: Date): string {
    let h = d.getHours();
    const min = String(d.getMinutes()).padStart(2, '0');
    const ampm = h >= 12 ? 'pm' : 'am';
    h = h % 12 || 12;
    return `${h}:${min}${ampm}`;
  }

  private formatDuration(from: Date, to: Date): string {
    const ms = to.getTime() - from.getTime();
    const h = Math.floor(ms / 3_600_000);
    const m = Math.floor((ms % 3_600_000) / 60_000);
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
  }

  private formatKsh(v: number): string {
    return `Ksh ${v.toFixed(2)}`;
  }

  private esc(str: string): string {
    return (str ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }
}
