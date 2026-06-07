export interface OpenMetadataMethods5 {
  getDataLatency(entityType: string, fqn: string, params?: { startTs?: number; endTs?: number }): Promise<any>
  getCustomProperties(entityType: string): Promise<any>
  createCustomProperty(entityType: string, data: any): Promise<any>
  updateCustomProperty(entityType: string, propertyName: string, data: any): Promise<any>
  deleteCustomProperty(entityType: string, propertyName: string): Promise<any>
  getSuggestions(query: string, entityType?: string): Promise<any>
  getSearchFacets(params?: { entityType?: string; field?: string }): Promise<any>
  getSearchAggregations(query: string, aggregations: string[], params?: Record<string, any>): Promise<any>
  getRecommendations(entityType: string, fqn: string): Promise<any>
  getGlobalRecommendations(params?: { limit?: number; offset?: number }): Promise<any>
  getKPIs(params?: { limit?: number; offset?: number }): Promise<any>
  getKPI(id: string): Promise<any>
  createKPI(data: any): Promise<any>
  updateKPI(id: string, data: any): Promise<any>
  deleteKPI(id: string): Promise<any>
  getGoals(params?: { limit?: number; offset?: number }): Promise<any>
  createGoal(data: any): Promise<any>
  getGoal(id: string): Promise<any>
  updateGoal(id: string, data: any): Promise<any>
  deleteGoal(id: string): Promise<any>
  getDataContracts(params?: { limit?: number; offset?: number; entityType?: string; entityFqn?: string }): Promise<any>
  getDataContract(id: string): Promise<any>
  createDataContract(data: any): Promise<any>
  updateDataContract(id: string, data: any): Promise<any>
  deleteDataContract(id: string): Promise<any>
  getImpactAnalysis(entityType: string, fqn: string, params?: { depth?: number; direction?: 'upstream' | 'downstream' | 'both' }): Promise<any>
  getDownstreamImpact(entityType: string, fqn: string, depth: number): Promise<any>
  getUpstreamImpact(entityType: string, fqn: string, depth: number): Promise<any>
  getMeasurementUnits(params?: { limit?: number; offset?: number }): Promise<any>
  getMeasurementUnit(id: string): Promise<any>
  createMeasurementUnit(data: any): Promise<any>
  updateMeasurementUnit(id: string, data: any): Promise<any>
  deleteMeasurementUnit(id: string): Promise<any>
  bulkDeleteEntities(entityType: string, fqns: string[]): Promise<any>
  bulkUpdateDescriptions(entityType: string, updates: Array<{ fqn: string; description: string }>): Promise<any>
  bulkUpdateOwnersExtended(entityType: string, updates: Array<{ fqn: string; owner: { id: string; type: string } }>): Promise<any>
  exportMetadata(entityType: string, fqn: string, format: 'json' | 'yaml'): Promise<any>
  importMetadata(entityType: string, data: any, format: 'json' | 'yaml'): Promise<any>
  exportBulkMetadata(entityType: string, fqns: string[], format: 'json' | 'yaml'): Promise<any>
  getRelationships(entityType: string, fqn: string, relationshipType?: string): Promise<any>
  getRelationship(entityType: string, fqn: string, relationshipId: string): Promise<any>
  createRelationship(entityType: string, fqn: string, relationshipData: any): Promise<any>
  updateRelationship(entityType: string, fqn: string, relationshipId: string, relationshipData: any): Promise<any>
  deleteRelationship(entityType: string, fqn: string, relationshipId: string): Promise<any>
  validateEntity(entityType: string, fqn: string): Promise<any>
  validateBulkEntities(entityType: string, fqns: string[]): Promise<any>
  getMetadataOperations(entityType: string, fqn: string): Promise<any>
  executeMetadataOperation(entityType: string, fqn: string, operation: string, params?: Record<string, any>): Promise<any>
  getSystemVersion(): Promise<any>
  getSystemConfig(): Promise<any>
  getSystemTime(): Promise<any>
  getSystemHealth(): Promise<any>
  getSystemMetrics(): Promise<any>
  softDeleteEntity(entityType: string, fqn: string): Promise<any>
  hardDeleteEntity(entityType: string, fqn: string): Promise<any>
  restoreEntity(entityType: string, fqn: string): Promise<any>
  getDeletedEntities(entityType: string, params?: { limit?: number; offset?: number }): Promise<any>
  copyEntity(entityType: string, sourceFqn: string, targetFqn: string, options?: Record<string, any>): Promise<any>
  cloneEntity(entityType: string, sourceFqn: string, targetFqn: string, options?: Record<string, any>): Promise<any>
  getAuditLogs(params?: { limit?: number; offset?: number; entityType?: string; entityFqn?: string; userId?: string; startTs?: number; endTs?: number }): Promise<any>
  getEntityAuditLogs(entityType: string, fqn: string, params?: { limit?: number; offset?: number; startTs?: number; endTs?: number }): Promise<any>
  exportAuditLogs(params?: { startTs?: number; endTs?: number; format?: 'json' | 'csv' }): Promise<any>
  getAuthProviders(): Promise<any>
  getAuthProvider(providerId: string): Promise<any>
  createAuthProvider(data: any): Promise<any>
  updateAuthProvider(providerId: string, data: any): Promise<any>
}

export const openMetadataMethods5: Record<string, Function> & ThisType<any> = {
  async getDataLatency(entityType: string, fqn: string, params?: { startTs?: number; endTs?: number }) {
    return this.request(`/${entityType}/name/${encodeURIComponent(fqn)}/latency${this.buildQueryString(params)}`)
  },

  // Custom Properties
  async getCustomProperties(entityType: string) {
    return this.request(`/customProperties/${entityType}`)
  },

  async createCustomProperty(entityType: string, data: any) {
    return this.request(`/customProperties/${entityType}`, { method: 'POST', body: JSON.stringify(data) })
  },

  async updateCustomProperty(entityType: string, propertyName: string, data: any) {
    return this.request(`/customProperties/${entityType}/${propertyName}`, { method: 'PATCH', body: JSON.stringify(data) })
  },

  async deleteCustomProperty(entityType: string, propertyName: string) {
    return this.request(`/customProperties/${entityType}/${propertyName}`, { method: 'DELETE' })
  },

  // Suggestions
  async getSuggestions(query: string, entityType?: string) {
    const params: Record<string, any> = { q: query }
    if (entityType) params.entityType = entityType
    return this.request(`/search/suggest${this.buildQueryString(params)}`)
  },

  async getSearchFacets(params?: { entityType?: string; field?: string }) {
    return this.request(`/search/facets${this.buildQueryString(params)}`)
  },

  async getSearchAggregations(query: string, aggregations: string[], params?: Record<string, any>) {
    const searchParams = {
      q: query,
      aggregations: aggregations.join(','),
      ...params,
    }
    return this.request(`/search/aggregate${this.buildQueryString(searchParams)}`)
  },

  // Recommendations
  async getRecommendations(entityType: string, fqn: string) {
    return this.request(`/${entityType}/name/${encodeURIComponent(fqn)}/recommendations`)
  },

  async getGlobalRecommendations(params?: { limit?: number; offset?: number }) {
    return this.request(`/recommendations${this.buildQueryString(params)}`)
  },

  // KPIs & Goals
  async getKPIs(params?: { limit?: number; offset?: number }) {
    return this.request(`/kpis${this.buildQueryString(params)}`)
  },

  async getKPI(id: string) {
    return this.request(`/kpis/${id}`)
  },

  async createKPI(data: any) {
    return this.request('/kpis', { method: 'POST', body: JSON.stringify(data) })
  },

  async updateKPI(id: string, data: any) {
    return this.request(`/kpis/${id}`, { method: 'PATCH', body: JSON.stringify(data) })
  },

  async deleteKPI(id: string) {
    return this.request(`/kpis/${id}`, { method: 'DELETE' })
  },

  async getGoals(params?: { limit?: number; offset?: number }) {
    return this.request(`/goals${this.buildQueryString(params)}`)
  },

  async createGoal(data: any) {
    return this.request('/goals', { method: 'POST', body: JSON.stringify(data) })
  },

  async getGoal(id: string) {
    return this.request(`/goals/${id}`)
  },

  async updateGoal(id: string, data: any) {
    return this.request(`/goals/${id}`, { method: 'PATCH', body: JSON.stringify(data) })
  },

  async deleteGoal(id: string) {
    return this.request(`/goals/${id}`, { method: 'DELETE' })
  },

  // Data Contracts
  async getDataContracts(params?: { limit?: number; offset?: number; entityType?: string; entityFqn?: string }) {
    return this.request(`/dataContracts${this.buildQueryString(params)}`)
  },

  async getDataContract(id: string) {
    return this.request(`/dataContracts/${id}`)
  },

  async createDataContract(data: any) {
    return this.request('/dataContracts', { method: 'POST', body: JSON.stringify(data) })
  },

  async updateDataContract(id: string, data: any) {
    return this.request(`/dataContracts/${id}`, { method: 'PATCH', body: JSON.stringify(data) })
  },

  async deleteDataContract(id: string) {
    return this.request(`/dataContracts/${id}`, { method: 'DELETE' })
  },

  // Impact Analysis
  async getImpactAnalysis(entityType: string, fqn: string, params?: { depth?: number; direction?: 'upstream' | 'downstream' | 'both' }) {
    return this.request(`/${entityType}/name/${encodeURIComponent(fqn)}/impactAnalysis${this.buildQueryString(params)}`)
  },

  async getDownstreamImpact(entityType: string, fqn: string, depth: number = 1) {
    return this.getImpactAnalysis(entityType, fqn, { depth, direction: 'downstream' })
  },

  async getUpstreamImpact(entityType: string, fqn: string, depth: number = 1) {
    return this.getImpactAnalysis(entityType, fqn, { depth, direction: 'upstream' })
  },

  // Custom Metrics & Measurement Units
  async getMeasurementUnits(params?: { limit?: number; offset?: number }) {
    return this.request(`/measurementUnits${this.buildQueryString(params)}`)
  },

  async getMeasurementUnit(id: string) {
    return this.request(`/measurementUnits/${id}`)
  },

  async createMeasurementUnit(data: any) {
    return this.request('/measurementUnits', { method: 'POST', body: JSON.stringify(data) })
  },

  async updateMeasurementUnit(id: string, data: any) {
    return this.request(`/measurementUnits/${id}`, { method: 'PATCH', body: JSON.stringify(data) })
  },

  async deleteMeasurementUnit(id: string) {
    return this.request(`/measurementUnits/${id}`, { method: 'DELETE' })
  },

  // Batch Operations (Extended)
  async bulkDeleteEntities(entityType: string, fqns: string[]) {
    return this.request(`/${entityType}/bulkDelete`, {
      method: 'POST',
      body: JSON.stringify({ fqns }),
    })
  },

  async bulkUpdateDescriptions(entityType: string, updates: Array<{ fqn: string; description: string }>) {
    return this.request(`/${entityType}/descriptions`, {
      method: 'PUT',
      body: JSON.stringify({ updates }),
    })
  },

  async bulkUpdateOwnersExtended(entityType: string, updates: Array<{ fqn: string; owner: { id: string; type: string } }>) {
    return this.request(`/${entityType}/owners/bulk`, {
      method: 'PUT',
      body: JSON.stringify({ updates }),
    })
  },

  // Export/Import
  async exportMetadata(entityType: string, fqn: string, format: 'json' | 'yaml' = 'json') {
    return this.request(`/${entityType}/name/${encodeURIComponent(fqn)}/export?format=${format}`)
  },

  async importMetadata(entityType: string, data: any, format: 'json' | 'yaml' = 'json') {
    return this.request(`/${entityType}/import?format=${format}`, {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },

  async exportBulkMetadata(entityType: string, fqns: string[], format: 'json' | 'yaml' = 'json') {
    return this.request(`/${entityType}/export/bulk?format=${format}`, {
      method: 'POST',
      body: JSON.stringify({ fqns }),
    })
  },

  // Relationships
  async getRelationships(entityType: string, fqn: string, relationshipType?: string) {
    return this.request(`/${entityType}/name/${encodeURIComponent(fqn)}/relationships${relationshipType ? `?type=${relationshipType}` : ''}`)
  },

  async getRelationship(entityType: string, fqn: string, relationshipId: string) {
    return this.request(`/${entityType}/name/${encodeURIComponent(fqn)}/relationships/${relationshipId}`)
  },

  async createRelationship(entityType: string, fqn: string, relationshipData: any) {
    return this.request(`/${entityType}/name/${encodeURIComponent(fqn)}/relationships`, {
      method: 'POST',
      body: JSON.stringify(relationshipData),
    })
  },

  async updateRelationship(entityType: string, fqn: string, relationshipId: string, relationshipData: any) {
    return this.request(`/${entityType}/name/${encodeURIComponent(fqn)}/relationships/${relationshipId}`, {
      method: 'PATCH',
      body: JSON.stringify(relationshipData),
    })
  },

  async deleteRelationship(entityType: string, fqn: string, relationshipId: string) {
    return this.request(`/${entityType}/name/${encodeURIComponent(fqn)}/relationships/${relationshipId}`, {
      method: 'DELETE',
    })
  },

  // Validations
  async validateEntity(entityType: string, fqn: string) {
    return this.request(`/${entityType}/name/${encodeURIComponent(fqn)}/validate`, { method: 'POST' })
  },

  async validateBulkEntities(entityType: string, fqns: string[]) {
    return this.request(`/${entityType}/validate/bulk`, {
      method: 'POST',
      body: JSON.stringify({ fqns }),
    })
  },

  // Metadata Operations
  async getMetadataOperations(entityType: string, fqn: string) {
    return this.request(`/${entityType}/name/${encodeURIComponent(fqn)}/operations`)
  },

  async executeMetadataOperation(entityType: string, fqn: string, operation: string, params?: Record<string, any>) {
    return this.request(`/${entityType}/name/${encodeURIComponent(fqn)}/operations/${operation}`, {
      method: 'POST',
      body: JSON.stringify(params || {}),
    })
  },

  // System
  async getSystemVersion() {
    return this.request('/system/version')
  },

  async getSystemConfig() {
    return this.request('/system/config')
  },

  async getSystemTime() {
    return this.request('/system/time')
  },

  async getSystemHealth() {
    return this.request('/system/health')
  },

  async getSystemMetrics() {
    return this.request('/system/metrics')
  },

  // Soft Delete & Restore (Generic)
  async softDeleteEntity(entityType: string, fqn: string) {
    return this.request(`/${entityType}/name/${encodeURIComponent(fqn)}`, {
      method: 'DELETE',
      headers: { 'X-Delete-Type': 'soft' },
    })
  },

  async hardDeleteEntity(entityType: string, fqn: string) {
    return this.request(`/${entityType}/name/${encodeURIComponent(fqn)}`, {
      method: 'DELETE',
      headers: { 'X-Delete-Type': 'hard' },
    })
  },

  async restoreEntity(entityType: string, fqn: string) {
    return this.request(`/${entityType}/name/${encodeURIComponent(fqn)}/restore`, { method: 'PUT' })
  },

  async getDeletedEntities(entityType: string, params?: { limit?: number; offset?: number }) {
    return this.request(`/${entityType}?deleted=true${this.buildQueryString(params)}`)
  },

  // Copy & Clone Operations
  async copyEntity(entityType: string, sourceFqn: string, targetFqn: string, options?: Record<string, any>) {
    return this.request(`/${entityType}/name/${encodeURIComponent(sourceFqn)}/copy`, {
      method: 'POST',
      body: JSON.stringify({ targetFqn, ...options }),
    })
  },

  async cloneEntity(entityType: string, sourceFqn: string, targetFqn: string, options?: Record<string, any>) {
    return this.request(`/${entityType}/name/${encodeURIComponent(sourceFqn)}/clone`, {
      method: 'POST',
      body: JSON.stringify({ targetFqn, ...options }),
    })
  },

  // Audit & Logging
  async getAuditLogs(params?: { limit?: number; offset?: number; entityType?: string; entityFqn?: string; userId?: string; startTs?: number; endTs?: number }) {
    return this.request(`/auditLogs${this.buildQueryString(params)}`)
  },

  async getEntityAuditLogs(entityType: string, fqn: string, params?: { limit?: number; offset?: number; startTs?: number; endTs?: number }) {
    return this.request(`/${entityType}/name/${encodeURIComponent(fqn)}/auditLogs${this.buildQueryString(params)}`)
  },

  async exportAuditLogs(params?: { startTs?: number; endTs?: number; format?: 'json' | 'csv' }) {
    return this.request(`/auditLogs/export${this.buildQueryString(params)}`)
  },

  // Authentication & SSO
  async getAuthProviders() {
    return this.request('/auth/providers')
  },

  async getAuthProvider(providerId: string) {
    return this.request(`/auth/providers/${providerId}`)
  },

  async createAuthProvider(data: any) {
    return this.request('/auth/providers', { method: 'POST', body: JSON.stringify(data) })
  },

  async updateAuthProvider(providerId: string, data: any) {
    return this.request(`/auth/providers/${providerId}`, { method: 'PATCH', body: JSON.stringify(data) })
  },
}
