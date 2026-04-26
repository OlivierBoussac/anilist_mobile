import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AnilistService } from '../../core/anilist-service';
import { ListEntryStatus, MangaListEntryDetails } from '../../core/anilist-types';

@Component({
  selector: 'app-my-list-entry-page',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './my-list-entry-page.html',
  styleUrl: './my-list-entry-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MyListEntryPage implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly anilistService = inject(AnilistService);

  readonly entry = signal<MangaListEntryDetails | null>(null);
  readonly loading = signal(false);
  readonly saving = signal(false);
  readonly deleting = signal(false);
  readonly error = signal<string | null>(null);
  readonly success = signal<string | null>(null);

  readonly statusOptions: Array<{ value: ListEntryStatus; label: string }> = [
    { value: 'CURRENT', label: 'Reading' },
    { value: 'PLANNING', label: 'Planning' },
    { value: 'COMPLETED', label: 'Completed' },
    { value: 'REPEATING', label: 'Repeating' },
    { value: 'PAUSED', label: 'Paused' },
    { value: 'DROPPED', label: 'Dropped' }
  ];

  readonly form = new FormGroup({
    status: new FormControl<ListEntryStatus>('CURRENT', { nonNullable: true, validators: [Validators.required] }),
    progress: new FormControl<number>(0, { nonNullable: true, validators: [Validators.min(0)] }),
    scoreRaw: new FormControl<number>(0, { nonNullable: true, validators: [Validators.min(0), Validators.max(100)] })
  });

  readonly chapterHint = computed(() => {
    const chapters = this.entry()?.media.chapters;
    if (!chapters) {
      return 'Nombre de chapitres inconnu sur AniList';
    }

    return `Total chapitres: ${chapters}`;
  });

  ngOnInit(): void {
    void this.loadEntry();
  }

  async save(): Promise<void> {
    const current = this.entry();
    if (!current) {
      return;
    }

    this.form.markAllAsTouched();
    if (this.form.invalid) {
      this.error.set('Veuillez corriger le formulaire avant sauvegarde.');
      return;
    }

    this.saving.set(true);
    this.error.set(null);
    this.success.set(null);

    try {
      await this.anilistService.updateMangaListEntry(
        current.id,
        this.form.controls.status.value,
        this.form.controls.progress.value,
        this.form.controls.scoreRaw.value
      );

      this.success.set('Mise a jour enregistree.');
      await this.loadEntry(false);
    } catch (error) {
      this.error.set((error as Error).message);
    } finally {
      this.saving.set(false);
    }
  }

  async deleteEntry(): Promise<void> {
    const current = this.entry();
    if (!current) {
      return;
    }

    const confirmed = window.confirm('Supprimer ce manga de votre liste ?');
    if (!confirmed) {
      return;
    }

    this.deleting.set(true);
    this.error.set(null);
    this.success.set(null);

    try {
      await this.anilistService.deleteMangaListEntry(current.id);
      this.success.set('Manga supprime de votre liste.');
      void this.router.navigateByUrl('/my-list');
    } catch (error) {
      this.error.set((error as Error).message);
    } finally {
      this.deleting.set(false);
    }
  }

  title(): string {
    const media = this.entry()?.media;
    if (!media) {
      return 'Edition de manga';
    }

    return media.title.userPreferred || media.title.romaji || media.title.english || 'Sans titre';
  }

  private async loadEntry(showLoading = true): Promise<void> {
    const rawEntryId = this.route.snapshot.paramMap.get('entryId');
    const entryId = Number(rawEntryId);

    if (!rawEntryId || Number.isNaN(entryId)) {
      this.error.set('Identifiant d\'entree invalide.');
      return;
    }

    if (showLoading) {
      this.loading.set(true);
    }
    this.error.set(null);

    try {
      const entry = await this.anilistService.getMangaListEntry(entryId);
      this.entry.set(entry);
      this.form.setValue({
        status: entry.status,
        progress: entry.progress ?? 0,
        scoreRaw: Math.round(entry.score ?? 0)
      });
    } catch (error) {
      this.error.set((error as Error).message);
    } finally {
      if (showLoading) {
        this.loading.set(false);
      }
    }
  }

  goBack(): void {
    void this.router.navigateByUrl('/my-list');
  }
}
