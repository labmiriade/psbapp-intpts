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
import { ToastService, ToastType } from 'src/app/core/services/toast.service';

@Component({
  selector: 'app-search-bar',
  templateUrl: './search-bar.component.html',
  styleUrls: ['./search-bar.component.scss'],
})
export class SearchBarComponent implements OnChanges, OnInit, OnDestroy {
  @Input() q = '';
  @Output() searchClick = new EventEmitter<{ q: string; geo: boolean; cat: string }>();
  @ViewChild('srollableDiv') srollableDiv!: ElementRef<any>;

  form: FormGroup;
  private sub: Subscription;

  categories: any[] = [];

  selectedCategory: string = '';
  loading$: Observable<boolean>;
  categories$: Observable<string[]>;
  categoriesList: Observable<any[]>;

  constructor(
    private fb: FormBuilder,
    private store: Store<AppState>,
    private activatedRoute: ActivatedRoute,
    private toast: ToastService,
  ) {
    this.sub = new Subscription();
    this.form = this.fb.group({
      q: this.q ?? '',
    });

    this.loading$ = this.store.select(searchLoading());
    this.categories$ = this.store.select(searchResults());
    this.categoriesList = this.getCategories();
  }

  ngOnInit(): void {
    this.sub.add(
      this.activatedRoute.queryParams.subscribe((params) => {
        this.selectedCategory = params.cat || '';
      }),
    );

    this.sub.add(this.store.dispatch(searchCategory()));
  }

  ngOnDestroy(): void {
    this.sub.unsubscribe();
  }

  scrollHorizontal(event: WheelEvent) {
    event.preventDefault();
    this.srollableDiv.nativeElement.scrollLeft += event.deltaY + event.deltaX;
  }

  setCategory(event: CategoryBubble): void {
    if (this.selectedCategory === event.category) {
      this.selectedCategory = '';
    } else {
      this.selectedCategory = event.category;
    }
    this.categoriesList = this.getCategories();
    this.search(event, false, this.selectedCategory);
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.q && changes.q.previousValue !== changes.q.currentValue && this.form) {
      this.form.patchValue({ q: this.q ?? '' });
    }
  }

  search(e: Event | CategoryBubble, geo = false, cat: string = this.selectedCategory): void {
    if (e instanceof Event) {
      e.preventDefault();
    }

    if (this.form.value.q.length < 3 && cat === '') {
      this.toast.show(
        'Ricerca non valida',
        'Inserire una parola di almeno 3 caratteri e premere il pulsante Ricerca o GeoRicerca',
        ToastType.Danger,
      );
    } else {
      const q: string = this.form.value.q.trim();
      this.searchClick.emit({ q, geo, cat });
    }
  }

  isGeoDisabled(): boolean {
    return !navigator.geolocation;
  }

  getCategories(): Observable<CategoryBubble[]> {
    return this.categories$.pipe(
      map((categories) => {
        return categories.map((cat) => {
          const selected = this.selectedCategory === cat;
          return {
            category: cat,
            selected: selected,
          };
        });
      }),
    );
  }
}

/* private interface representing a category bubble */
interface CategoryBubble {
  category: string;
  selected: boolean;
}
