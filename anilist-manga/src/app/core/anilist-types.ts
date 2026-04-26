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
}

export interface PageInfo {
  currentPage: number;
  hasNextPage: boolean;
}

export interface MangaListEntry {
  id: number;
  status: string;
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

export interface GraphqlError {
  message: string;
}

export interface GraphqlResponse<TData> {
  data: TData;
  errors?: GraphqlError[];
}
