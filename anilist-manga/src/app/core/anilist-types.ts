export interface Title {
  romaji: string | null;
  english: string | null;
  userPreferred: string;
}

export interface CoverImage {
  large: string | null;
  medium: string | null;
}

export interface Manga {
  id: number;
  title: Title;
  coverImage: CoverImage;
  averageScore: number | null;
  status: string | null;
  chapters: number | null;
  genres: string[];
}

export interface PageInfo {
  currentPage: number;
  hasNextPage: boolean;
}

export interface MangaListEntry {
  id: number;
  status: ListEntryStatus;
  progress: number;
  score: number;
  media: Manga;
}

export interface MangaListEntryDetails {
  id: number;
  status: ListEntryStatus;
  progress: number;
  score: number;
  media: Manga;
}

export interface MangaListGroup {
  name: string;
  entries: MangaListEntry[];
}

export interface Viewer {
  id: number;
  name: string;
  avatar: {
    medium: string | null;
  };
}

export type MangaSort =
  | 'TRENDING_DESC'
  | 'POPULARITY_DESC'
  | 'SCORE_DESC'
  | 'START_DATE_DESC'
  | 'CHAPTERS_DESC';

export type MediaStatusFilter =
  | 'FINISHED'
  | 'RELEASING'
  | 'NOT_YET_RELEASED'
  | 'CANCELLED'
  | 'HIATUS';

export type ListEntryStatus = 'CURRENT' | 'PLANNING' | 'COMPLETED' | 'PAUSED' | 'DROPPED' | 'REPEATING';

export interface GraphqlError {
  message: string;
}

export interface GraphqlResponse<TData> {
  data: TData;
  errors?: GraphqlError[];
}
