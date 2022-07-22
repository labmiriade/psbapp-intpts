import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { of } from 'rxjs';
import { catchError, map, mergeMap } from 'rxjs/operators';
import { MainService } from 'src/app/core/services/main.service';
import { ToastService, ToastType } from 'src/app/core/services/toast.service';
import { searchCategory, searchCategoryFailed, searchCategorySuccess } from '../actions/category.action';
@Injectable()
export class CategoryEffects {
  search$ = createEffect(() =>
    this.actions$.pipe(
      ofType(searchCategory),
      mergeMap(() =>
        this.main.getCategories().pipe(
          map((results) => searchCategorySuccess({ results })),
          catchError((e) => {
            this.toast.show(
              'Errore in ricerca',
              'Non siamo riusciti a portare a termine la ricerca. Si prega di riprovare.',
              ToastType.Danger,
            );
            return of(searchCategoryFailed({ error: e }));
          }),
        ),
      ),
    ),
  );

  constructor(private actions$: Actions, private main: MainService, private toast: ToastService) {}
}
