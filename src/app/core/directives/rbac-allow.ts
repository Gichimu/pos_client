import { Directive, ElementRef, inject, Input, TemplateRef, ViewContainerRef } from '@angular/core';
import { authStore } from '../../store/auth/auth.store';
import { UserRole } from '../models/user.model';

@Directive({
  selector: '[rbacAllow]',
})
export class RbacAllow {
  private readonly userStore = inject(authStore);
  private roles: UserRole[] = [];

  @Input()
  set rbacAllow(value: UserRole[]) {
    this.roles = value;
    this.updateView();
  }

  private templateRef = inject(TemplateRef<any>);
  private viewContainer = inject(ViewContainerRef);

  private updateView() {
    const userRoles = this.userStore.user()?.roles || [];
    const hasAccess = this.roles.some((role: UserRole) => userRoles.includes(role));
    if (!hasAccess) {
      this.viewContainer.clear();
    } else {
      this.viewContainer.createEmbeddedView(this.templateRef);
    }
  }
}
