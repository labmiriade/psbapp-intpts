import { Input, Component, Output, EventEmitter } from '@angular/core';
import { PlaceInfo } from 'src/app/core/interfaces/api.interface';

@Component({
  selector: 'app-search-card',
  templateUrl: './search-card.component.html',
  styleUrls: ['./search-card.component.scss'],
})
export class SearchCardComponent {
  @Input() place?: PlaceInfo;
  @Output() placeClick = new EventEmitter<PlaceInfo>();

  get name(): string {
    return this.place?.name ? this.place.name : '';
  }

  get street(): string {
    if (this.place?.streetName) {
      let streetNumber: string = this.place.streetNumber ? ', ' + this.place.streetNumber : '';
      return this.place.streetName + streetNumber;
    } else {
      return '';
    }
  }

  get city(): string {
    if (this.place?.city) {
      let province: string = this.place.province ? ', ' + this.place.province : '';
      return this.place.city + province;
    } else {
      return '';
    }
  }

  onSelectClick(): void {
    this.placeClick.emit(this.place);
  }
}
