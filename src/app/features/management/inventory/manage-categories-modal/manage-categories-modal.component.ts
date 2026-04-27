import { Component, inject, OnInit, Signal, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { CategoryStore } from '../../../../store/categories/category.store';
import { SweetAlertService } from '../../../../core/services/sweet-alert.service';
import { Category } from '../../../../core/models/category.model';

@Component({
  selector: 'app-manage-categories-modal',
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
  ],
  templateUrl: './manage-categories-modal.component.html',
  styleUrl: './manage-categories-modal.component.scss',
})
export class ManageCategoriesModalComponent implements OnInit {
  private readonly dialogRef = inject(MatDialogRef<ManageCategoriesModalComponent>);
  private readonly sweetAlert = inject(SweetAlertService);
  readonly categoryStore = inject(CategoryStore);

  /** Name of the category being edited inline (null = not editing). */
  editingCategory = signal<Category | null>(null);
  editValue = signal('');

  /** New category input */
  newCategoryName = signal('');

  /** Error message for the add input */
  addError = signal<string | null>(null);

  get categories(): Signal<Category[]> {
    return this.categoryStore.categories;
  }

  ngOnInit(): void {
    this.categoryStore.loadCategories();
  }

  add() {
    const name = this.newCategoryName().trim();
    if (!name) {
      this.addError.set('Category name is required');
      return;
    }
    if (this.categories().some((c) => c.name.toLowerCase() === name.toLowerCase())) {
      this.addError.set(`"${name}" already exists`);
      return;
    }
    this.categoryStore.addCategory(name);
    this.sweetAlert.success(`"${name}" added`);
    this.newCategoryName.set('');
    this.addError.set(null);
  }

  startEdit(category: Category) {
    this.editingCategory.set(category);
    this.editValue.set(category.name);
  }

  confirmEdit(oldName: string) {
    const newName = this.editValue().trim();
    if (!newName || newName === oldName) {
      this.cancelEdit();
      return;
    }
    if (this.categories().some((c) => c.name.toLowerCase() === newName.toLowerCase())) {
      this.cancelEdit();
      return;
    }
    this.categoryStore.renameCategory(oldName, newName);
    this.sweetAlert.success(`Renamed to "${newName}"`);
    this.editingCategory.set(null);
  }

  cancelEdit() {
    this.editingCategory.set(null);
    this.editValue.set('');
  }

  remove(category: Category) {
    this.categoryStore.removeCategory(category);
    this.sweetAlert.success(`"${category.name}" removed`);
  }

  onAddKeydown(event: KeyboardEvent) {
    if (event.key === 'Enter') this.add();
  }

  close() {
    this.dialogRef.close();
  }
}
