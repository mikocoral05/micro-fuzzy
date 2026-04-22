export interface SearchOptions {
  keys?: string[];
  highlight?: boolean;
}

export interface SearchResult<T> {
  item: T;
  score: number;
  highlighted: string | null;
}

export declare class MicroFuzzy {
  static search(
    data: string[],
    query: string,
    options?: SearchOptions,
  ): SearchResult<string>[];
  static search<T>(
    data: T[],
    query: string,
    options: SearchOptions,
  ): SearchResult<T>[];
}
