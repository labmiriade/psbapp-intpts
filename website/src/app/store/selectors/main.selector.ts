import { createSelector } from '@ngrx/store';
import { AppState } from '../reducers';

const mainFeature = (state: AppState) => state.main;

export const searchLoading = () => createSelector(mainFeature, (state) => state.loading);

export const searchKeywords = () => createSelector(mainFeature, (state) => state.keywords);

export const searchResults = () => createSelector(mainFeature, (state) => state.results || []);

export const searchError = () => createSelector(mainFeature, (state) => state.error);

export const searchPlace = (placeSelect: string) =>
  createSelector(mainFeature, (state) => state.results?.find((place) => place.placeId === placeSelect));

export const searchPlaceById = () => createSelector(mainFeature, (state) => state.result);
