import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class GeolocationService {
  private TIMEOUT_MS = 30 * 1000;

  getCurrentPosition(options?: PositionOptions): Promise<GeolocationPosition> {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject('geolocation is null');
        return;
      }
      navigator.geolocation.getCurrentPosition(
        (result) => resolve(result),
        (error) => reject(error),
        options ?? { timeout: this.TIMEOUT_MS },
      );
    });
  }
}
