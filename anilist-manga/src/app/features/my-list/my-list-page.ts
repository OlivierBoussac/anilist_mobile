import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { startWith } from 'rxjs';
import { AnilistService } from '../../core/anilist-service';
import { ListEntryStatus, MangaListGroup, Viewer } from '../../core/anilist-types';

@Component({
  selector: 'app-my-list-page',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
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

  readonly searchControl = new FormControl('', { nonNullable: true });
  readonly groupControl = new FormControl('ALL', { nonNullable: true });
  readonly statusControl = new FormControl<'ALL' | ListEntryStatus>('ALL', { nonNullable: true });

  private readonly searchValue = toSignal(this.searchControl.valueChanges.pipe(startWith(this.searchControl.value)), {
    initialValue: this.searchControl.value
  });

  private readonly groupValue = toSignal(this.groupControl.valueChanges.pipe(startWith(this.groupControl.value)), {
    initialValue: this.groupControl.value
  });

  private readonly statusValue = toSignal(this.statusControl.valueChanges.pipe(startWith(this.statusControl.value)), {
    initialValue: this.statusControl.value
  });

  readonly statusOptions: Array<{ value: 'ALL' | ListEntryStatus; label: string }> = [
    { value: 'ALL', label: 'Tous les statuts' },
    { value: 'CURRENT', label: 'Reading' },
    { value: 'PLANNING', label: 'Planning' },
    { value: 'COMPLETED', label: 'Completed' },
    { value: 'REPEATING', label: 'Repeating' },
    { value: 'PAUSED', label: 'Paused' },
    { value: 'DROPPED', label: 'Dropped' }
  ];

  readonly groupOptions = computed(() => ['ALL', ...this.groups().map((group) => group.name)]);

  readonly filteredGroups = computed(() => {
    const term = this.searchValue().trim().toLowerCase();
    const selectedGroup = this.groupValue();
    const selectedStatus = this.statusValue();

    let groups = this.groups();
    if (selectedGroup !== 'ALL') {
      groups = groups.filter((group) => group.name === selectedGroup);
    }

    return groups
      .map((group) => {
        const entries = group.entries.filter((entry) => {
          const statusMatch = selectedStatus === 'ALL' || entry.status === selectedStatus;
          const title = entry.media.title.userPreferred || entry.media.title.romaji || entry.media.title.english || '';
          const searchMatch = !term || title.toLowerCase().includes(term);

          return statusMatch && searchMatch;
        });

        return {
          ...group,
          entries
        };
      })
      .filter((group) => group.entries.length > 0);
  });

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

  titleFor(groupName: string): string {
    return this.displayTitle(groupName);
  }
}
