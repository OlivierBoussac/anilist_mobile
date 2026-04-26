import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { AnilistService } from '../../core/anilist-service';
import { ListEntryStatus, Manga, MangaSort, MediaStatusFilter } from '../../core/anilist-types';
import { AuthService } from '../../core/auth-service';

@Component({
  selector: 'app-browse-page',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './browse-page.html',
  styleUrl: './browse-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class BrowsePage implements OnInit {
  private readonly anilistService = inject(AnilistService);
  private readonly authService = inject(AuthService);

  readonly mangas = signal<Manga[]>([]);
  readonly genres = signal<string[]>([]);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly actionMessage = signal<string | null>(null);
  readonly addingIds = signal<number[]>([]);
  readonly isAuthenticated = this.authService.isAuthenticated;

  readonly sortOptions: Array<{ value: MangaSort; label: string }> = [
    { value: 'TRENDING_DESC', label: 'Tendance' },
    { value: 'POPULARITY_DESC', label: 'Popularite' },
    { value: 'SCORE_DESC', label: 'Meilleure note' },
    { value: 'START_DATE_DESC', label: 'Plus recent' },
    { value: 'CHAPTERS_DESC', label: 'Plus de chapitres' }
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

  readonly filtersForm = new FormGroup({
    sort: new FormControl<MangaSort>('TRENDING_DESC', { nonNullable: true }),
    status: new FormControl<MediaStatusFilter | ''>('', { nonNullable: true }),
    genre: new FormControl<string>('', { nonNullable: true }),
    year: new FormControl<string>('', { nonNullable: true }),
    addStatus: new FormControl<ListEntryStatus>('CURRENT', { nonNullable: true })
  });

  ngOnInit(): void {
    void this.loadGenres();
    void this.loadTrending();
  }

  async loadTrending(): Promise<void> {
    this.loading.set(true);
    this.error.set(null);
    this.actionMessage.set(null);

    try {
      const yearValue = this.filtersForm.controls.year.value.trim();
      const year = yearValue ? Number(yearValue) : undefined;

      const data = await this.anilistService.getTrendingManga({
        sort: this.filtersForm.controls.sort.value,
        status: this.filtersForm.controls.status.value || undefined,
        genre: this.filtersForm.controls.genre.value || undefined,
        year: Number.isNaN(year) ? undefined : year
      });

      this.mangas.set(data.media);
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
      this.actionMessage.set('Manga ajoute a votre liste avec succes.');
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
