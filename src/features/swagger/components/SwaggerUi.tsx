'use client';

import SwaggerUI from 'swagger-ui-react';
import 'swagger-ui-react/swagger-ui.css';

interface SwaggerUiProps {
  url: string;
}

export function SwaggerUi({ url }: SwaggerUiProps) {
  return (
    <div className="min-h-screen bg-white">
      <SwaggerUI
        url={url}
        persistAuthorization={true}
        supportedSubmitMethods={['get', 'post', 'put', 'patch', 'delete']}
      />
    </div>
  );
}
