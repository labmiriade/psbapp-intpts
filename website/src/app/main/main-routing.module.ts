import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { MainComponent } from './main.component';
import { DetailsComponent } from './routes/details/details.component';
import { IndexComponent } from './routes/index/index.component';
import { InfoComponent } from './routes/info/info.component';
import { SearchComponent } from './routes/search/search.component';

const routes: Routes = [
  {
    path: '',
    component: MainComponent,
    children: [
      {
        path: '',
        component: IndexComponent,
      },
      {
        path: 'search',
        component: SearchComponent,
      },
      {
        path: 'details/:placeId',
        component: DetailsComponent,
      },
      {
        path: 'info',
        component: InfoComponent,
      },
    ],
  },
  {
    path: '**',
    redirectTo: '/',
    pathMatch: 'full',
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class MainRoutingModule {}
