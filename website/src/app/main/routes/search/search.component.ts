import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Observable, Subscription } from 'rxjs';
import { Store } from '@ngrx/store';
import { search } from 'src/app/store/actions/main.actions';
import { AppState } from 'src/app/store/reducers';
import { PlaceInfo } from 'src/app/core/interfaces/api.interface';
import { searchResults, searchLoading } from 'src/app/store/selectors/main.selector';
import * as maplibregl from 'maplibre-gl';
import { Pin } from 'src/app/shared/components/aws-map-viewer/aws-map-viewer.component';
import { map } from 'rxjs/operators';
import { GeolocationService } from 'src/app/core/services/geolocation.service';
@Component({
  selector: 'app-search',
  templateUrl: './search.component.html',
  styleUrls: ['./search.component.scss'],
})
export class SearchComponent implements OnInit, OnDestroy {
  private sub: Subscription;
  q: string;
  geo: number;
  loading$: Observable<boolean>;
  places$: Observable<PlaceInfo[]>;
  mapPins: Observable<Pin[]>;

  constructor(
    private router: Router,
    private activatedRoute: ActivatedRoute,
    private store: Store<AppState>,
    private geolocation: GeolocationService,
  ) {
    this.sub = new Subscription();
    this.q = '';
    this.geo = 0;
    this.loading$ = this.store.select(searchLoading());
    this.places$ = this.store.select(searchResults());
    this.mapPins = this.getMapPins();
  }

  ngOnInit(): void {
    this.sub.add(
      this.activatedRoute.queryParams.subscribe((params) => {
        this.q = params.q;
        const cat = params.cat;
        const geo = params.geo === '1';
        if (geo) {
          this.geolocation.getCurrentPosition().then((result) => {
            if (cat) {
              this.store.dispatch(search({ q: this.q, near: result, cat: cat }));
            } else {
              this.store.dispatch(search({ q: this.q, near: result }));
            }
          });
        } else {
          if (cat) {
            this.store.dispatch(search({ q: this.q, cat: cat }));
          } else {
            this.store.dispatch(search({ q: this.q }));
          }
        }
      }),
    );
  }

  ngOnDestroy(): void {
    this.sub.unsubscribe();
  }

  onSelectClick(place: PlaceInfo): void {
    const placeLink = ['/details/'];
    if (place) {
      placeLink.push(place.placeId || '');
    }
    this.router.navigate(placeLink);
  }

  getMapPins(): Observable<Pin[]> {
    return this.places$.pipe(
      map((places) => {
        let pins: Pin[] = [];
        for (const placeDati of places) {
          if (
            placeDati.lat !== undefined &&
            placeDati.lon !== undefined &&
            placeDati.lat !== '' &&
            placeDati.lon !== ''
          ) {
            const pin: maplibregl.LngLatLike = [parseFloat(placeDati.lon), parseFloat(placeDati.lat)];
            let mapPin: Pin = {
              pos: pin,
              text: placeDati.name ? placeDati.name : '',
              href: placeDati.placeId ? placeDati.placeId : '',
            };
            pins.push(mapPin);
          }
        }
        return pins;
      }),
    );
  }

  onSearchClick(event: { q: string; geo: boolean }): void {
    this.router.navigate(['/search'], {
      queryParams: {
        q: event.q,
        geo: event.geo ? '1' : '0',
      },
    });
  }
}
