import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { ActivityLog, LogCategory } from '../../../core/models/log.model';
import { logStore } from '../../../store/logs/log.store';
import { userStore } from '../../../store/users/user.store';

const COLLAPSE_THRESHOLD = 5;

const AVATAR_GRADIENTS = [
  'linear-gradient(135deg, #2563eb, #7c3aed)',
  'linear-gradient(135deg, #059669, #0284c7)',
  'linear-gradient(135deg, #d97706, #dc2626)',
  'linear-gradient(135deg, #7c3aed, #db2777)',
  'linear-gradient(135deg, #0284c7, #059669)',
];

@Component({
  selector: 'app-logs',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    MatProgressSpinnerModule,
    MatPaginatorModule,
  ],
  templateUrl: './logs.component.html',
  styleUrl: './logs.component.scss',
})
export class LogsComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly store = inject(logStore);
  private readonly usersStore = inject(userStore);

  readonly logCategory = signal<LogCategory>('activity');
  readonly dateFrom = signal<string>(this.defaultFrom());
  readonly dateTo = signal<string>(this.defaultTo());

  /** Keys of expanded change blocks, e.g. "<logId>-old" / "<logId>-new". */
  readonly expandedRows = signal<Set<string>>(new Set<string>());

  readonly logs = this.store.logs;
  readonly loading = this.store.loading;
  readonly error = this.store.error;

  readonly isInventory = computed(() => this.logCategory() === 'mutation');

  readonly displayedColumns = computed<string[]>(() => {
    const base = ['logType', 'user', 'action', 'description', 'timestamp'];
    return this.isInventory() ? [...base, 'changes'] : base;
  });

  // ── Pagination ───────────────────────────────────────────────────────
  readonly pageIndex = signal(0);
  readonly pageSize = signal(20);

  readonly pagedLogs = computed(() => {
    const start = this.pageIndex() * this.pageSize();
    return this.logs().slice(start, start + this.pageSize());
  });

  onPageChange(e: PageEvent): void {
    this.pageIndex.set(e.pageIndex);
    this.pageSize.set(e.pageSize);
  }

  // ── Lifecycle ────────────────────────────────────────────────────────
  ngOnInit(): void {
    const cat = this.route.snapshot.data['logCategory'] as LogCategory | undefined;
    this.logCategory.set(cat ?? 'activity');
    this.store.clearLogs();
    this.pageIndex.set(0);
    this.usersStore.loadUsers().subscribe({ error: () => {} });
  }

  // ── Actions ──────────────────────────────────────────────────────────
  fetchLogs(): void {
    this.pageIndex.set(0);
    this.pageSize.set(20);
    this.store.fetchLogs(this.logCategory(), this.dateFrom(), this.dateTo()).subscribe({
      error: () => {},
    });
  }

  onDateFromChange(e: Event): void {
    this.dateFrom.set((e.target as HTMLInputElement).value);
  }

  onDateToChange(e: Event): void {
    this.dateTo.set((e.target as HTMLInputElement).value);
  }

  // ── Change block expand/collapse ─────────────────────────────────────
  toggleExpanded(key: string): void {
    this.expandedRows.update((s) => {
      const next = new Set(s);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  }

  isExpanded(key: string): boolean {
    return this.expandedRows().has(key);
  }

  // ── User helpers ─────────────────────────────────────────────────────
  resolveUser(userId: string): string {
    if (!userId) return '—';
    const u = this.usersStore.users().find((u) => u._id === userId);
    return u ? `${u.firstName} ${u.lastName}` : `…${userId.slice(-6)}`;
  }

  getUserInitials(userId: string): string {
    const u = this.usersStore.users().find((u) => u._id === userId);
    if (u) return `${u.firstName?.[0] ?? ''}${u.lastName?.[0] ?? ''}`.toUpperCase();
    return 'U';
  }

  getUserAvatarStyle(userId: string): string {
    const idx = (userId?.charCodeAt(userId.length - 1) ?? 0) % AVATAR_GRADIENTS.length;
    return AVATAR_GRADIENTS[idx];
  }

  // ── Changes helpers ──────────────────────────────────────────────────
  flattenValue(
    obj: Record<string, unknown> | null | undefined,
    prefix = '',
  ): { key: string; val: string }[] {
    if (!obj || typeof obj !== 'object') return [];
    const result: { key: string; val: string }[] = [];
    for (const [k, v] of Object.entries(obj)) {
      if (k === '_id' || k === '__v') continue;
      const fullKey = prefix ? `${prefix}.${k}` : k;
      if (v === null || v === undefined) continue;
      // MongoDB ObjectId — skip
      if (typeof v === 'object' && v !== null && '$oid' in v) continue;
      // MongoDB Date
      if (typeof v === 'object' && v !== null && '$date' in v) {
        result.push({
          key: fullKey,
          val: new Date(String((v as Record<string, unknown>)['$date'])).toLocaleString(),
        });
      } else if (Array.isArray(v)) {
        v.slice(0, 5).forEach((item, i) => {
          if (typeof item === 'object' && item !== null) {
            result.push(...this.flattenValue(item as Record<string, unknown>, `${fullKey}[${i}]`));
          } else {
            result.push({ key: `${fullKey}[${i}]`, val: String(item) });
          }
        });
        if (v.length > 5) result.push({ key: fullKey, val: `… +${v.length - 5} more items` });
      } else if (typeof v === 'object' && v !== null) {
        result.push(...this.flattenValue(v as Record<string, unknown>, fullKey));
      } else {
        result.push({ key: fullKey, val: String(v) });
      }
    }
    return result;
  }

  visibleEntries(
    entries: { key: string; val: string }[],
    expandKey: string,
  ): { key: string; val: string }[] {
    return this.isExpanded(expandKey) ? entries : entries.slice(0, COLLAPSE_THRESHOLD);
  }

  hasMoreEntries(entries: { key: string; val: string }[]): boolean {
    return entries.length > COLLAPSE_THRESHOLD;
  }

  formatTimestamp(ts: string | null | undefined): string {
    if (!ts) return '—';
    return new Date(ts).toLocaleString([], {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  // ── Private helpers ──────────────────────────────────────────────────
  private defaultFrom(): string {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().split('T')[0];
  }

  private defaultTo(): string {
    return new Date().toISOString().split('T')[0];
  }
}
