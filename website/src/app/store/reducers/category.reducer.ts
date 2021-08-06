import { createReducer, on } from '@ngrx/store';
import { searchCategory, searchCategoryFailed, searchCategorySuccess } from '../actions/category.action';

export interface State {
  loading: boolean;
  error: any;
  results: any | null;
}

const initialState: State = {
  loading: false,
  error: null,
  results: null,
};

export const reducer = createReducer(
  initialState,
  on(searchCategory, (state) => ({
    ...state,
    loading: true,
  })),
  on(searchCategorySuccess, (state, props) => ({
    ...state,
    loading: false,
    results: props.results.categories,
  })),
  on(searchCategoryFailed, (state, props) => ({
    ...state,
    loading: false,
    error: props.error,
    results: null,
  })),
);
