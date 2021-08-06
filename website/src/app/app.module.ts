import { LOCALE_ID, NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { NgbModule, NgbToastModule } from '@ng-bootstrap/ng-bootstrap';
import { StoreModule } from '@ngrx/store';
import { StoreDevtoolsModule } from '@ngrx/store-devtools';
import { environment } from '../environments/environment';
import { EffectsModule } from '@ngrx/effects';
import { effects } from './store/effects';
import { reducers } from './store/reducers';
import { HttpClientModule } from '@angular/common/http';
import { FaIconLibrary, FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import {
  faAngleRight,
  faCheckCircle,
  faAngleLeft,
  faTimes,
  faPhoneAlt,
  faGlobe,
  faEnvelope,
} from '@fortawesome/free-solid-svg-icons';
import localeIt from '@angular/common/locales/it';
import { registerLocaleData } from '@angular/common';
import { ToastsComponent } from './components/toasts/toasts.component';
import { CoreModule } from './core/core.module';
import { TopToolbarComponent } from './components/top-toolbar/top-toolbar.component';
import { FooterComponent } from './components/footer/footer.component';
import { SubToolbarComponent } from './components/sub-toolbar/sub-toolbar.component';

registerLocaleData(localeIt, 'it-IT');
@NgModule({
  declarations: [AppComponent, ToastsComponent, TopToolbarComponent, FooterComponent, SubToolbarComponent],
  imports: [
    BrowserModule,
    AppRoutingModule,
    NgbModule,
    StoreModule.forRoot(reducers, {}),
    StoreDevtoolsModule.instrument({
      maxAge: 25,
      logOnly: environment.production,
    }),
    EffectsModule.forRoot(effects),
    HttpClientModule,
    FontAwesomeModule,
    NgbToastModule,
    CoreModule,
  ],
  providers: [{ provide: LOCALE_ID, useValue: 'it-IT' }],
  bootstrap: [AppComponent],
})
export class AppModule {
  constructor(library: FaIconLibrary) {
    library.addIcons(faAngleRight, faCheckCircle, faAngleLeft, faTimes, faPhoneAlt, faGlobe, faEnvelope);
  }
}
