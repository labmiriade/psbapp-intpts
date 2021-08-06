import { HttpEvent, HttpHandler, HttpInterceptor, HttpRequest } from '@angular/common/http';
import { Injectable } from '@angular/core';

import { Observable } from 'rxjs';
import { Environment } from '../interfaces/environment.interface';
import { EnvironmentService } from '../services/environment.service';

@Injectable({
  providedIn: 'root',
})
export class BaseUrlInterceptorService implements HttpInterceptor {
  constructor(private envService: EnvironmentService) {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    if (req.url.startsWith('http://') || req.url.startsWith('https://')) {
      return next.handle(req);
    }
    const newReq = req.clone({ url: `${this.environment.baseUrl}${req.url}` });
    return next.handle(newReq);
  }
  get environment(): Environment {
    return this.envService.environment;
  }
}
