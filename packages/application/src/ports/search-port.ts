export type SearchQuery = Readonly<{
  locale: string;
  principalEntityId: string;
  query: string;
}>;

export type SearchResult = Readonly<{
  resourceId: string;
  resourceType: string;
  title: string;
}>;

export interface SearchPort {
  search(query: SearchQuery): Promise<readonly SearchResult[]>;
}
