import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { AnilistService } from '../../core/anilist-service';
import { ListEntryStatus, Manga, MangaSort, MediaStatusFilter } from '../../core/anilist-types';
import { AuthService } from '../../core/auth-service';

@Component({
  selector: 'app-search-page',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './search-page.html',
  styleUrl: './search-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SearchPage implements OnInit {
  private readonly anilistService = inject(AnilistService);
  private readonly authService = inject(AuthService);

  readonly queryControl = new FormControl('', { nonNullable: true });
  readonly filtersForm = new FormGroup({
    sort: new FormControl<MangaSort>('POPULARITY_DESC', { nonNullable: true }),
    status: new FormControl<MediaStatusFilter | ''>('', { nonNullable: true }),
    genre: new FormControl<string>('', { nonNullable: true }),
    addStatus: new FormControl<ListEntryStatus>('PLANNING', { nonNullable: true })
  });

  readonly genres = signal<string[]>([]);
  readonly results = signal<Manga[]>([]);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly hasSearched = signal(false);
  readonly actionMessage = signal<string | null>(null);
  readonly addingIds = signal<number[]>([]);
  readonly isAuthenticated = this.authService.isAuthenticated;

  readonly sortOptions: Array<{ value: MangaSort; label: string }> = [
    { value: 'POPULARITY_DESC', label: 'Popularite' },
    { value: 'SCORE_DESC', label: 'Meilleure note' },
    { value: 'TRENDING_DESC', label: 'Tendance' },
    { value: 'START_DATE_DESC', label: 'Plus recent' }
  ];

  readonly mediaStatusOptions: Array<{ value: MediaStatusFilter; label: string }> = [
    { value: 'RELEASING', label: 'En cours' },
    { value: 'FINISHED', label: 'Termine' },
    { value: 'NOT_YET_RELEASED', label: 'Pas encore sorti' },
    { value: 'HIATUS', label: 'En pause' },
    { value: 'CANCELLED', label: 'Annule' }
  ];

  readonly listStatusOptions: Array<{ value: ListEntryStatus; label: string }> = [
    { value: 'CURRENT', label: 'Reading' },
    { value: 'PLANNING', label: 'Planning' },
    { value: 'COMPLETED', label: 'Completed' },
    { value: 'PAUSED', label: 'Paused' },
    { value: 'DROPPED', label: 'Dropped' }
  ];

  ngOnInit(): void {
    void this.loadGenres();
  }

  async search(): Promise<void> {
    const search = this.queryControl.value.trim();
    if (!search) {
      this.results.set([]);
      this.hasSearched.set(false);
      this.error.set('Veuillez saisir un titre a rechercher.');
      return;
    }

    this.loading.set(true);
    this.error.set(null);
    this.hasSearched.set(true);
    this.actionMessage.set(null);

    try {
      const data = await this.anilistService.searchManga({
        search,
        sort: this.filtersForm.controls.sort.value,
        status: this.filtersForm.controls.status.value || undefined,
        genre: this.filtersForm.controls.genre.value || undefined
      });
      this.results.set(data.media);
    } catch (error) {
      this.error.set((error as Error).message);
    } finally {
      this.loading.set(false);
    }
  }

  async addToList(mediaId: number): Promise<void> {
    if (!this.isAuthenticated()) {
      this.error.set('Connectez-vous dans l\'onglet Compte pour ajouter un manga a votre liste.');
      return;
    }

    this.error.set(null);
    this.actionMessage.set(null);
    this.addingIds.set([...this.addingIds(), mediaId]);

    try {
      await this.anilistService.addMangaToList(mediaId, this.filtersForm.controls.addStatus.value);
      this.actionMessage.set('Manga ajoute a votre liste.');
    } catch (error) {
      this.error.set((error as Error).message);
    } finally {
      this.addingIds.set(this.addingIds().filter((id) => id !== mediaId));
    }
  }

  isAdding(mediaId: number): boolean {
    return this.addingIds().includes(mediaId);
  }

  genrePreview(manga: Manga): string {
    return manga.genres.slice(0, 2).join(', ');
  }

  titleFor(manga: Manga): string {
    return manga.title.userPreferred || manga.title.romaji || manga.title.english || 'Sans titre';
  }

  private async loadGenres(): Promise<void> {
    try {
      const genres = await this.anilistService.getMangaGenres();
      this.genres.set([...genres].sort((a, b) => a.localeCompare(b)));
    } catch {
      this.genres.set([]);
    }
  }
}
