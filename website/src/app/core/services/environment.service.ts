import { Injectable } from '@angular/core';
import { Environment } from 'src/app/core/interfaces/environment.interface';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root',
})
export class EnvironmentService {
  private value: any;

  constructor() {
    this.value = {};
  }

  init(): Promise<Environment> {
    return fetch('/assets/config-env.json')
      .then((response) => response.json())
      .catch(() => {
        console.log('no dynamic json found');
        return {};
      });
  }

  set environment(env: Environment) {
    this.value = env;
  }

  get environment(): Environment {
    return { ...environment, ...this.value };
  }
}
