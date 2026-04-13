'use client'

import SwaggerUI from 'swagger-ui-react'
import 'swagger-ui-react/swagger-ui.css'

export default function ApiDocs() {
  return (
    <div className="min-h-screen bg-background">
      <SwaggerUI url="/api/openapi.json" docExpansion="list" defaultModelsExpandDepth={1} />
    </div>
  )
}
