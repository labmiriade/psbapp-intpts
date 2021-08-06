import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { GeolocationService } from 'src/app/core/services/geolocation.service';
import { ToastService, ToastType } from 'src/app/core/services/toast.service';

@Component({
  selector: 'app-index',
  templateUrl: './index.component.html',
  styleUrls: ['./index.component.scss'],
})
export class IndexComponent {
  constructor(private router: Router, private toast: ToastService, private geolocation: GeolocationService) {}

  onSearchClick(event: { q: string; geo: boolean }) {
    if (event.geo) {
      // 1. ask permission
      this.geolocation.getCurrentPosition().then(
        (result) => {
          // 1a. if OK => go to search
          console.log(`Success! ${JSON.stringify(result)}`);
          this.goToSearch(event.q, true);
        },
        (error) => {
          // 1c. if KO && q is NOT empty => go to search with geo = 0
          console.log(`Error! ${JSON.stringify(error)}`);
          if (event.q.length !== 0) {
            this.toast.show(
              'NO LOCATION, NO PARTY',
              'Non abbiamo il permesso di utilizzare la tua posizione. Abbiamo fatto una ricerca senza posizione.',
              ToastType.Warning,
            );
            this.goToSearch(event.q, false);
          } else {
            this.toast.show(
              'NO LOCATION, NO PARTY',
              'Non possiamo cercare per posizione senza poter accedere alla tua posizione.',
              ToastType.Danger,
            );
          }
          // 1b. if KO && q is empty => do nothing (err msg?)
        },
      );
    } else {
      // go to search
      this.goToSearch(event.q, false);
    }
  }

  private goToSearch(q: string, geo: boolean): void {
    this.router.navigate(['/search'], {
      queryParams: {
        q,
        geo: geo ? '1' : '0',
      },
    });
  }
}
