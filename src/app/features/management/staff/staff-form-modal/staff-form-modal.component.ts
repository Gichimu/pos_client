import { Component, inject, computed, OnInit } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators, FormGroup } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { User, UserRole } from '../../../../core/models/user.model';
import { roleGuard } from '../../../../core/guards/role.guard';
import { authStore } from '../../../../store/auth/auth.store';
import { userStore } from '../../../../store/users/user.store';

export interface StaffFormData {
  user?: User;
}

@Component({
  selector: 'app-staff-form-modal',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
  ],
  templateUrl: './staff-form-modal.component.html',
  styleUrl: './staff-form-modal.component.scss',
})
export class StaffFormModalComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly dialogRef = inject(MatDialogRef<StaffFormModalComponent>);
  readonly data = inject<StaffFormData>(MAT_DIALOG_DATA);

  readonly isEdit = computed(() => !!this.data?.user);

  readonly userAllowed = computed(() => this.data?.user?.roles.includes('superAdmin'));

  form: FormGroup = this.fb.group({
    firstName: [this.data?.user?.firstName ?? '', [Validators.required, Validators.minLength(2)]],
    lastName: [this.data?.user?.lastName ?? '', [Validators.required, Validators.minLength(2)]],
    email: [this.data?.user?.email ?? '', [Validators.required, Validators.email]],
    password: ['', this.data?.user ? [] : [Validators.required, Validators.minLength(8)]],
    roles: [this.data?.user?.roles ?? [], Validators.required],
    status: [
      {
        value: this.data?.user?.status ? this.data?.user?.status : 'pending',
        disabled: this.data?.user?.status ? false : true,
      },
      Validators.required,
    ],
  }) as FormGroup;

  ngOnInit() {
    console.log('check dialog data', this.data);
  }

  close() {
    this.dialogRef.close();
  }

  save() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const { firstName, lastName, email, password, roles, status }: any = this.form.getRawValue();
    const user: User = {
      _id: this.data?.user?._id,
      firstName: firstName!,
      lastName: lastName!,
      email: email!,
      password: password!,
      roles: roles as UserRole[],
      status: status as User['status'],

      avatar:
        this.data?.user?.avatar ??
        `https://i.pravatar.cc/40?u=${encodeURIComponent(firstName ?? 'user')}`,
      store: this.data?.user?.store ?? 'Delect',
    };

    this.dialogRef.close(user);
  }
}
