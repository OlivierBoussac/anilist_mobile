import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { AuthService } from '../../core/auth-service';
import { AnilistService } from '../../core/anilist-service';
import { Viewer } from '../../core/anilist-types';
import { anilistConfig } from '../../core/anilist-config';

@Component({
  selector: 'app-account-page',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './account-page.html',
  styleUrl: './account-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AccountPage {
  private readonly authService = inject(AuthService);
  private readonly anilistService = inject(AnilistService);

  readonly tokenControl = new FormControl(this.authService.token() || '', { nonNullable: true });
  readonly viewer = signal<Viewer | null>(null);
  readonly loading = signal(false);
  readonly message = signal<string | null>(null);
  readonly configWarning = signal(
    anilistConfig.oauthClientIdWeb === 'YOUR_ANILIST_WEB_CLIENT_ID'
      || anilistConfig.oauthClientIdNative === 'YOUR_ANILIST_NATIVE_CLIENT_ID'
  );

  readonly token = this.authService.token;
  readonly isAuthenticated = this.authService.isAuthenticated;

  async loginWithOAuth(): Promise<void> {
    this.message.set(null);

    try {
      await this.authService.startOAuthLogin();
    } catch (error) {
      this.message.set((error as Error).message);
    }
  }

  saveToken(): void {
    this.authService.setToken(this.tokenControl.value);
    this.message.set('Token enregistre.');
  }

  logout(): void {
    this.authService.clearToken();
    this.tokenControl.setValue('');
    this.viewer.set(null);
    this.message.set('Session fermee.');
  }

  async loadViewer(): Promise<void> {
    this.loading.set(true);
    this.message.set(null);

    try {
      this.viewer.set(await this.anilistService.getViewer());
    } catch (error) {
      this.message.set((error as Error).message);
    } finally {
      this.loading.set(false);
    }
  }
}
