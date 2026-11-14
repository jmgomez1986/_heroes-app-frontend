export interface Filters {
  name?: string;
  alias?: string;
}

export interface HeroV2 {
  _id: string;
  name: string;
  alias: string;
  slug: string;
  powers: string[];
  description: string;
  team: string;
  image: string;
  status: string;
  category: string;
  universe: string;
}

export interface GetHeroesResponse {
  total_pages: number;
  current_page: number;
  elements_per_page: number;
  total_elements: number;
  data: HeroV2[];
}

// Con Mock del backend
export interface Hero {
  id: string;
  name: string;
  alias: string;
  powers: string[];
  description: string;
  team: string;
  image: string;
  status: string;
  category: string;
  universe: string;
}
export interface HeroesResponsePaginated {
  first: number;
  prev: number | null;
  next: number | null;
  last: number;
  pages: number;
  items: number;
  data: Hero[];
}

export interface HeroesGridResourceParams {
  page: number;
  size: number;
  query: Filters;
  refreshKey: number;
}

export interface NewHeroResponse {
  res: Hero;
}
