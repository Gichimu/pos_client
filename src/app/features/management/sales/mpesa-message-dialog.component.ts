import { Component, Inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MpesaMessage } from '../../../core/models/mpesa-message.model';
import { MOCK_MPESA_MESSAGES } from '../../../store/mock-data';

export interface MpesaMessageDialogData {
  requiredAmount: number;
}

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
        <mat-form-field appearance="outline" class="mpesa-dialog__search">
          <mat-label>Search messages</mat-label>
          <mat-icon matPrefix>search</mat-icon>
          <input matInput [(ngModel)]="searchQuery" placeholder="Search by name, phone or ID" />
        </mat-form-field>

        <mat-selection-list
          [multiple]="false"
          (selectionChange)="onSelectionChange($event)"
          class="mpesa-dialog__list"
        >
          @for (msg of filteredMessages(); track msg._id) {
            <mat-list-option
              [value]="msg"
              [class.mpesa-dialog__option--mismatch]="msg.amount !== data.requiredAmount"
            >
              <div class="mpesa-message">
                <div class="mpesa-message__main">
                  <span class="mpesa-message__id">{{ msg.transactionId }}</span>
                  <span class="mpesa-message__sender">{{ msg.sender }}</span>
                </div>
                <div class="mpesa-message__meta">
                  <span
                    class="mpesa-message__amount"
                    [class.mpesa-message__amount--match]="msg.amount === data.requiredAmount"
                  >
                    {{ formatCurrency(msg.amount) }}
                  </span>
                  <span class="mpesa-message__time">{{ formatTime(msg.receivedAt) }}</span>
                </div>
              </div>
            </mat-list-option>
          } @empty {
            <div class="mpesa-dialog__empty">
              <mat-icon>search_off</mat-icon>
              <p>No M-Pesa messages found</p>
            </div>
          }
        </mat-selection-list>

        @if (selectedMessage() && selectedMessage()!.amount !== data.requiredAmount) {
          <div class="mpesa-dialog__error">
            <mat-icon>error_outline</mat-icon>
            <span>Message amount does not match expected amount.</span>
          </div>
        }
      </mat-dialog-content>

      <mat-dialog-actions align="end" class="mpesa-dialog__actions">
        <button mat-button (click)="cancel()">Cancel</button>
        <button
          mat-flat-button
          color="primary"
          [disabled]="!isValidSelection()"
          (click)="confirm()"
        >
          Confirm Selection
        </button>
      </mat-dialog-actions>
    </div>
  `,
  styles: [
    `
      .mpesa-dialog {
        min-width: 500px;
        max-width: 600px;
      }
      .mpesa-dialog__header {
        display: flex;
        align-items: center;
        gap: 16px;
        padding: 20px 24px;
        border-bottom: 1px solid var(--color-border);
      }
      .mpesa-dialog__header-icon {
        width: 48px;
        height: 48px;
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
      }
      .mpesa-dialog__search {
        width: 100%;
        margin-bottom: 16px;
      }
      .mpesa-dialog__list {
        max-height: 400px;
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
      }
      .mpesa-message__id {
        font-weight: 700;
        font-size: 0.9rem;
        font-family: monospace;
      }
      .mpesa-message__sender {
        font-size: 0.75rem;
        color: var(--color-text-muted);
      }
      .mpesa-message__meta {
        display: flex;
        flex-direction: column;
        align-items: flex-end;
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
        margin-top: 16px;
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
      }
      .mpesa-dialog__option--mismatch {
        opacity: 0.7;
      }
    `,
  ],
})
export class MpesaMessageDialogComponent {
  searchQuery = '';
  selectedMessage = signal<MpesaMessage | null>(null);

  messages = signal<MpesaMessage[]>(MOCK_MPESA_MESSAGES);

  filteredMessages = computed(() => {
    const q = this.searchQuery.toLowerCase();
    return this.messages().filter(
      (m) =>
        !m.isUsed &&
        (m.transactionId.toLowerCase().includes(q) ||
          m.sender.toLowerCase().includes(q) ||
          m.phone.includes(q)),
    );
  });

  isValidSelection = computed(() => {
    const selected = this.selectedMessage();
    return selected !== null && selected.amount === this.data.requiredAmount;
  });

  constructor(
    private readonly dialogRef: MatDialogRef<MpesaMessageDialogComponent, MpesaMessage>,
    @Inject(MAT_DIALOG_DATA) public readonly data: MpesaMessageDialogData,
  ) {}

  onSelectionChange(event: any) {
    this.selectedMessage.set(event.options[0].value);
  }

  confirm() {
    if (this.isValidSelection()) {
      this.dialogRef.close(this.selectedMessage()!);
    }
  }

  cancel() {
    this.dialogRef.close();
  }

  formatCurrency(v: number): string {
    return `Ksh.${v.toFixed(2)}`;
  }

  formatTime(date: Date): string {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
}
