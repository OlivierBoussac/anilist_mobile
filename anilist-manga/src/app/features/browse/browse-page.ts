import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { AnilistService } from '../../core/anilist-service';
import { Manga } from '../../core/anilist-types';

@Component({
  selector: 'app-browse-page',
  standalone: true,
  templateUrl: './browse-page.html',
  styleUrl: './browse-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class BrowsePage implements OnInit {
  private readonly anilistService = inject(AnilistService);

  readonly mangas = signal<Manga[]>([]);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  ngOnInit(): void {
    void this.loadTrending();
  }

  async loadTrending(): Promise<void> {
    this.loading.set(true);
    this.error.set(null);

    try {
      const data = await this.anilistService.getTrendingManga();
      this.mangas.set(data.media);
    } catch (error) {
      this.error.set((error as Error).message);
    } finally {
      this.loading.set(false);
    }
  }

  async addToList(mediaId: number): Promise<void> {
    try {
      await this.anilistService.addMangaToList(mediaId, 'CURRENT');
    } catch (error) {
      this.error.set((error as Error).message);
    }
  }

  titleFor(manga: Manga): string {
    return manga.title.userPreferred || manga.title.romaji || manga.title.english || 'Sans titre';
  }
}
