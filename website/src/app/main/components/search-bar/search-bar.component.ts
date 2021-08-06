import {
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  Output,
  SimpleChanges,
  ViewChild,
} from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { Store } from '@ngrx/store';
import { Observable, Subscription } from 'rxjs';
import { map } from 'rxjs/operators';
import { searchCategory } from 'src/app/store/actions/category.action';
import { AppState } from 'src/app/store/reducers';
import { searchLoading, searchResults } from 'src/app/store/selectors/category.selector';

@Component({
  selector: 'app-search-bar',
  templateUrl: './search-bar.component.html',
  styleUrls: ['./search-bar.component.scss'],
})
export class SearchBarComponent implements OnChanges, OnInit, OnDestroy {
  @Input() q = '';
  @Output() searchClick = new EventEmitter<{ q: string; geo: boolean; cat: string }>();

  @ViewChild('srollableDiv') srollableDiv!: ElementRef<any>;
  allPlace: boolean = true;
  form: FormGroup;
  private sub: Subscription;

  categories: any[] = [];

  selectedCategory: string = '';
  loading$: Observable<boolean>;
  categories$: Observable<string[]>;
  categoriesList: Observable<any[]>;

  constructor(private fb: FormBuilder, private store: Store<AppState>, private activatedRoute: ActivatedRoute) {
    this.sub = new Subscription();
    this.form = this.fb.group({
      q: this.q ?? '',
    });

    this.loading$ = this.store.select(searchLoading());
    this.categories$ = this.store.select(searchResults());
    this.categoriesList = this.getcategories();
  }

  ngOnInit(): void {
    this.sub.add(
      this.activatedRoute.queryParams.subscribe((params) => {
        this.selectedCategory = params.cat || '';
      }),
    );

    this.sub.add(this.store.dispatch(searchCategory())).add(
      this.form.valueChanges.subscribe((dati) => {
        if (dati.q !== '') {
          this.allPlace = false;
        } else {
          this.allPlace = true;
        }
      }),
    );
  }

  ngOnDestroy(): void {
    this.sub.unsubscribe();
  }

  scrollHorizontal(event: WheelEvent) {
    event.preventDefault();
    this.srollableDiv.nativeElement.scrollLeft += event.deltaY + event.deltaX;
  }

  setCategory(event: any) {
    this.categoriesList = this.categoriesList.pipe(
      map((categories) => {
        let categoriesOut: any[] = [];
        categories.map((cat) => {
          if (event.category !== cat.category) {
            cat.selected = false;
          } else if (event.category === cat.category) {
            cat.selected = !event.selected;
          }

          categoriesOut.push(cat);
        });

        return categoriesOut;
      }),
    );
    if (this.selectedCategory === event.category) {
      this.selectedCategory = '';
    } else {
      this.selectedCategory = event.category;
    }

    this.search(event, false, this.selectedCategory);
  }
  ngOnChanges(changes: SimpleChanges): void {
    if (changes.q && changes.q.previousValue !== changes.q.currentValue && this.form) {
      this.form.patchValue({ q: this.q ?? '' });
    }
  }

  search(e: Event, geo = false, cat: string = this.selectedCategory): void {
    if (e instanceof Event) {
      e.preventDefault();
    }
    const q: string = (this.form.value.q || '').trim();
    this.searchClick.emit({ q, geo, cat });
  }

  isGeoDisabled(): boolean {
    return !navigator.geolocation;
  }

  getcategories(): Observable<any[]> {
    return this.categories$.pipe(
      map((categories) => {
        let categoriesOut: any[] = [];
        categories.map((cat) => {
          let category = { category: cat, selected: false };
          if (this.selectedCategory === cat) {
            category.selected = true;
          }
          categoriesOut.push(category);
        });
        return categoriesOut;
      }),
    );
  }
}
