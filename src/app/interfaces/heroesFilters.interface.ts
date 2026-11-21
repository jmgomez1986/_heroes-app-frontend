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
  placeholder: string;
  type: 'text' | 'select' | 'radio';
  maxLength?: number;
  options?: { label: string; value: string; default: boolean }[];
}
