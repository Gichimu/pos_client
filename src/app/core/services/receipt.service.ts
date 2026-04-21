import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { CartItem } from '../models/cart.model';
import { SaleItem } from '../models/sale.model';
import { User } from '../models/user.model';
import { Shift } from '../models/shift.model';

export interface PrintReceiptData {
  sale: SaleItem;
  cashier: User | null;
  shift: Shift | null;
  cartSnapshot: CartItem[];
  grandTotal: number;
}

export interface VoidReceiptData {
  sale: SaleItem;
  cashier: User | null;
  shift: Shift | null;
}

@Injectable({ providedIn: 'root' })
export class ReceiptService {
  print(data: PrintReceiptData): void {
    const receiptHtml = this.buildReceiptHtml(data);
    const win = window.open('', '_blank', 'width=400,height=700,toolbar=0,menubar=0,scrollbars=1');
    if (!win) return; // popup blocked — silently skip

    win.document.write(receiptHtml);
    win.document.close();

    // Wait for fonts/layout to settle, then print
    win.onload = () => {
      win.focus();
      win.print();
      // Close popup after print dialog is dismissed
      win.onafterprint = () => win.close();
    };
  }

  // ── HTML builder ────────────────────────────────────────────────────
  private buildReceiptHtml(data: PrintReceiptData): string {
    const { sale, cashier, shift, cartSnapshot, grandTotal } = data;

    const cashierName = cashier ? `${cashier.firstName}`.toUpperCase() : 'CASHIER';

    const billNo = sale.saleId ? sale.saleId.slice(-5).toUpperCase() : '00000';

    const now = new Date();
    const shiftDate = shift ? this.formatDate(new Date(shift.startTime)) : this.formatDate(now);
    const saleTime = this.formatTime(now);

    const vatRate = 0.16;
    const levyRate = 0.02;
    // Back-calculate VAT and Catering Levy from the tax-inclusive total
    const gross = grandTotal;
    const vat = +((gross * vatRate) / (1 + vatRate)).toFixed(2);
    const levy = +((gross * levyRate) / (1 + levyRate)).toFixed(2);

    const stars = '*'.repeat(42);

    const lineItemsHtml = cartSnapshot
      .map((item) => {
        const qty = item.quantity.toFixed(2);
        const unit = item.product.sellingPrice.toFixed(2);
        const total = (item.quantity * item.product.sellingPrice).toFixed(2);
        const name = item.product.name.toUpperCase();
        return `
          <tr>
            <td class="col-qty">${qty}</td>
            <td class="col-name">${this.escapeHtml(name)}</td>
            <td class="col-unit">${unit}</td>
            <td class="col-total">${total}</td>
          </tr>`;
      })
      .join('');

    const receiptBody = `
      <div class="receipt">
        <p class="stars">${stars}</p>
        <p class="store-name">${this.escapeHtml(environment.storeName)}</p>
        <p class="stars">${stars}</p>
        <p class="center">Cell: ${this.escapeHtml(environment.storePhone)}</p>
        <p class="stars">${stars}</p>

        <div class="meta-row">
          <span>SERVED BY: ${this.escapeHtml(cashierName)}</span>
          <span>BILL No: ${billNo}</span>
        </div>
        <div class="meta-row">
          <span>SHIFT: ${shiftDate}</span>
          <span>SALE TIME: ${saleTime}</span>
        </div>

        <p class="stars">${stars}</p>

        <table class="items-table">
          <thead>
            <tr>
              <th class="col-qty">QTY</th>
              <th class="col-name">ITEM</th>
              <th class="col-unit">UNIT</th>
              <th class="col-total">TOTAL</th>
            </tr>
          </thead>
          <tbody>
            ${lineItemsHtml}
          </tbody>
        </table>

        <p class="stars">${stars}</p>
        <p class="grand-total">Total: ${grandTotal.toFixed(2)}</p>
        <p class="stars">${stars}</p>

        <div class="meta-row">
          <span>Gross:${gross.toFixed(2)}</span>
          <span>V.A.T(16%): ${vat.toFixed(2)}</span>
        </div>
        <p class="center">Cat Levy(2%): ${levy.toFixed(2)}</p>

        <p class="stars">${stars}</p>
        <p class="center bold">THANK YOU</p>
        <p class="center">This is not an ETR. Request for one</p>
        <p class="stars">${stars}</p>
        <p class="center till">Till: ${this.escapeHtml(environment.tillNumber)}</p>
        <p class="stars">${stars}</p>
      </div>`;

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>Receipt — ${environment.storeName}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }

    body {
      font-family: 'Courier New', Courier, monospace;
      font-size: 9pt;
      background: #fff;
      color: #000;
    }

    .receipt {
      width: 80mm;
      max-width: 80mm;
      margin: 0 auto;
      padding: 4mm 2mm;
    }

    .stars {
      font-size: 7.5pt;
      letter-spacing: 0;
      text-align: center;
      margin: 3px 0;
      overflow: hidden;
      white-space: nowrap;
    }

    .store-name {
      text-align: center;
      font-size: 16pt;
      font-weight: 900;
      text-transform: uppercase;
      margin: 6px 0;
      letter-spacing: 0.5px;
    }

    .center {
      text-align: center;
      margin: 2px 0;
    }

    .bold { font-weight: 700; }

    .meta-row {
      display: flex;
      justify-content: space-between;
      margin: 2px 0;
      font-size: 8.5pt;
      font-weight: 700;
    }

    .items-table {
      width: 100%;
      border-collapse: collapse;
      margin: 0;
    }

    .items-table th,
    .items-table td {
      padding: 2px 1px;
      font-size: 8.5pt;
    }

    .items-table thead th {
      font-weight: 700;
      border-bottom: 1px solid #000;
      border-top: 1px solid #000;
    }

    .col-qty   { width: 14%; text-align: left; }
    .col-name  { width: 44%; text-align: left; }
    .col-unit  { width: 20%; text-align: right; }
    .col-total { width: 22%; text-align: right; }

    .grand-total, .till {
      text-align: center;
      font-size: 14pt;
      font-weight: 900;
      margin: 4px 0;
    }

    /* ── Duplicate separator ── */
    .cut-line {
      width: 80mm;
      max-width: 80mm;
      margin: 6px auto;
      text-align: center;
      font-size: 8pt;
      letter-spacing: 2px;
      border-top: 1px dashed #000;
      padding-top: 4px;
    }

    @media print {
      @page {
        size: 80mm auto;
        margin: 0;
      }
      body { margin: 0; padding: 0; }
      .receipt { width: 80mm; max-width: 80mm; }
    }
  </style>
</head>
<body>
  ${receiptBody}
  <div class="cut-line">- - - - - - - - - CUT - - - - - - - - -</div>
  ${receiptBody}
</body>
</html>`;
  }

  // ── Void receipt ────────────────────────────────────────────────────
  printVoid(data: VoidReceiptData): void {
    const html = this.buildVoidReceiptHtml(data);
    const win = window.open('', '_blank', 'width=400,height=700,toolbar=0,menubar=0,scrollbars=1');
    if (!win) return;
    win.document.write(html);
    win.document.close();
    win.onload = () => {
      win.focus();
      win.print();
      win.onafterprint = () => win.close();
    };
  }

  private buildVoidReceiptHtml(data: VoidReceiptData): string {
    const { sale, cashier, shift } = data;
    const cashierName = cashier ? `${cashier.firstName}`.toUpperCase() : 'CASHIER';
    const billNo = sale.saleId ? sale.saleId.slice(-5).toUpperCase() : '00000';
    const now = new Date();
    const shiftDate = shift ? this.formatDate(new Date((shift as any).startTime)) : this.formatDate(now);
    const saleTime = this.formatTime(now);

    const vatRate = 0.16;
    const levyRate = 0.02;
    const gross = sale.totalAmount;
    const vat = +((gross * vatRate) / (1 + vatRate)).toFixed(2);
    const levy = +((gross * levyRate) / (1 + levyRate)).toFixed(2);

    const stars = '*'.repeat(42);

    const lineItemsHtml = sale.items
      .map((item) => {
        const qty = item.quantity.toFixed(2);
        const unit = item.unitPrice.toFixed(2);
        const total = item.subTotal.toFixed(2);
        const name = (item.productName ?? 'ITEM').toUpperCase();
        return `<tr>
          <td class="col-qty">${qty}</td>
          <td class="col-name">${this.escapeHtml(name)}</td>
          <td class="col-unit">${unit}</td>
          <td class="col-total">${total}</td>
        </tr>`;
      })
      .join('');

    const receiptBody = `
      <div class="receipt">
        <p class="stars">${stars}</p>
        <p class="store-name">${this.escapeHtml(environment.storeName)}</p>
        <p class="stars">${stars}</p>
        <p class="void-banner">** V O I D E D   S A L E **</p>
        <p class="stars">${stars}</p>
        <p class="center">Cell: ${this.escapeHtml(environment.storePhone)}</p>
        <p class="stars">${stars}</p>

        <div class="meta-row">
          <span>SERVED BY: ${this.escapeHtml(cashierName)}</span>
          <span>BILL No: ${billNo}</span>
        </div>
        <div class="meta-row">
          <span>VOID DATE: ${shiftDate}</span>
          <span>VOID TIME: ${saleTime}</span>
        </div>

        <p class="stars">${stars}</p>

        <table class="items-table">
          <thead>
            <tr>
              <th class="col-qty">QTY</th>
              <th class="col-name">ITEM</th>
              <th class="col-unit">UNIT</th>
              <th class="col-total">TOTAL</th>
            </tr>
          </thead>
          <tbody>${lineItemsHtml}</tbody>
        </table>

        <p class="stars">${stars}</p>
        <p class="grand-total">VOIDED: ${gross.toFixed(2)}</p>
        <p class="stars">${stars}</p>

        <div class="meta-row">
          <span>Gross:${gross.toFixed(2)}</span>
          <span>V.A.T(16%): ${vat.toFixed(2)}</span>
        </div>
        <p class="center">Cat Levy(2%): ${levy.toFixed(2)}</p>

        <p class="stars">${stars}</p>
        <p class="center bold">SALE VOIDED — STOCK RESTORED</p>
        <p class="center">This is not an ETR. Request for one</p>
        <p class="stars">${stars}</p>
        <p class="center till">Till: ${this.escapeHtml(environment.tillNumber)}</p>
        <p class="stars">${stars}</p>
      </div>`;

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>VOID — ${environment.storeName} — ${billNo}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Courier New', Courier, monospace; font-size: 9pt; background: #fff; color: #000; }
    .receipt { width: 80mm; max-width: 80mm; margin: 0 auto; padding: 4mm 2mm; position: relative; }
    .stars { font-size: 7.5pt; letter-spacing: 0; text-align: center; margin: 3px 0; overflow: hidden; white-space: nowrap; }
    .store-name { text-align: center; font-size: 16pt; font-weight: 900; text-transform: uppercase; margin: 6px 0; }
    .void-banner { text-align: center; font-size: 11pt; font-weight: 900; margin: 4px 0; letter-spacing: 1px; }
    .center { text-align: center; margin: 2px 0; }
    .bold { font-weight: 700; }
    .meta-row { display: flex; justify-content: space-between; margin: 2px 0; font-size: 8.5pt; font-weight: 700; }
    .items-table { width: 100%; border-collapse: collapse; margin: 0; }
    .items-table th, .items-table td { padding: 2px 1px; font-size: 8.5pt; }
    .items-table thead th { font-weight: 700; border-bottom: 1px solid #000; border-top: 1px solid #000; }
    .col-qty   { width: 14%; text-align: left; }
    .col-name  { width: 44%; text-align: left; }
    .col-unit  { width: 20%; text-align: right; }
    .col-total { width: 22%; text-align: right; }
    .grand-total, .till { text-align: center; font-size: 14pt; font-weight: 900; margin: 4px 0; }
    .cut-line { width: 80mm; max-width: 80mm; margin: 6px auto; text-align: center; font-size: 8pt; letter-spacing: 2px; border-top: 1px dashed #000; padding-top: 4px; }
    @media print {
      @page { size: 80mm auto; margin: 0; }
      body { margin: 0; padding: 0; }
      .receipt { width: 80mm; max-width: 80mm; }
    }
  </style>
</head>
<body>
  ${receiptBody}
  <div class="cut-line">- - - - - - - - - CUT - - - - - - - - -</div>
  ${receiptBody}
</body>
</html>`;
  }

  // ── Helpers ─────────────────────────────────────────────────────────
  private formatDate(d: Date): string {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

  private formatTime(d: Date): string {
    let h = d.getHours();
    const min = String(d.getMinutes()).padStart(2, '0');
    const ampm = h >= 12 ? 'pm' : 'am';
    h = h % 12 || 12;
    return `${h}:${min}${ampm}`;
  }

  private escapeHtml(str: string): string {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }
}
