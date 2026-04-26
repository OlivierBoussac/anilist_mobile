import { HttpClient, HttpHeaders } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { firstValueFrom, map, catchError, throwError } from 'rxjs';
import { anilistConfig } from './anilist-config';
import {
  GraphqlResponse,
  Manga,
  MangaListGroup,
  PageInfo,
  Viewer
} from './anilist-types';
import { AuthService } from './auth-service';

interface MangaPageResponse {
  Page: {
    media: Manga[];
    pageInfo: PageInfo;
  };
}

interface ViewerResponse {
  Viewer: Viewer;
}

interface ViewerMangaListResponse {
  Viewer: Viewer;
  MediaListCollection: {
    lists: MangaListGroup[];
  };
}

@Injectable({
  providedIn: 'root'
})
export class AnilistService {
  private readonly http = inject(HttpClient);
  private readonly authService = inject(AuthService);

  async getTrendingManga(page = 1, perPage = 20): Promise<{ media: Manga[]; pageInfo: PageInfo }> {
    const query = `
      query TrendingManga($page: Int!, $perPage: Int!) {
        Page(page: $page, perPage: $perPage) {
          pageInfo {
            currentPage
            hasNextPage
          }
          media(type: MANGA, sort: TRENDING_DESC) {
            id
            title {
              romaji
              english
              userPreferred
            }
            coverImage {
              large
              medium
            }
            averageScore
            status
            chapters
          }
        }
      }
    `;

    const data = await this.query<MangaPageResponse>(query, { page, perPage });
    return data.Page;
  }

  async searchManga(search: string, page = 1, perPage = 20): Promise<{ media: Manga[]; pageInfo: PageInfo }> {
    const query = `
      query SearchManga($search: String!, $page: Int!, $perPage: Int!) {
        Page(page: $page, perPage: $perPage) {
          pageInfo {
            currentPage
            hasNextPage
          }
          media(type: MANGA, search: $search, sort: SEARCH_MATCH) {
            id
            title {
              romaji
              english
              userPreferred
            }
            coverImage {
              large
              medium
            }
            averageScore
            status
            chapters
          }
        }
      }
    `;

    const data = await this.query<MangaPageResponse>(query, { search, page, perPage });
    return data.Page;
  }

  async getViewer(): Promise<Viewer> {
    const query = `
      query ViewerProfile {
        Viewer {
          id
          name
          avatar {
            medium
          }
        }
      }
    `;

    const data = await this.query<ViewerResponse>(query, undefined, true);
    return data.Viewer;
  }

  async getViewerMangaList(): Promise<{ viewer: Viewer; lists: MangaListGroup[] }> {
    const query = `
      query ViewerMangaList($userId: Int!) {
        Viewer {
          id
          name
          avatar {
            medium
          }
        }
        MediaListCollection(userId: $userId, type: MANGA, sort: UPDATED_TIME_DESC) {
          lists {
            name
            entries {
              id
              status
              progress
              score
              media {
                id
                title {
                  romaji
                  english
                  userPreferred
                }
                coverImage {
                  large
                  medium
                }
                averageScore
                status
                chapters
              }
            }
          }
        }
      }
    `;

    const viewer = await this.getViewer();
    const data = await this.query<ViewerMangaListResponse>(query, { userId: viewer.id }, true);
    return {
      viewer: data.Viewer,
      lists: data.MediaListCollection?.lists ?? []
    };
  }

  async addMangaToList(mediaId: number, status: 'CURRENT' | 'PLANNING' = 'CURRENT'): Promise<void> {
    const query = `
      mutation SaveEntry($mediaId: Int!, $status: MediaListStatus!) {
        SaveMediaListEntry(mediaId: $mediaId, status: $status) {
          id
        }
      }
    `;

    await this.query(query, { mediaId, status }, true);
  }

  private async query<TData>(query: string, variables?: Record<string, unknown>, requiresAuth = false): Promise<TData> {
    if (requiresAuth && !this.authService.isAuthenticated()) {
      throw new Error('Veuillez vous connecter pour utiliser cette fonctionnalite.');
    }

    const headers = new HttpHeaders({
      'Content-Type': 'application/json'
    });

    return firstValueFrom(
      this.http
        .post<GraphqlResponse<TData>>(anilistConfig.apiUrl, { query, variables }, { headers })
        .pipe(
          map((response) => {
            if (response.errors?.length) {
              throw new Error(response.errors[0].message);
            }

            return response.data;
          }),
          catchError((error) => {
            const message = error?.message || 'Erreur lors de la communication avec AniList.';
            return throwError(() => new Error(message));
          })
        )
    );
  }
}
