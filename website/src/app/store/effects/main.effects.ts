import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { of } from 'rxjs';
import { map, mergeMap, catchError } from 'rxjs/operators';
import { PlaceInfo } from 'src/app/core/interfaces/api.interface';
import { MainService } from 'src/app/core/services/main.service';
import {
  search,
  searchSuccess,
  searchFailed,
  searchSuccessById,
  searchFailedById,
  searchById,
} from '../actions/main.actions';
import { ToastService, ToastType } from 'src/app/core/services/toast.service';
@Injectable()
export class MainEffects {
  search$ = createEffect(() =>
    this.actions$.pipe(
      ofType(search),
      mergeMap((props) =>
        this.main.search(props.q, this.positionToString(props.near), props.cat).pipe(
          map((results) => searchSuccess({ results: results.places as PlaceInfo[] })),
          catchError((e) => {
            this.toast.show(
              'Errore in ricerca',
              'Non siamo riusciti a portare a termine la ricerca. Si prega di riprovare.',
              ToastType.Danger,
            );
            return of(searchFailed({ error: e }));
          }),
        ),
      ),
    ),
  );

  searchById$ = createEffect(() =>
    this.actions$.pipe(
      ofType(searchById),
      mergeMap((props) =>
        this.main.getPlace(props.placeId).pipe(
          map((result) => searchSuccessById({ result: result })),
          catchError((e) => {
            return of(searchFailedById({ error: e, placeId: props.placeId }));
          }),
        ),
      ),
    ),
  );

  constructor(private actions$: Actions, private main: MainService, private toast: ToastService) {}

  positionToString(pos?: GeolocationPosition): string | undefined {
    if (!pos) {
      return undefined;
    }

    return `${pos.coords.latitude},${pos.coords.longitude}`;
  }
}
