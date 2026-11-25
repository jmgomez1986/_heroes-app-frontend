export interface FiltersQuery {
  name?: string;
  alias?: string;
  team?: string;
  universe?: string;
  category?: string;
  status?: string;
}

export interface FilterFieldConfig {
  id: keyof FiltersQuery;
  label: string;
  type: 'text' | 'select' | 'radio';
  placeholder?: string;
  maxLength?: number;
  options?: { label: string; value: string; default: boolean }[];
}
