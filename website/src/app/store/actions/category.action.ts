import { createAction, props } from '@ngrx/store';

export const searchCategory = createAction('[Main] SearchCategory');
export const searchCategorySuccess = createAction('[Main] SearchCategory Success', props<{ results: any }>());
export const searchCategoryFailed = createAction('[Main] SearchCategory Failed', props<{ error: any }>());
