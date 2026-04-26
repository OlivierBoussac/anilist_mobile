import { HttpClient, HttpHeaders } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { firstValueFrom, map, catchError, throwError } from 'rxjs';
import { anilistConfig } from './anilist-config';
import {
  GraphqlResponse,
  ListEntryStatus,
  Manga,
  MangaListEntryDetails,
  MangaListGroup,
  MangaSort,
  MediaStatusFilter,
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

interface GenreCollectionResponse {
  GenreCollection: string[];
}

interface MangaListEntryResponse {
  MediaList: MangaListEntryDetails;
}

export interface MangaQueryFilters {
  page?: number;
  perPage?: number;
  sort?: MangaSort;
  status?: MediaStatusFilter;
  genre?: string;
  year?: number;
}

export interface SearchMangaFilters extends MangaQueryFilters {
  search: string;
}

@Injectable({
  providedIn: 'root'
})
export class AnilistService {
  private readonly http = inject(HttpClient);
  private readonly authService = inject(AuthService);

  async getMangaGenres(): Promise<string[]> {
    const query = `
      query GenreCollection {
        GenreCollection
      }
    `;

    const data = await this.query<GenreCollectionResponse>(query);
    return data.GenreCollection ?? [];
  }

  async getTrendingManga(filters: MangaQueryFilters = {}): Promise<{ media: Manga[]; pageInfo: PageInfo }> {
    const query = `
      query TrendingManga(
        $page: Int!
        $perPage: Int!
        $sort: [MediaSort]
        $status: MediaStatus
        $genreIn: [String]
        $seasonYear: Int
      ) {
        Page(page: $page, perPage: $perPage) {
          pageInfo {
            currentPage
            hasNextPage
          }
          media(
            type: MANGA
            sort: $sort
            status: $status
            genre_in: $genreIn
            seasonYear: $seasonYear
          ) {
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
            genres
          }
        }
      }
    `;

    const variables = {
      page: filters.page ?? 1,
      perPage: filters.perPage ?? 20,
      sort: [filters.sort ?? 'TRENDING_DESC'],
      status: filters.status,
      genreIn: filters.genre ? [filters.genre] : undefined,
      seasonYear: filters.year
    };

    const data = await this.query<MangaPageResponse>(query, variables);
    return data.Page;
  }

  async searchManga(filters: SearchMangaFilters): Promise<{ media: Manga[]; pageInfo: PageInfo }> {
    const query = `
      query SearchManga(
        $search: String!
        $page: Int!
        $perPage: Int!
        $sort: [MediaSort]
        $status: MediaStatus
        $genreIn: [String]
      ) {
        Page(page: $page, perPage: $perPage) {
          pageInfo {
            currentPage
            hasNextPage
          }
          media(type: MANGA, search: $search, sort: $sort, status: $status, genre_in: $genreIn) {
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
            genres
          }
        }
      }
    `;

    const variables = {
      search: filters.search,
      page: filters.page ?? 1,
      perPage: filters.perPage ?? 20,
      sort: [filters.sort ?? 'POPULARITY_DESC'],
      status: filters.status,
      genreIn: filters.genre ? [filters.genre] : undefined
    };

    const data = await this.query<MangaPageResponse>(query, variables);
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
                genres
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

  async addMangaToList(mediaId: number, status: ListEntryStatus = 'CURRENT'): Promise<void> {
    const query = `
      mutation SaveEntry($mediaId: Int!, $status: MediaListStatus!) {
        SaveMediaListEntry(mediaId: $mediaId, status: $status) {
          id
        }
      }
    `;

    await this.query(query, { mediaId, status }, true);
  }

  async getMangaListEntry(entryId: number): Promise<MangaListEntryDetails> {
    const query = `
      query EntryDetails($id: Int!) {
        MediaList(id: $id) {
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
            genres
          }
        }
      }
    `;

    const data = await this.query<MangaListEntryResponse>(query, { id: entryId }, true);
    return data.MediaList;
  }

  async updateMangaListEntry(entryId: number, status: ListEntryStatus, progress: number, scoreRaw: number): Promise<void> {
    const query = `
      mutation UpdateEntry($id: Int!, $status: MediaListStatus!, $progress: Int!, $scoreRaw: Int!) {
        SaveMediaListEntry(id: $id, status: $status, progress: $progress, scoreRaw: $scoreRaw) {
          id
        }
      }
    `;

    await this.query(query, { id: entryId, status, progress, scoreRaw }, true);
  }

  async deleteMangaListEntry(entryId: number): Promise<void> {
    const query = `
      mutation DeleteEntry($id: Int!) {
        DeleteMediaListEntry(id: $id) {
          deleted
        }
      }
    `;

    await this.query(query, { id: entryId }, true);
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
            const graphqlMessage = error?.error?.errors?.[0]?.message;
            const message = graphqlMessage || error?.message || 'Erreur lors de la communication avec AniList.';
            return throwError(() => new Error(message));
          })
        )
    );
  }
}
