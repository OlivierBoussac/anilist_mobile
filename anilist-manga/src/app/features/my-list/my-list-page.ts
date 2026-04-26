import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { AnilistService } from '../../core/anilist-service';
import { MangaListGroup, Viewer } from '../../core/anilist-types';

@Component({
  selector: 'app-my-list-page',
  standalone: true,
  templateUrl: './my-list-page.html',
  styleUrl: './my-list-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MyListPage implements OnInit {
  private readonly anilistService = inject(AnilistService);

  readonly viewer = signal<Viewer | null>(null);
  readonly groups = signal<MangaListGroup[]>([]);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  ngOnInit(): void {
    void this.loadMyList();
  }

  async loadMyList(): Promise<void> {
    this.loading.set(true);
    this.error.set(null);

    try {
      const data = await this.anilistService.getViewerMangaList();
      this.viewer.set(data.viewer);
      this.groups.set(data.lists.filter((group) => group.entries.length > 0));
    } catch (error) {
      this.error.set((error as Error).message);
    } finally {
      this.loading.set(false);
    }
  }

  displayTitle(groupName: string): string {
    return groupName || 'Sans nom';
  }
}
