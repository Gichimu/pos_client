import { Component, inject } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { GenerateReportModalComponent } from '../dashboard/generate-report-modal/generate-report-modal.component';

@Component({
  selector: 'app-reports',
  imports: [MatIconModule, MatButtonModule],
  template: `
    <div class="stub-page">
      <div class="stub-page__icon">
        <mat-icon>bar_chart</mat-icon>
      </div>
      <h2 class="stub-page__title">Reports</h2>
      <p class="stub-page__desc">View and generate sales reports for your store.</p>
      <button mat-flat-button class="gen-btn" (click)="openReport()">
        <mat-icon>assessment</mat-icon> Generate Sales Report
      </button>
    </div>
  `,
  styles: [`
    .stub-page {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 60vh;
      text-align: center;
      gap: 14px;
    }
    .stub-page__icon {
      width: 80px;
      height: 80px;
      background: #ede9fe;
      border-radius: 20px;
      display: flex;
      align-items: center;
      justify-content: center;
      mat-icon { font-size: 40px; width: 40px; height: 40px; color: #7c3aed; }
    }
    .stub-page__title { font-size: 1.5rem; font-weight: 700; color: #0f172a; margin: 0; }
    .stub-page__desc { color: #64748b; font-size: 0.9rem; max-width: 320px; margin: 0; }
    .gen-btn {
      background-color: #2563eb !important;
      color: #fff !important;
      font-family: 'Inter', sans-serif !important;
      font-weight: 600 !important;
      letter-spacing: 0 !important;
      border-radius: 10px !important;
      height: 44px !important;
      mat-icon { margin-right: 6px; font-size: 18px; width: 18px; height: 18px; }
    }
  `],
})
export class ReportsComponent {
  private readonly dialog = inject(MatDialog);

  openReport() {
    this.dialog.open(GenerateReportModalComponent, { width: '400px' });
  }
}
