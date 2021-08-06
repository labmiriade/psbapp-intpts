import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { PlaceInfo, PlaceList } from '../interfaces/api.interface';

@Injectable({
  providedIn: 'root',
})
export class MainService {
  constructor(private http: HttpClient) {}

  search(q: string, near?: string, cat?: string): Observable<PlaceList> {
    const params = new URLSearchParams();
    params.append('q', q);
    if (near) {
      params.append('near', near);
    }
    if (cat) {
      params.append('cat', cat);
    }
    return this.http.get<PlaceList>(`/search/p?${params.toString()}`);
  }

  getPlace(placeId: string): Observable<PlaceInfo> {
    return this.http.get<PlaceInfo>(`/p/${placeId}`);
  }

  getCategories(): Observable<String[]> {
    return this.http.get<String[]>('/categories');
  }
}
