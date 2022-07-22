import { createAction, props } from '@ngrx/store';
import { CategoriesList } from 'src/app/core/interfaces/api.interface';

export const searchCategory = createAction('[Main] SearchCategory');
export const searchCategorySuccess = createAction(
  '[Main] SearchCategory Success',
  props<{ results: CategoriesList }>(),
);
export const searchCategoryFailed = createAction('[Main] SearchCategory Failed', props<{ error: any }>());
