import { Component, Inject, signal, computed, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialog, MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule, MatSelectionListChange } from '@angular/material/list';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MpesaMessage } from '../../../core/models/mpesa-message.model';
import { SalesService } from '../../../core/services/sales-service';
import { authStore } from '../../../store/auth/auth.store';
import { RefundApprovalDialogComponent } from './refund-approval-dialog/refund-approval-dialog.component';
import { isExactPaymentAmount, overpaymentAmount } from './refund-approval-dialog/refund-approval.utils';
import { MpesaMessageDialogData, MpesaSelectionResult } from './refund-approval-dialog/refund-approval.models';

@Component({
  selector: 'app-mpesa-message-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatListModule,
    MatInputModule,
    MatFormFieldModule,
    MatButtonToggleModule,
  ],
  template: `
    <div class="mpesa-dialog">
      <div class="mpesa-dialog__header" mat-dialog-title>
        <div class="mpesa-dialog__header-icon">
          <mat-icon>message</mat-icon>
        </div>
        <div>
          <h2 class="mpesa-dialog__title">Select M-Pesa Message</h2>
          <p class="mpesa-dialog__subtitle">
            Expected Amount: <strong>{{ formatCurrency(data.requiredAmount) }}</strong>
          </p>
        </div>
      </div>

      <mat-dialog-content class="mpesa-dialog__content">
        <div class="mpesa-dialog__mode-selector">
          <mat-button-toggle-group
            [value]="selectionMode()"
            (change)="onModeChange($event.value)"
            aria-label="Selection Mode"
            class="mpesa-mode-toggle"
          >
            <mat-button-toggle value="single">
              <div class="mpesa-mode-toggle__item">
                <mat-icon>filter_1</mat-icon>
                <span>Single</span>
              </div>
            </mat-button-toggle>
            <mat-button-toggle value="multiple">
              <div class="mpesa-mode-toggle__item">
                <mat-icon>filter_9_plus</mat-icon>
                <span>Multiple</span>
              </div>
            </mat-button-toggle>
          </mat-button-toggle-group>
        </div>

        <div class="mpesa-dialog__toolbar">
          <mat-form-field appearance="outline" class="mpesa-dialog__search">
            <mat-label>Search messages</mat-label>
            <mat-icon matPrefix>search</mat-icon>
            <input
              matInput
              [ngModel]="searchQuery()"
              (ngModelChange)="searchQuery.set($event)"
              placeholder="Search by name, phone or ID"
            />
          </mat-form-field>

          @if (selectionMode() === 'multiple') {
            <div class="mpesa-dialog__quick-actions">
              <button
                mat-stroked-button
                class="quick-action-btn"
                (click)="selectAll()"
                [disabled]="filteredMessages().length === 0"
              >
                <mat-icon>done_all</mat-icon>
                Select All
              </button>
              <button
                mat-button
                class="quick-action-btn quick-action-btn--clear"
                (click)="clearAll()"
                [disabled]="selectedMessages().length === 0"
              >
                <mat-icon>clear_all</mat-icon>
                Clear
              </button>
            </div>
          }
        </div>

        <!-- Separate lists ensure Material re-renders indicators (radio vs checkbox) correctly -->
        <div class="mpesa-dialog__list-container">
          @if (selectionMode() === 'single') {
            <mat-selection-list
              [multiple]="false"
              (selectionChange)="onSelectionChange($event)"
              class="mpesa-dialog__list"
            >
              @for (msg of filteredMessages(); track msg.mpesaCode) {
                <mat-list-option
                  [value]="msg"
                  [selected]="isMessageSelected(msg.mpesaCode)"
                  [class.mpesa-dialog__option--mismatch]="msg.amount !== data.requiredAmount"
                >
                  <ng-container
                    *ngTemplateOutlet="messageTpl; context: { $implicit: msg }"
                  ></ng-container>
                </mat-list-option>
              } @empty {
                <ng-container *ngTemplateOutlet="emptyTpl"></ng-container>
              }
            </mat-selection-list>
          } @else {
            <mat-selection-list
              [multiple]="true"
              (selectionChange)="onSelectionChange($event)"
              class="mpesa-dialog__list"
            >
              @for (msg of filteredMessages(); track msg.mpesaCode) {
                <mat-list-option [value]="msg" [selected]="isMessageSelected(msg.mpesaCode)">
                  <ng-container
                    *ngTemplateOutlet="messageTpl; context: { $implicit: msg }"
                  ></ng-container>
                </mat-list-option>
              } @empty {
                <ng-container *ngTemplateOutlet="emptyTpl"></ng-container>
              }
            </mat-selection-list>
          }
        </div>

        <ng-template #messageTpl let-msg>
          <div class="mpesa-message">
            <div class="mpesa-message__main">
              <span class="mpesa-message__id">{{ msg.mpesaCode }}</span>
              <span class="mpesa-message__sender">{{ msg.customerName }}</span>
            </div>
            <div class="mpesa-message__meta">
              <span
                class="mpesa-message__amount"
                [class.mpesa-message__amount--match]="msg.amount === data.requiredAmount"
              >
                {{ formatCurrency(msg.amount) }}
              </span>
              <span class="mpesa-message__time">{{ msg.Date }}</span>
            </div>
          </div>
        </ng-template>

        <ng-template #emptyTpl>
          <div class="mpesa-dialog__empty">
            <mat-icon>search_off</mat-icon>
            <p>No M-Pesa messages found</p>
          </div>
        </ng-template>

        <div class="mpesa-dialog__footer-fixed">
          @if (selectionMode() === 'multiple') {
            <div
              class="mpesa-dialog__summary"
              [class.mpesa-dialog__summary--match]="isValidSelection()"
            >
              <div class="mpesa-summary__item">
                <span class="mpesa-summary__label">Total Selected</span>
                <strong class="mpesa-summary__value">{{
                  formatCurrency(totalSelectedAmount())
                }}</strong>
              </div>
              <div class="mpesa-summary__item">
                <span class="mpesa-summary__label">Remaining</span>
                <strong class="mpesa-summary__value" [class.text-danger]="remainingAmount() > 0">
                  {{ formatCurrency(remainingAmount()) }}
                </strong>
              </div>
            </div>
          }

          @if (isOverpaid()) {
            <div class="mpesa-dialog__refund-notice" role="status">
              <mat-icon>warning_amber</mat-icon>
              <span>
                This payment is higher than the expected amount by
                <strong>{{ formatCurrency(overpaymentAmount()) }}</strong>.
              </span>
            </div>
            @if (refundActionError()) {
              <div class="mpesa-dialog__error" role="alert">{{ refundActionError() }}</div>
            }
          } @else if (hasUnderpayment()) {
            <div class="mpesa-dialog__error" role="status">
              <mat-icon>error_outline</mat-icon>
              <span>Selected amount is below the expected amount.</span>
            </div>
          }
        </div>
      </mat-dialog-content>

      <mat-dialog-actions align="end" class="mpesa-dialog__actions">
        <button mat-button (click)="cancel()">Cancel</button>
        @if (isOverpaid()) {
          <button
            mat-flat-button
            color="primary"
            class="refund-request-button"
            (click)="requestRefund()"
          >
            <mat-icon>assignment_return</mat-icon>
            Request refund · {{ formatCurrency(overpaymentAmount()) }}
          </button>
        } @else {
          <button
            mat-flat-button
            color="primary"
            [disabled]="!isValidSelection()"
            (click)="confirm()"
          >
            Confirm Selection
          </button>
        }
      </mat-dialog-actions>
    </div>
  `,
  styles: [
    `
      .mpesa-dialog {
        width: 100%;
        max-width: 600px;
        max-height: 90vh;
        box-sizing: border-box;
        display: flex;
        flex-direction: column;
      }
      .mpesa-dialog__header {
        display: flex;
        align-items: center;
        gap: 16px;
        padding: 20px 24px;
        border-bottom: 1px solid var(--color-border);
        flex-shrink: 0;
      }
      .mpesa-dialog__header-icon {
        width: 48px;
        height: 48px;
        flex-shrink: 0;
        border-radius: 12px;
        background: #e0f2f1;
        display: flex;
        align-items: center;
        justify-content: center;
        mat-icon {
          color: #00897b;
          font-size: 24px;
          width: 24px;
          height: 24px;
        }
      }
      .mpesa-dialog__title {
        font-size: 1.1rem;
        font-weight: 700;
        margin: 0 0 2px;
      }
      .mpesa-dialog__subtitle {
        font-size: 0.85rem;
        color: var(--color-text-muted);
        margin: 0;
      }
      .mpesa-dialog__content {
        padding: 20px 24px !important;
        display: flex;
        flex-direction: column;
        overflow: hidden !important;
        flex: 1;
      }
      .mpesa-dialog__mode-selector {
        margin-bottom: 20px;
        display: flex;
        justify-content: center;
        flex-shrink: 0;
      }
      .mpesa-mode-toggle {
        border-radius: 20px;
        overflow: hidden;
      }
      .mpesa-mode-toggle__item {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 0 12px;
        mat-icon {
          font-size: 18px;
          width: 18px;
          height: 18px;
        }
      }
      .mpesa-dialog__toolbar {
        display: flex;
        flex-direction: column;
        gap: 8px;
        margin-bottom: 16px;
        flex-shrink: 0;
      }
      .mpesa-dialog__search {
        width: 100%;
        margin-bottom: 0;
      }
      .mpesa-dialog__quick-actions {
        display: flex;
        justify-content: flex-end;
        gap: 8px;
      }
      .quick-action-btn {
        font-size: 0.75rem;
        height: 32px;
        line-height: 32px;
        padding: 0 12px;
        display: flex;
        align-items: center;
        gap: 4px;
        border-radius: 16px;
        mat-icon {
          font-size: 16px;
          width: 16px;
          height: 16px;
        }
      }
      .quick-action-btn--clear {
        color: var(--color-text-muted);
      }
      .mpesa-dialog__list-container {
        flex: 1;
        min-height: 0;
        display: flex;
        flex-direction: column;
        margin-bottom: 16px;
      }
      .mpesa-dialog__list {
        flex: 1;
        overflow-y: auto;
        border: 1px solid var(--color-border);
        border-radius: 8px;
      }
      .mpesa-message {
        display: flex;
        justify-content: space-between;
        align-items: center;
        width: 100%;
        padding: 4px 0;
      }
      .mpesa-message__main {
        display: flex;
        flex-direction: column;
        overflow: hidden;
      }
      .mpesa-message__id {
        font-weight: 700;
        font-size: 0.9rem;
        font-family: monospace;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      .mpesa-message__sender {
        font-size: 0.75rem;
        color: var(--color-text-muted);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      .mpesa-message__meta {
        display: flex;
        flex-direction: column;
        align-items: flex-end;
        flex-shrink: 0;
        margin-left: 12px;
      }
      .mpesa-message__amount {
        font-weight: 700;
        color: #ef4444;
      }
      .mpesa-message__amount--match {
        color: #10b981;
      }
      .mpesa-message__time {
        font-size: 0.7rem;
        color: var(--color-text-light);
      }
      .mpesa-dialog__footer-fixed {
        flex-shrink: 0;
      }
      .mpesa-dialog__summary {
        display: flex;
        justify-content: space-between;
        margin-top: 4px;
        padding: 14px 18px;
        background: #f8fafc;
        border: 1.5px solid #e2e8f0;
        border-radius: 10px;
        font-size: 0.95rem;
        transition: all 0.2s ease;
      }
      .mpesa-dialog__summary--match {
        background: #f0fdf4;
        border-color: #4ade80;
        color: #166534;
        box-shadow: 0 0 15px rgba(74, 222, 128, 0.1);
      }
      .mpesa-summary__item {
        display: flex;
        flex-direction: column;
        gap: 2px;
      }
      .mpesa-summary__label {
        font-size: 0.75rem;
        text-transform: uppercase;
        letter-spacing: 0.025em;
        opacity: 0.7;
      }
      .mpesa-summary__value {
        font-family: 'Inter', sans-serif;
        font-weight: 700;
      }
      .mpesa-dialog__empty {
        display: flex;
        flex-direction: column;
        align-items: center;
        padding: 40px;
        color: var(--color-text-muted);
        mat-icon {
          font-size: 48px;
          width: 48px;
          height: 48px;
          margin-bottom: 8px;
        }
      }
      .mpesa-dialog__error {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-top: 10px;
        padding: 10px 14px;
        background: #fff1f2;
        border: 1px solid #fecaca;
        border-radius: 8px;
        color: #e11d48;
        font-size: 0.85rem;
        mat-icon {
          font-size: 18px;
          width: 18px;
          height: 18px;
        }
      }
      .mpesa-dialog__actions {
        padding: 16px 24px !important;
        border-top: 1px solid var(--color-border);
        flex-shrink: 0;
      }
      .refund-request-button mat-icon {
        margin-right: 6px;
      }
      .mpesa-dialog__refund-notice {
        display: flex;
        align-items: flex-start;
        gap: 8px;
        margin-top: 10px;
        padding: 10px 12px;
        border: 1px solid #fed7aa;
        border-radius: 8px;
        background: #fff7ed;
        color: #9a3412;
        font-size: 0.82rem;
        line-height: 1.4;
      }
      .mpesa-dialog__refund-notice mat-icon {
        width: 18px;
        height: 18px;
        flex: 0 0 18px;
        color: #ea580c;
        font-size: 18px;
      }
      .mpesa-dialog__option--mismatch {
        opacity: 0.6;
      }
      .text-danger {
        color: #ef4444;
      }

      /* ── Responsive Overrides ────────────────── */
      @media (max-width: 600px) {
        .mpesa-dialog__header {
          padding: 16px;
          gap: 12px;
        }
        .mpesa-dialog__header-icon {
          width: 40px;
          height: 40px;
          mat-icon {
            font-size: 20px;
            width: 20px;
            height: 20px;
          }
        }
        .mpesa-dialog__title {
          font-size: 1rem;
        }
        .mpesa-dialog__content {
          padding: 16px !important;
        }
        .mpesa-mode-toggle__item {
          padding: 0 8px;
          span {
            font-size: 0.8rem;
          }
        }
        .mpesa-dialog__quick-actions {
          flex-wrap: wrap;
          justify-content: center;
        }
        .quick-action-btn {
          flex: 1;
          justify-content: center;
        }
        .mpesa-dialog__summary {
          flex-direction: column;
          gap: 12px;
          padding: 12px;
        }
        .mpesa-summary__item {
          flex-direction: row;
          justify-content: space-between;
          align-items: center;
        }
        .mpesa-dialog__actions {
          padding: 12px 16px !important;
          flex-direction: column-reverse;
          gap: 8px;
          button {
            width: 100%;
            margin: 0 !important;
          }
        }
      }
    `,
  ],
})
export class MpesaMessageDialogComponent implements OnInit {
  private readonly salesService = inject(SalesService);
  private readonly dialog = inject(MatDialog);
  private readonly currentAuth = inject(authStore);

  selectionMode = signal<'single' | 'multiple'>('single');
  searchQuery = signal('');
  selectedMessages = signal<MpesaMessage[]>([]);
  readonly refundActionError = signal('');

  // Use a Set for O(1) lookups in the template
  private readonly selectedCodesSet = computed(() => {
    return new Set(this.selectedMessages().map((m) => m.mpesaCode));
  });

  messages = signal<MpesaMessage[]>([]);

  filteredMessages = computed(() => {
    const q = this.searchQuery().toLowerCase();
    return this.messages().filter(
      (m) =>
        !m.isUsed &&
        m.mpesaCode &&
        m.Date &&
        (m.mpesaCode?.toLowerCase().includes(q) || m.customerName?.toLowerCase().includes(q)),
    );
  });

  totalSelectedAmount = computed(() => {
    return this.selectedMessages().reduce((sum, msg) => sum + msg.amount, 0);
  });

  remainingAmount = computed(() => {
    const remaining = this.data.requiredAmount - this.totalSelectedAmount();
    return Math.max(0, remaining);
  });

  readonly overpaymentAmount = computed(() =>
    overpaymentAmount(this.totalSelectedAmount(), this.data.requiredAmount),
  );

  readonly isOverpaid = computed(
    () =>
      this.data.allowOverpaymentRefund === true &&
      this.data.saleId !== undefined &&
      this.selectedMessages().length > 0 &&
      this.overpaymentAmount() > 0,
  );

  readonly hasUnderpayment = computed(
    () => this.selectedMessages().length > 0 && this.totalSelectedAmount() < this.data.requiredAmount - 0.009,
  );

  isValidSelection = computed(() =>
    this.selectedMessages().length > 0 &&
    isExactPaymentAmount(this.totalSelectedAmount(), this.data.requiredAmount),
  );

  constructor(
    private readonly dialogRef: MatDialogRef<MpesaMessageDialogComponent, MpesaSelectionResult>,
    @Inject(MAT_DIALOG_DATA) public readonly data: MpesaMessageDialogData,
  ) {}

  ngOnInit() {
    this.getAllMessages();
  }

  getAllMessages() {
    this.salesService.getAllMpesaMessages().subscribe({
      next: (data) => {
        this.messages.set(data.filter((message) => message.Date && !message.isUsed));
      },
      error: () => this.messages.set([]),
    });
  }

  onModeChange(mode: 'single' | 'multiple') {
    this.selectionMode.set(mode);
    this.selectedMessages.set([]);
  }

  onSelectionChange(event: MatSelectionListChange) {
    if (this.selectionMode() === 'single') {
      this.selectedMessages.set(event.source.selectedOptions.selected.map((o) => o.value));
      return;
    }

    const current = [...this.selectedMessages()];
    event.options.forEach((opt) => {
      const msg = opt.value as MpesaMessage;
      if (opt.selected) {
        if (!current.some((m) => m.mpesaCode === msg.mpesaCode)) {
          current.push(msg);
        }
      } else {
        const index = current.findIndex((m) => m.mpesaCode === msg.mpesaCode);
        if (index !== -1) {
          current.splice(index, 1);
        }
      }
    });
    this.selectedMessages.set(current);
  }

  isMessageSelected(mpesaCode: string): boolean {
    return this.selectedCodesSet().has(mpesaCode);
  }

  selectAll() {
    if (this.selectionMode() === 'multiple') {
      const visible = this.filteredMessages();
      const current = [...this.selectedMessages()];

      visible.forEach((msg) => {
        if (!current.some((m) => m.mpesaCode === msg.mpesaCode)) {
          current.push(msg);
        }
      });

      this.selectedMessages.set(current);
    }
  }

  clearAll() {
    this.selectedMessages.set([]);
  }

  confirm() {
    if (this.isValidSelection()) {
      const selected = this.selectedMessages();
      if (selected.length === 0) return;
      this.dialogRef.close({ messages: selected });
    }
  }

  requestRefund(): void {
    if (!this.isOverpaid() || !this.data.saleId) return;

    const user = this.currentAuth.user();
    const displayName = user ? `${user.firstName} ${user.lastName}`.trim() || user.email : '';
    if (!displayName) {
      this.refundActionError.set('Unable to identify the signed-in staff member. Please sign in again.');
      return;
    }

    this.refundActionError.set('');
    const refundAmount = this.overpaymentAmount();
    const refundDialog = this.dialog.open(RefundApprovalDialogComponent, {
      width: '520px',
      maxWidth: '95vw',
      disableClose: false,
      ariaLabelledBy: 'refund-approval-title',
      data: {
        saleId: this.data.saleId,
        requiredAmount: this.data.requiredAmount,
        selectedTotal: this.totalSelectedAmount(),
        refundAmount,
        expectedAmountLabel: this.data.expectedAmountLabel ?? 'Sale total',
        approverDisplayName: displayName,
      },
    });

    refundDialog.afterClosed().subscribe((refund) => {
      if (!refund?.approvalToken || this.selectedMessages().length === 0) return;
      this.dialogRef.close({ messages: this.selectedMessages(), refund });
    });
  }

  cancel() {
    this.dialogRef.close();
  }

  formatCurrency(v: number): string {
    return `Ksh.${v.toFixed(2)}`;
  }
}
