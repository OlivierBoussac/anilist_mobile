import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { AnilistService } from '../../core/anilist-service';
import { Manga } from '../../core/anilist-types';

@Component({
  selector: 'app-search-page',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './search-page.html',
  styleUrl: './search-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SearchPage {
  private readonly anilistService = inject(AnilistService);

  readonly queryControl = new FormControl('', { nonNullable: true });
  readonly results = signal<Manga[]>([]);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly hasSearched = signal(false);

  async search(): Promise<void> {
    const search = this.queryControl.value.trim();
    if (!search) {
      this.results.set([]);
      this.hasSearched.set(false);
      return;
    }

    this.loading.set(true);
    this.error.set(null);
    this.hasSearched.set(true);

    try {
      const data = await this.anilistService.searchManga(search);
      this.results.set(data.media);
    } catch (error) {
      this.error.set((error as Error).message);
    } finally {
      this.loading.set(false);
    }
  }

  async addToPlanning(mediaId: number): Promise<void> {
    try {
      await this.anilistService.addMangaToList(mediaId, 'PLANNING');
    } catch (error) {
      this.error.set((error as Error).message);
    }
  }

  titleFor(manga: Manga): string {
    return manga.title.userPreferred || manga.title.romaji || manga.title.english || 'Sans titre';
  }
}
