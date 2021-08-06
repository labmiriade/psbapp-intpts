import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AwsMapViewerComponent } from './components/aws-map-viewer/aws-map-viewer.component';

@NgModule({
  imports: [CommonModule],
  declarations: [AwsMapViewerComponent],
  exports: [AwsMapViewerComponent],
})
export class SharedModule {}
