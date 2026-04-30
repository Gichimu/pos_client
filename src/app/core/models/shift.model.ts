export type ShiftStatus = 'Open' | 'Closed';

export interface RequisitionItem {
  productId: string;
  productName: string;
  quantity: number;
  addedBy?: string;
  addedAt: Date | string;
}

export interface Shift {
  _id?: string;
  startTime: Date | string;
  endTime?: Date | string | null;
  status: ShiftStatus;
  totalSales?: number;
  activeCashiers?: number;
  openedBy: string;
  closedBy: string;
  openingNotes?: string;
  closingNotes?: string;
  createdAt?: Date | string;
}

export interface OpenShiftDto {
  openingNotes?: string;
  openedBy: string;
}

export interface CloseShiftDto {
  closingNotes?: string;
  closedBy: string;
  requisitions?: RequisitionItem[];
}
