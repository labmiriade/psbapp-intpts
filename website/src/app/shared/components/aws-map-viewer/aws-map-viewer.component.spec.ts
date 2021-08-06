import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AwsMapViewerComponent } from './aws-map-viewer.component';

describe('MapViewerComponent', () => {
  let component: AwsMapViewerComponent;
  let fixture: ComponentFixture<AwsMapViewerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [AwsMapViewerComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(AwsMapViewerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
