'use client';

import { SwaggerUi } from '@feature/swagger/components/SwaggerUi';

export default function DocsPage() {
  return <SwaggerUi url="/api/docs" />;
}
