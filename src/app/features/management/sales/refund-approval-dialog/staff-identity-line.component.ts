import { Component, Input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-staff-identity-line',
  standalone: true,
  imports: [MatIconModule],
  template: `
    <div class="staff-identity" aria-label="Refund approver">
      <span class="staff-identity__marker" aria-hidden="true">
        <mat-icon>account_circle</mat-icon>
      </span>
      <div class="staff-identity__copy">
        <h2 id="refund-approval-title">Approve refund</h2>
        <p>Approving as <strong>{{ displayName }}</strong></p>
      </div>
    </div>
  `,
  styles: [
    `
      .staff-identity {
        display: flex;
        align-items: center;
        gap: 14px;
      }
      .staff-identity__marker {
        display: grid;
        place-items: center;
        flex: 0 0 44px;
        width: 44px;
        height: 44px;
        border-radius: 12px;
        background: #dbeafe;
        color: var(--color-primary);
      }
      .staff-identity__marker mat-icon {
        width: 24px;
        height: 24px;
        font-size: 24px;
      }
      .staff-identity__copy h2 {
        margin: 0 0 3px;
        color: var(--color-text);
        font-size: 1.1rem;
        font-weight: 700;
        line-height: 1.25;
      }
      .staff-identity__copy p {
        margin: 0;
        color: var(--color-text-muted);
        font-size: 0.85rem;
      }
      .staff-identity__copy strong {
        color: var(--color-text);
        font-weight: 600;
      }
    `,
  ],
})
export class StaffIdentityLineComponent {
  @Input({ required: true }) displayName = '';
}
