import type { FilterOption } from '@src/shared/types';
import type { FilterField } from '@src/shared/components/data-table-filters';

export const LOG_LEVELS: FilterOption[] = [
  { value: 'error', label: 'Error' },
  { value: 'warn', label: 'Warn' },
  { value: 'info', label: 'Info' },
  { value: 'debug', label: 'Debug' },
];

export const SORT_OPTIONS: FilterOption[] = [
  { value: 'createdAt', label: 'Date' },
  { value: 'type', label: 'Level' },
  { value: 'message', label: 'Message' },
];

export const SOURCE_OPTIONS: FilterOption[] = [
  { value: 'true', label: 'Backend' },
  { value: 'false', label: 'Client' },
];

export const LOGS_FILTER_FIELDS: FilterField[] = [
  { type: 'search', id: 'search', placeholder: 'Search message...' },
  { type: 'select', id: 'level', label: 'Level', options: LOG_LEVELS },
  { type: 'daterange', id: 'date', label: 'Date' },
  { type: 'select', id: 'isBackend', label: 'Source', options: SOURCE_OPTIONS },
  { type: 'select', id: 'sortBy', label: 'Sort by', options: SORT_OPTIONS },
];
