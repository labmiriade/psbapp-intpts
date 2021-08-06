import { createSelector } from '@ngrx/store';
import { AppState } from '../reducers';

const mainFeature = (state: AppState) => state.category;

export const searchLoading = () => createSelector(mainFeature, (state) => state.loading);

export const searchResults = () => createSelector(mainFeature, (state) => state.results || []);

export const searchError = () => createSelector(mainFeature, (state) => state.error);
