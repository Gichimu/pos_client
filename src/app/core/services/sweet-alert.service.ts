import { Injectable } from '@angular/core';
import Swal from 'sweetalert2';

const Toast = Swal.mixin({
  toast: true,
  position: 'top-end',
  showConfirmButton: false,
  showCloseButton: true,
  timer: 3000,
  timerProgressBar: true,
  didOpen: (toast) => {
    toast.addEventListener('mouseenter', Swal.stopTimer);
    toast.addEventListener('mouseleave', Swal.resumeTimer);
  },
});

@Injectable({ providedIn: 'root' })
export class SweetAlertService {
  success(message: string, duration = 3000): void {
    Toast.fire({ icon: 'success', title: message, timer: duration });
  }

  error(message: string, duration = 4000): void {
    Toast.fire({ icon: 'error', title: message, timer: duration });
  }

  info(message: string, duration = 2500): void {
    Toast.fire({ icon: 'info', title: message, timer: duration });
  }

  warning(message: string, duration = 3500): void {
    Toast.fire({ icon: 'warning', title: message, timer: duration });
  }
}
