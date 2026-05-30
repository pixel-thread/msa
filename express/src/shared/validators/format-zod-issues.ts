import type { ZodIssue } from 'zod';

import type { ValidationIssue } from '@src/shared/types';

export const formatZodIssues = (issues: ZodIssue[]): ValidationIssue[] =>
  issues.map((issue) => ({
    field: issue.path.length > 0 ? issue.path.join('.') : 'root',
    message: issue.message,
    code: issue.code,
  }));
