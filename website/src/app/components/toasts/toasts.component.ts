import { Component } from '@angular/core';
import { ToastInterface, ToastService, ToastType } from 'src/app/core/services/toast.service';

@Component({
  selector: 'app-toasts',
  templateUrl: './toasts.component.html',
  styleUrls: ['./toasts.component.scss'],
})
export class ToastsComponent {
  constructor(private toastService: ToastService) {}

  get toasts(): ToastInterface[] {
    return this.toastService.toasts;
  }

  remove(toast: ToastInterface): void {
    this.toastService.remove(toast);
  }

  getColorClass(type: ToastType): string {
    let textColor = 'dark';
    switch (type) {
      case ToastType.Primary:
      case ToastType.Secondary:
      case ToastType.Success:
      case ToastType.Danger:
      case ToastType.Dark:
        textColor = 'white';
        break;
      case ToastType.Warning:
      case ToastType.Info:
      case ToastType.Light:
        textColor = 'dark';
        break;
    }
    return `bg-${type} text-${textColor}`;
  }
}
