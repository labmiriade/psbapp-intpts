import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';

import { MainRoutingModule } from './main-routing.module';
import { SharedModule } from '../shared/shared.module';
import { IndexComponent } from './routes/index/index.component';
import { SearchComponent } from './routes/search/search.component';
import { DetailsComponent } from './routes/details/details.component';
import { SearchBarComponent } from './components/search-bar/search-bar.component';
import { SearchCardComponent } from './components/search-card/search-card.component';
import { LoadingComponent } from './components/loading/loading.component';
import { NgbTooltipModule } from '@ng-bootstrap/ng-bootstrap';
import { InfoComponent } from './routes/info/info.component';
import { MainComponent } from './main.component';

@NgModule({
  declarations: [
    IndexComponent,
    SearchComponent,
    DetailsComponent,
    SearchBarComponent,
    SearchCardComponent,
    LoadingComponent,
    InfoComponent,
    MainComponent,
  ],
  imports: [
    CommonModule,
    MainRoutingModule,
    SharedModule,
    FormsModule,
    ReactiveFormsModule,
    FontAwesomeModule,
    NgbTooltipModule,
  ],
})
export class MainModule {}
