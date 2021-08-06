import * as main from './main.reducer';
import * as category from './category.reducer';

export interface AppState {
  main: main.State;
  category: category.State;
}

export const reducers = {
  main: main.reducer,
  category: category.reducer,
};

export const metaReducers = [];
