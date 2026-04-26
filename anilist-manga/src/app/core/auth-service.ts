import { computed, inject, Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';
import { App as CapacitorApp } from '@capacitor/app';
import { Browser } from '@capacitor/browser';
import { Capacitor } from '@capacitor/core';
import { anilistConfig } from './anilist-config';

const TOKEN_STORAGE_KEY = 'anilist.access.token';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly router = inject(Router);
  private listenerRegistered = false;

  readonly token = signal<string | null>(this.readStoredToken());
  readonly isAuthenticated = computed(() => this.token() !== null);
  readonly activeClientId = computed(() =>
    Capacitor.isNativePlatform() ? anilistConfig.oauthClientIdNative : anilistConfig.oauthClientIdWeb
  );

  readonly oauthUrl = computed(() => {
    const params = new URLSearchParams({
      client_id: this.activeClientId(),
      response_type: anilistConfig.oauthResponseType
    });

    return `https://anilist.co/api/v2/oauth/authorize?${params.toString()}`;
  });

  initializeAuthCallbackHandling(): void {
    this.tryHandleOAuthCallback();

    if (!Capacitor.isNativePlatform() || this.listenerRegistered) {
      return;
    }

    this.listenerRegistered = true;
    void CapacitorApp.addListener('appUrlOpen', ({ url }) => {
      void this.handleCallbackUrl(url, true);
    });
  }

  async startOAuthLogin(): Promise<void> {
    const url = this.oauthUrl();

    if (Capacitor.isNativePlatform()) {
      await Browser.open({
        url
      });
      return;
    }

    window.location.href = url;
  }

  setToken(token: string): void {
    const cleaned = token.trim();
    if (!cleaned) {
      return;
    }

    localStorage.setItem(TOKEN_STORAGE_KEY, cleaned);
    this.token.set(cleaned);
  }

  clearToken(): void {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    this.token.set(null);
  }

  tryHandleOAuthCallback(): void {
    if (typeof window === 'undefined') {
      return;
    }

    void this.handleCallbackUrl(window.location.href, false);
  }

  private async handleCallbackUrl(url: string, closeBrowser: boolean): Promise<void> {
    const accessToken = this.extractAccessToken(url);

    if (!accessToken) {
      return;
    }

    this.setToken(accessToken);

    if (closeBrowser && Capacitor.isNativePlatform()) {
      await Browser.close();
    }

    if (typeof window !== 'undefined') {
      window.history.replaceState({}, document.title, window.location.pathname + window.location.search);
    }

    void this.router.navigateByUrl('/account');
  }

  private extractAccessToken(callbackUrl: string): string | null {
    const normalized = callbackUrl.replace(`${anilistConfig.oauthCallbackScheme}://`, 'https://');
    const parsed = new URL(normalized);

    if (!parsed.hash.startsWith('#')) {
      return null;
    }

    const hashParams = new URLSearchParams(parsed.hash.slice(1));
    return hashParams.get('access_token');
  }

  private readStoredToken(): string | null {
    const stored = localStorage.getItem(TOKEN_STORAGE_KEY);
    return stored?.trim() || null;
  }
}
