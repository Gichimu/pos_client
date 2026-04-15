import { Component } from '@angular/core';
import { SalesReportCardComponent } from '../dashboard/sales-report-card/sales-report-card.component';

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [SalesReportCardComponent],
  template: `<app-sales-report-card />`,
})
export class ReportsComponent {}
