export interface OpenMetadataMethods3 {
  getMessagingServices(params?: { limit?: number; offset?: number }): Promise<any>
  getMessagingService(fqn: string): Promise<any>
  createMessagingService(data: any): Promise<any>
  updateMessagingService(fqn: string, data: any): Promise<any>
  deleteMessagingService(fqn: string): Promise<any>
  getMetadataServices(params?: { limit?: number; offset?: number }): Promise<any>
  getMetadataService(fqn: string): Promise<any>
  createMetadataService(data: any): Promise<any>
  updateMetadataService(fqn: string, data: any): Promise<any>
  deleteMetadataService(fqn: string): Promise<any>
  createDatabaseService(data: any): Promise<any>
  updateDatabaseService(fqn: string, data: any): Promise<any>
  deleteDatabaseService(fqn: string): Promise<any>
  testDatabaseConnection(serviceFqn: string): Promise<any>
  testDashboardConnection(serviceFqn: string): Promise<any>
  testPipelineConnection(serviceFqn: string): Promise<any>
  testMessagingConnection(serviceFqn: string): Promise<any>
  testMetadataConnection(serviceFqn: string): Promise<any>
  search(query: string, filters?: Record<string, any>, params?: { limit?: number; offset?: number }): Promise<any>
  getFeed(entityType: string, fqn: string, params?: { limit?: number; offset?: number }): Promise<any>
  createThread(entityType: string, fqn: string, data: any): Promise<any>
  postReply(entityType: string, fqn: string, threadId: string, data: any): Promise<any>
  updateThread(entityType: string, fqn: string, threadId: string, data: any): Promise<any>
  deleteThread(entityType: string, fqn: string, threadId: string): Promise<any>
  updatePost(entityType: string, fqn: string, threadId: string, postId: string, data: any): Promise<any>
  deletePost(entityType: string, fqn: string, threadId: string, postId: string): Promise<any>
  getVersions(entityType: string, fqn: string, params?: { limit?: number; offset?: number }): Promise<any>
  getVersion(entityType: string, fqn: string, version: string): Promise<any>
  patchVersion(entityType: string, fqn: string, version: string, data: any): Promise<any>
  compareVersions(entityType: string, fqn: string, version1: string, version2: string): Promise<any>
  getIngestionPipelines(params?: { limit?: number; offset?: number }): Promise<any>
  getIngestionPipeline(id: string): Promise<any>
  createIngestionPipeline(data: any): Promise<any>
  updateIngestionPipeline(id: string, data: any): Promise<any>
  deleteIngestionPipeline(id: string): Promise<any>
  triggerIngestionPipeline(id: string): Promise<any>
  getIngestionPipelineStatus(id: string): Promise<any>
  enableIngestionPipeline(id: string): Promise<any>
  disableIngestionPipeline(id: string): Promise<any>
  pauseIngestionPipeline(id: string): Promise<any>
  resumeIngestionPipeline(id: string): Promise<any>
  getWebhooks(params?: { limit?: number; offset?: number }): Promise<any>
  getWebhook(id: string): Promise<any>
  createWebhook(data: any): Promise<any>
  updateWebhook(id: string, data: any): Promise<any>
  deleteWebhook(id: string): Promise<any>
  testWebhook(id: string): Promise<any>
  getWorkflows(params?: { limit?: number; offset?: number }): Promise<any>
  getWorkflow(id: string): Promise<any>
  createWorkflow(data: any): Promise<any>
  updateWorkflow(id: string, data: any): Promise<any>
  deleteWorkflow(id: string): Promise<any>
  runWorkflow(id: string): Promise<any>
  pauseWorkflow(id: string): Promise<any>
  resumeWorkflow(id: string): Promise<any>
  getWorkflowStatus(id: string): Promise<any>
  getContainers(params?: { limit?: number; offset?: number }): Promise<any>
  getContainer(fqn: string): Promise<any>
  createContainer(data: any): Promise<any>
  updateContainer(fqn: string, data: any): Promise<any>
  deleteContainer(fqn: string): Promise<any>
  getStoredProcedures(params?: { limit?: number; offset?: number }): Promise<any>
  getStoredProcedure(fqn: string): Promise<any>
  createStoredProcedure(data: any): Promise<any>
  updateStoredProcedure(fqn: string, data: any): Promise<any>
  deleteStoredProcedure(fqn: string): Promise<any>
  getDatabaseSchemas(databaseFqn: string): Promise<any>
  getDatabaseSchema(fqn: string): Promise<any>
  createDatabaseSchema(data: any): Promise<any>
  updateDatabaseSchema(fqn: string, data: any): Promise<any>
  deleteDatabaseSchema(fqn: string): Promise<any>
  getMetrics(params?: { limit?: number; offset?: number }): Promise<any>
  getMetric(fqn: string): Promise<any>
  createMetric(data: any): Promise<any>
}

export const openMetadataMethods3: Record<string, Function> & ThisType<any> = {
  async getMessagingServices(params?: { limit?: number; offset?: number }) {
    return this.request(`/services/messagingServices${this.buildQueryString(params)}`)
  },

  async getMessagingService(fqn: string) {
    return this.request(`/services/messagingServices/name/${encodeURIComponent(fqn)}`)
  },

  async createMessagingService(data: any) {
    return this.request('/services/messagingServices', { method: 'POST', body: JSON.stringify(data) })
  },

  async updateMessagingService(fqn: string, data: any) {
    return this.request(`/services/messagingServices/name/${encodeURIComponent(fqn)}`, { method: 'PATCH', body: JSON.stringify(data) })
  },

  async deleteMessagingService(fqn: string) {
    return this.request(`/services/messagingServices/name/${encodeURIComponent(fqn)}`, { method: 'DELETE' })
  },

  async getMetadataServices(params?: { limit?: number; offset?: number }) {
    return this.request(`/services/metadataServices${this.buildQueryString(params)}`)
  },

  async getMetadataService(fqn: string) {
    return this.request(`/services/metadataServices/name/${encodeURIComponent(fqn)}`)
  },

  async createMetadataService(data: any) {
    return this.request('/services/metadataServices', { method: 'POST', body: JSON.stringify(data) })
  },

  async updateMetadataService(fqn: string, data: any) {
    return this.request(`/services/metadataServices/name/${encodeURIComponent(fqn)}`, { method: 'PATCH', body: JSON.stringify(data) })
  },

  async deleteMetadataService(fqn: string) {
    return this.request(`/services/metadataServices/name/${encodeURIComponent(fqn)}`, { method: 'DELETE' })
  },

  async createDatabaseService(data: any) {
    return this.request('/services/databaseServices', { method: 'POST', body: JSON.stringify(data) })
  },

  async updateDatabaseService(fqn: string, data: any) {
    return this.request(`/services/databaseServices/name/${encodeURIComponent(fqn)}`, { method: 'PATCH', body: JSON.stringify(data) })
  },

  async deleteDatabaseService(fqn: string) {
    return this.request(`/services/databaseServices/name/${encodeURIComponent(fqn)}`, { method: 'DELETE' })
  },

  async testDatabaseConnection(serviceFqn: string) {
    return this.request(`/services/databaseServices/name/${encodeURIComponent(serviceFqn)}/testConnection`, { method: 'POST' })
  },

  async testDashboardConnection(serviceFqn: string) {
    return this.request(`/services/dashboardServices/name/${encodeURIComponent(serviceFqn)}/testConnection`, { method: 'POST' })
  },

  async testPipelineConnection(serviceFqn: string) {
    return this.request(`/services/pipelineServices/name/${encodeURIComponent(serviceFqn)}/testConnection`, { method: 'POST' })
  },

  async testMessagingConnection(serviceFqn: string) {
    return this.request(`/services/messagingServices/name/${encodeURIComponent(serviceFqn)}/testConnection`, { method: 'POST' })
  },

  async testMetadataConnection(serviceFqn: string) {
    return this.request(`/services/metadataServices/name/${encodeURIComponent(serviceFqn)}/testConnection`, { method: 'POST' })
  },

  // Search
  async search(query: string, filters?: Record<string, any>, params?: { limit?: number; offset?: number }) {
    const searchParams = {
      q: query,
      ...filters,
      ...params,
    }
    return this.request(`/search/query${this.buildQueryString(searchParams)}`)
  },

  // Activity Feed
  async getFeed(entityType: string, fqn: string, params?: { limit?: number; offset?: number }) {
    return this.request(`/${entityType}/name/${encodeURIComponent(fqn)}/feed${this.buildQueryString(params)}`)
  },

  async createThread(entityType: string, fqn: string, data: any) {
    return this.request(`/${entityType}/name/${encodeURIComponent(fqn)}/feed`, {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },

  async postReply(entityType: string, fqn: string, threadId: string, data: any) {
    return this.request(`/${entityType}/name/${encodeURIComponent(fqn)}/feed/${threadId}/posts`, {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },

  async updateThread(entityType: string, fqn: string, threadId: string, data: any) {
    return this.request(`/${entityType}/name/${encodeURIComponent(fqn)}/feed/${threadId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    })
  },

  async deleteThread(entityType: string, fqn: string, threadId: string) {
    return this.request(`/${entityType}/name/${encodeURIComponent(fqn)}/feed/${threadId}`, {
      method: 'DELETE',
    })
  },

  async updatePost(entityType: string, fqn: string, threadId: string, postId: string, data: any) {
    return this.request(`/${entityType}/name/${encodeURIComponent(fqn)}/feed/${threadId}/posts/${postId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    })
  },

  async deletePost(entityType: string, fqn: string, threadId: string, postId: string) {
    return this.request(`/${entityType}/name/${encodeURIComponent(fqn)}/feed/${threadId}/posts/${postId}`, {
      method: 'DELETE',
    })
  },

  // Version History
  async getVersions(entityType: string, fqn: string, params?: { limit?: number; offset?: number }) {
    return this.request(`/${entityType}/name/${encodeURIComponent(fqn)}/versions${this.buildQueryString(params)}`)
  },

  async getVersion(entityType: string, fqn: string, version: string) {
    return this.request(`/${entityType}/name/${encodeURIComponent(fqn)}/versions/${version}`)
  },

  async patchVersion(entityType: string, fqn: string, version: string, data: any) {
    return this.request(`/${entityType}/name/${encodeURIComponent(fqn)}/versions/${version}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    })
  },

  async compareVersions(entityType: string, fqn: string, version1: string, version2: string) {
    return this.request(`/${entityType}/name/${encodeURIComponent(fqn)}/versions/${version1}/compare/${version2}`)
  },

  // Ingestion & Connectors
  async getIngestionPipelines(params?: { limit?: number; offset?: number }) {
    return this.request(`/services/ingestionPipelines${this.buildQueryString(params)}`)
  },

  async getIngestionPipeline(id: string) {
    return this.request(`/services/ingestionPipelines/${id}`)
  },

  async createIngestionPipeline(data: any) {
    return this.request('/services/ingestionPipelines', { method: 'POST', body: JSON.stringify(data) })
  },

  async updateIngestionPipeline(id: string, data: any) {
    return this.request(`/services/ingestionPipelines/${id}`, { method: 'PATCH', body: JSON.stringify(data) })
  },

  async deleteIngestionPipeline(id: string) {
    return this.request(`/services/ingestionPipelines/${id}`, { method: 'DELETE' })
  },

  async triggerIngestionPipeline(id: string) {
    return this.request(`/services/ingestionPipelines/trigger/${id}`, { method: 'POST' })
  },

  async getIngestionPipelineStatus(id: string) {
    return this.request(`/services/ingestionPipelines/status/${id}`)
  },

  async enableIngestionPipeline(id: string) {
    return this.request(`/services/ingestionPipelines/${id}/enable`, { method: 'PUT' })
  },

  async disableIngestionPipeline(id: string) {
    return this.request(`/services/ingestionPipelines/${id}/disable`, { method: 'PUT' })
  },

  async pauseIngestionPipeline(id: string) {
    return this.request(`/services/ingestionPipelines/${id}/pause`, { method: 'PUT' })
  },

  async resumeIngestionPipeline(id: string) {
    return this.request(`/services/ingestionPipelines/${id}/resume`, { method: 'PUT' })
  },

  // Webhooks & Alerts
  async getWebhooks(params?: { limit?: number; offset?: number }) {
    return this.request(`/webhooks${this.buildQueryString(params)}`)
  },

  async getWebhook(id: string) {
    return this.request(`/webhooks/${id}`)
  },

  async createWebhook(data: any) {
    return this.request('/webhooks', { method: 'POST', body: JSON.stringify(data) })
  },

  async updateWebhook(id: string, data: any) {
    return this.request(`/webhooks/${id}`, { method: 'PATCH', body: JSON.stringify(data) })
  },

  async deleteWebhook(id: string) {
    return this.request(`/webhooks/${id}`, { method: 'DELETE' })
  },

  async testWebhook(id: string) {
    return this.request(`/webhooks/${id}/test`, { method: 'POST' })
  },

  // Workflows
  async getWorkflows(params?: { limit?: number; offset?: number }) {
    return this.request(`/workflows${this.buildQueryString(params)}`)
  },

  async getWorkflow(id: string) {
    return this.request(`/workflows/${id}`)
  },

  async createWorkflow(data: any) {
    return this.request('/workflows', { method: 'POST', body: JSON.stringify(data) })
  },

  async updateWorkflow(id: string, data: any) {
    return this.request(`/workflows/${id}`, { method: 'PATCH', body: JSON.stringify(data) })
  },

  async deleteWorkflow(id: string) {
    return this.request(`/workflows/${id}`, { method: 'DELETE' })
  },

  async runWorkflow(id: string) {
    return this.request(`/workflows/${id}/run`, { method: 'POST' })
  },

  async pauseWorkflow(id: string) {
    return this.request(`/workflows/${id}/pause`, { method: 'POST' })
  },

  async resumeWorkflow(id: string) {
    return this.request(`/workflows/${id}/resume`, { method: 'POST' })
  },

  async getWorkflowStatus(id: string) {
    return this.request(`/workflows/${id}/status`)
  },

  // Additional Entity Types
  async getContainers(params?: { limit?: number; offset?: number }) {
    return this.request(`/containers${this.buildQueryString(params)}`)
  },

  async getContainer(fqn: string) {
    return this.request(`/containers/name/${encodeURIComponent(fqn)}`)
  },

  async createContainer(data: any) {
    return this.request('/containers', { method: 'POST', body: JSON.stringify(data) })
  },

  async updateContainer(fqn: string, data: any) {
    return this.request(`/containers/name/${encodeURIComponent(fqn)}`, { method: 'PATCH', body: JSON.stringify(data) })
  },

  async deleteContainer(fqn: string) {
    return this.request(`/containers/name/${encodeURIComponent(fqn)}`, { method: 'DELETE' })
  },

  async getStoredProcedures(params?: { limit?: number; offset?: number }) {
    return this.request(`/storedProcedures${this.buildQueryString(params)}`)
  },

  async getStoredProcedure(fqn: string) {
    return this.request(`/storedProcedures/name/${encodeURIComponent(fqn)}`)
  },

  async createStoredProcedure(data: any) {
    return this.request('/storedProcedures', { method: 'POST', body: JSON.stringify(data) })
  },

  async updateStoredProcedure(fqn: string, data: any) {
    return this.request(`/storedProcedures/name/${encodeURIComponent(fqn)}`, { method: 'PATCH', body: JSON.stringify(data) })
  },

  async deleteStoredProcedure(fqn: string) {
    return this.request(`/storedProcedures/name/${encodeURIComponent(fqn)}`, { method: 'DELETE' })
  },

  async getDatabaseSchemas(databaseFqn: string) {
    return this.request(`/databases/name/${encodeURIComponent(databaseFqn)}/databaseSchemas`)
  },

  async getDatabaseSchema(fqn: string) {
    return this.request(`/databaseSchemas/name/${encodeURIComponent(fqn)}`)
  },

  async createDatabaseSchema(data: any) {
    return this.request('/databaseSchemas', { method: 'POST', body: JSON.stringify(data) })
  },

  async updateDatabaseSchema(fqn: string, data: any) {
    return this.request(`/databaseSchemas/name/${encodeURIComponent(fqn)}`, { method: 'PATCH', body: JSON.stringify(data) })
  },

  async deleteDatabaseSchema(fqn: string) {
    return this.request(`/databaseSchemas/name/${encodeURIComponent(fqn)}`, { method: 'DELETE' })
  },

  async getMetrics(params?: { limit?: number; offset?: number }) {
    return this.request(`/metrics${this.buildQueryString(params)}`)
  },

  async getMetric(fqn: string) {
    return this.request(`/metrics/name/${encodeURIComponent(fqn)}`)
  },

  async createMetric(data: any) {
    return this.request('/metrics', { method: 'POST', body: JSON.stringify(data) })
  },
}
