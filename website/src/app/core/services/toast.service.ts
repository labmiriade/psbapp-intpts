import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class ToastService {
  toasts: ToastInterface[] = [];

  show(header: string, body: string, type?: ToastType): void {
    this.toasts.push({ header, body, type: type ?? ToastType.Secondary });
  }

  remove(toast: ToastInterface): void {
    this.toasts = this.toasts.filter((t) => t !== toast);
  }
}

export interface ToastInterface {
  header: string;
  body: string;
  type: ToastType;
}

export enum ToastType {
  Primary = 'primary',
  Secondary = 'secondary',
  Success = 'success',
  Danger = 'danger',
  Warning = 'warning',
  Info = 'info',
  Light = 'light',
  Dark = 'dark',
}
