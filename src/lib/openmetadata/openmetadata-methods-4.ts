export interface OpenMetadataMethods4 {
  updateMetric(fqn: string, data: any): Promise<any>
  deleteMetric(fqn: string): Promise<any>
  getReports(params?: { limit?: number; offset?: number }): Promise<any>
  getReport(fqn: string): Promise<any>
  createReport(data: any): Promise<any>
  updateReport(fqn: string, data: any): Promise<any>
  deleteReport(fqn: string): Promise<any>
  getDataProducts(params?: { limit?: number; offset?: number }): Promise<any>
  getDataProduct(fqn: string): Promise<any>
  createDataProduct(data: any): Promise<any>
  updateDataProduct(fqn: string, data: any): Promise<any>
  deleteDataProduct(fqn: string): Promise<any>
  getDomains(params?: { limit?: number; offset?: number }): Promise<any>
  getDomain(fqn: string): Promise<any>
  createDomain(data: any): Promise<any>
  updateDomain(fqn: string, data: any): Promise<any>
  deleteDomain(fqn: string): Promise<any>
  getCharts(params?: { limit?: number; offset?: number }): Promise<any>
  getChart(fqn: string): Promise<any>
  createChart(data: any): Promise<any>
  updateChart(fqn: string, data: any): Promise<any>
  deleteChart(fqn: string): Promise<any>
  getDashboardDataModels(params?: { limit?: number; offset?: number }): Promise<any>
  getDashboardDataModel(fqn: string): Promise<any>
  createDashboardDataModel(data: any): Promise<any>
  updateDashboardDataModel(fqn: string, data: any): Promise<any>
  deleteDashboardDataModel(fqn: string): Promise<any>
  getTasks(params?: { limit?: number; offset?: number; status?: string; assignee?: string }): Promise<any>
  getTask(id: string): Promise<any>
  createTask(data: any): Promise<any>
  updateTask(id: string, data: any): Promise<any>
  resolveTask(id: string, resolution: any): Promise<any>
  closeTask(id: string): Promise<any>
  getAnnouncements(params?: { limit?: number; offset?: number; active?: boolean }): Promise<any>
  getAnnouncement(id: string): Promise<any>
  createAnnouncement(data: any): Promise<any>
  updateAnnouncement(id: string, data: any): Promise<any>
  deleteAnnouncement(id: string): Promise<any>
  getEventSubscriptions(params?: { limit?: number; offset?: number }): Promise<any>
  getEventSubscription(id: string): Promise<any>
  createEventSubscription(data: any): Promise<any>
  updateEventSubscription(id: string, data: any): Promise<any>
  deleteEventSubscription(id: string): Promise<any>
  getNotifications(params?: { limit?: number; offset?: number; read?: boolean }): Promise<any>
  markNotificationAsRead(id: string): Promise<any>
  markAllNotificationsAsRead(): Promise<any>
  deleteNotification(id: string): Promise<any>
  getTopicSchemas(topicFqn: string): Promise<any>
  createTopicSchema(topicFqn: string, schemaData: any): Promise<any>
  updateTopicSchema(topicFqn: string, schemaId: string, schemaData: any): Promise<any>
  deleteTopicSchema(topicFqn: string, schemaId: string): Promise<any>
  getTopicSchema(topicFqn: string, schemaId: string): Promise<any>
  getPipelineTasks(pipelineFqn: string): Promise<any>
  getPipelineTask(pipelineFqn: string, taskId: string): Promise<any>
  getDashboardCharts(dashboardFqn: string): Promise<any>
  searchByField(field: string, value: string, entityType?: string, params?: { limit?: number; offset?: number }): Promise<any>
  searchByTag(tagFqn: string, params?: { limit?: number; offset?: number }): Promise<any>
  searchByOwner(owner: string, params?: { limit?: number; offset?: number }): Promise<any>
  searchByDomain(domain: string, params?: { limit?: number; offset?: number }): Promise<any>
  bulkUpdateTags(entityType: string, fqns: string[], tagFqn: string): Promise<any>
  bulkUpdateOwners(entityType: string, fqns: string[], owner: { id: string; type: string }): Promise<any>
  getDataInsights(params?: { startTs?: number; endTs?: number }): Promise<any>
  getAggregatedDataInsights(params?: { startTs?: number; endTs?: number }): Promise<any>
  getDataInsightReport(reportId: string): Promise<any>
  createDataInsightReport(data: any): Promise<any>
  updateDataInsightReport(reportId: string, data: any): Promise<any>
  deleteDataInsightReport(reportId: string): Promise<any>
  getUsageStatistics(entityType: string, fqn: string, params?: { limit?: number; startTs?: number; endTs?: number }): Promise<any>
  getAggregatedUsageStatistics(entityType: string, fqn: string, params?: { startTs?: number; endTs?: number }): Promise<any>
  getDataObservabilityMetrics(entityType: string, fqn: string, params?: { startTs?: number; endTs?: number }): Promise<any>
  getDataFreshness(entityType: string, fqn: string): Promise<any>
  getDataVolume(entityType: string, fqn: string, params?: { startTs?: number; endTs?: number }): Promise<any>
}

export const openMetadataMethods4: Record<string, Function> & ThisType<any> = {
  async updateMetric(fqn: string, data: any) {
    return this.request(`/metrics/name/${encodeURIComponent(fqn)}`, { method: 'PATCH', body: JSON.stringify(data) })
  },

  async deleteMetric(fqn: string) {
    return this.request(`/metrics/name/${encodeURIComponent(fqn)}`, { method: 'DELETE' })
  },

  async getReports(params?: { limit?: number; offset?: number }) {
    return this.request(`/reports${this.buildQueryString(params)}`)
  },

  async getReport(fqn: string) {
    return this.request(`/reports/name/${encodeURIComponent(fqn)}`)
  },

  async createReport(data: any) {
    return this.request('/reports', { method: 'POST', body: JSON.stringify(data) })
  },

  async updateReport(fqn: string, data: any) {
    return this.request(`/reports/name/${encodeURIComponent(fqn)}`, { method: 'PATCH', body: JSON.stringify(data) })
  },

  async deleteReport(fqn: string) {
    return this.request(`/reports/name/${encodeURIComponent(fqn)}`, { method: 'DELETE' })
  },

  async getDataProducts(params?: { limit?: number; offset?: number }) {
    return this.request(`/dataProducts${this.buildQueryString(params)}`)
  },

  async getDataProduct(fqn: string) {
    return this.request(`/dataProducts/name/${encodeURIComponent(fqn)}`)
  },

  async createDataProduct(data: any) {
    return this.request('/dataProducts', { method: 'POST', body: JSON.stringify(data) })
  },

  async updateDataProduct(fqn: string, data: any) {
    return this.request(`/dataProducts/name/${encodeURIComponent(fqn)}`, { method: 'PATCH', body: JSON.stringify(data) })
  },

  async deleteDataProduct(fqn: string) {
    return this.request(`/dataProducts/name/${encodeURIComponent(fqn)}`, { method: 'DELETE' })
  },

  // Domains
  async getDomains(params?: { limit?: number; offset?: number }) {
    return this.request(`/domains${this.buildQueryString(params)}`)
  },

  async getDomain(fqn: string) {
    return this.request(`/domains/name/${encodeURIComponent(fqn)}`)
  },

  async createDomain(data: any) {
    return this.request('/domains', { method: 'POST', body: JSON.stringify(data) })
  },

  async updateDomain(fqn: string, data: any) {
    return this.request(`/domains/name/${encodeURIComponent(fqn)}`, { method: 'PATCH', body: JSON.stringify(data) })
  },

  async deleteDomain(fqn: string) {
    return this.request(`/domains/name/${encodeURIComponent(fqn)}`, { method: 'DELETE' })
  },

  // Charts
  async getCharts(params?: { limit?: number; offset?: number }) {
    return this.request(`/charts${this.buildQueryString(params)}`)
  },

  async getChart(fqn: string) {
    return this.request(`/charts/name/${encodeURIComponent(fqn)}`)
  },

  async createChart(data: any) {
    return this.request('/charts', { method: 'POST', body: JSON.stringify(data) })
  },

  async updateChart(fqn: string, data: any) {
    return this.request(`/charts/name/${encodeURIComponent(fqn)}`, { method: 'PATCH', body: JSON.stringify(data) })
  },

  async deleteChart(fqn: string) {
    return this.request(`/charts/name/${encodeURIComponent(fqn)}`, { method: 'DELETE' })
  },

  // Dashboard Data Models
  async getDashboardDataModels(params?: { limit?: number; offset?: number }) {
    return this.request(`/dashboardDataModels${this.buildQueryString(params)}`)
  },

  async getDashboardDataModel(fqn: string) {
    return this.request(`/dashboardDataModels/name/${encodeURIComponent(fqn)}`)
  },

  async createDashboardDataModel(data: any) {
    return this.request('/dashboardDataModels', { method: 'POST', body: JSON.stringify(data) })
  },

  async updateDashboardDataModel(fqn: string, data: any) {
    return this.request(`/dashboardDataModels/name/${encodeURIComponent(fqn)}`, { method: 'PATCH', body: JSON.stringify(data) })
  },

  async deleteDashboardDataModel(fqn: string) {
    return this.request(`/dashboardDataModels/name/${encodeURIComponent(fqn)}`, { method: 'DELETE' })
  },

  // Tasks
  async getTasks(params?: { limit?: number; offset?: number; status?: string; assignee?: string }) {
    return this.request(`/tasks${this.buildQueryString(params)}`)
  },

  async getTask(id: string) {
    return this.request(`/tasks/${id}`)
  },

  async createTask(data: any) {
    return this.request('/tasks', { method: 'POST', body: JSON.stringify(data) })
  },

  async updateTask(id: string, data: any) {
    return this.request(`/tasks/${id}`, { method: 'PATCH', body: JSON.stringify(data) })
  },

  async resolveTask(id: string, resolution: any) {
    return this.request(`/tasks/${id}/resolve`, { method: 'POST', body: JSON.stringify(resolution) })
  },

  async closeTask(id: string) {
    return this.request(`/tasks/${id}/close`, { method: 'POST' })
  },

  // Announcements
  async getAnnouncements(params?: { limit?: number; offset?: number; active?: boolean }) {
    return this.request(`/announcements${this.buildQueryString(params)}`)
  },

  async getAnnouncement(id: string) {
    return this.request(`/announcements/${id}`)
  },

  async createAnnouncement(data: any) {
    return this.request('/announcements', { method: 'POST', body: JSON.stringify(data) })
  },

  async updateAnnouncement(id: string, data: any) {
    return this.request(`/announcements/${id}`, { method: 'PATCH', body: JSON.stringify(data) })
  },

  async deleteAnnouncement(id: string) {
    return this.request(`/announcements/${id}`, { method: 'DELETE' })
  },

  // Event Subscriptions
  async getEventSubscriptions(params?: { limit?: number; offset?: number }) {
    return this.request(`/eventSubscriptions${this.buildQueryString(params)}`)
  },

  async getEventSubscription(id: string) {
    return this.request(`/eventSubscriptions/${id}`)
  },

  async createEventSubscription(data: any) {
    return this.request('/eventSubscriptions', { method: 'POST', body: JSON.stringify(data) })
  },

  async updateEventSubscription(id: string, data: any) {
    return this.request(`/eventSubscriptions/${id}`, { method: 'PATCH', body: JSON.stringify(data) })
  },

  async deleteEventSubscription(id: string) {
    return this.request(`/eventSubscriptions/${id}`, { method: 'DELETE' })
  },

  // Notifications
  async getNotifications(params?: { limit?: number; offset?: number; read?: boolean }) {
    return this.request(`/notifications${this.buildQueryString(params)}`)
  },

  async markNotificationAsRead(id: string) {
    return this.request(`/notifications/${id}/read`, { method: 'POST' })
  },

  async markAllNotificationsAsRead() {
    return this.request('/notifications/read/all', { method: 'POST' })
  },

  async deleteNotification(id: string) {
    return this.request(`/notifications/${id}`, { method: 'DELETE' })
  },

  // Topic Schemas
  async getTopicSchemas(topicFqn: string) {
    return this.request(`/topics/name/${encodeURIComponent(topicFqn)}/schemas`)
  },

  async createTopicSchema(topicFqn: string, schemaData: any) {
    return this.request(`/topics/name/${encodeURIComponent(topicFqn)}/schemas`, {
      method: 'POST',
      body: JSON.stringify(schemaData),
    })
  },

  async updateTopicSchema(topicFqn: string, schemaId: string, schemaData: any) {
    return this.request(`/topics/name/${encodeURIComponent(topicFqn)}/schemas/${schemaId}`, {
      method: 'PATCH',
      body: JSON.stringify(schemaData),
    })
  },

  async deleteTopicSchema(topicFqn: string, schemaId: string) {
    return this.request(`/topics/name/${encodeURIComponent(topicFqn)}/schemas/${schemaId}`, {
      method: 'DELETE',
    })
  },

  async getTopicSchema(topicFqn: string, schemaId: string) {
    return this.request(`/topics/name/${encodeURIComponent(topicFqn)}/schemas/${schemaId}`)
  },

  // Pipeline Tasks
  async getPipelineTasks(pipelineFqn: string) {
    return this.request(`/pipelines/name/${encodeURIComponent(pipelineFqn)}/tasks`)
  },

  async getPipelineTask(pipelineFqn: string, taskId: string) {
    return this.request(`/pipelines/name/${encodeURIComponent(pipelineFqn)}/tasks/${taskId}`)
  },

  // Dashboard Charts
  async getDashboardCharts(dashboardFqn: string) {
    return this.request(`/dashboards/name/${encodeURIComponent(dashboardFqn)}/charts`)
  },

  // Advanced Search
  async searchByField(field: string, value: string, entityType?: string, params?: { limit?: number; offset?: number }) {
    const searchParams = {
      [field]: value,
      ...(entityType && { entityType }),
      ...params,
    }
    return this.request(`/search/query${this.buildQueryString(searchParams)}`)
  },

  async searchByTag(tagFqn: string, params?: { limit?: number; offset?: number }) {
    return this.searchByField('tags', tagFqn, undefined, params)
  },

  async searchByOwner(owner: string, params?: { limit?: number; offset?: number }) {
    return this.searchByField('owner', owner, undefined, params)
  },

  async searchByDomain(domain: string, params?: { limit?: number; offset?: number }) {
    return this.searchByField('domain', domain, undefined, params)
  },

  // Bulk Operations
  async bulkUpdateTags(entityType: string, fqns: string[], tagFqn: string) {
    return this.request(`/${entityType}/tags`, {
      method: 'PUT',
      body: JSON.stringify({
        fqns,
        tags: [{ tagFQN: tagFqn }],
      }),
    })
  },

  async bulkUpdateOwners(entityType: string, fqns: string[], owner: { id: string; type: string }) {
    return this.request(`/${entityType}/owners`, {
      method: 'PUT',
      body: JSON.stringify({
        fqns,
        owners: [owner],
      }),
    })
  },

  // Data Insights & Analytics
  async getDataInsights(params?: { startTs?: number; endTs?: number }) {
    return this.request(`/analytics/dataInsights${this.buildQueryString(params)}`)
  },

  async getAggregatedDataInsights(params?: { startTs?: number; endTs?: number }) {
    return this.request(`/analytics/aggregated/dataInsights${this.buildQueryString(params)}`)
  },

  async getDataInsightReport(reportId: string) {
    return this.request(`/analytics/dataInsights/reports/${reportId}`)
  },

  async createDataInsightReport(data: any) {
    return this.request('/analytics/dataInsights/reports', { method: 'POST', body: JSON.stringify(data) })
  },

  async updateDataInsightReport(reportId: string, data: any) {
    return this.request(`/analytics/dataInsights/reports/${reportId}`, { method: 'PATCH', body: JSON.stringify(data) })
  },

  async deleteDataInsightReport(reportId: string) {
    return this.request(`/analytics/dataInsights/reports/${reportId}`, { method: 'DELETE' })
  },

  // Usage Statistics
  async getUsageStatistics(entityType: string, fqn: string, params?: { limit?: number; startTs?: number; endTs?: number }) {
    return this.request(`/${entityType}/name/${encodeURIComponent(fqn)}/usage${this.buildQueryString(params)}`)
  },

  async getAggregatedUsageStatistics(entityType: string, fqn: string, params?: { startTs?: number; endTs?: number }) {
    return this.request(`/${entityType}/name/${encodeURIComponent(fqn)}/usage/aggregate${this.buildQueryString(params)}`)
  },

  // Data Observability
  async getDataObservabilityMetrics(entityType: string, fqn: string, params?: { startTs?: number; endTs?: number }) {
    return this.request(`/${entityType}/name/${encodeURIComponent(fqn)}/observability${this.buildQueryString(params)}`)
  },

  async getDataFreshness(entityType: string, fqn: string) {
    return this.request(`/${entityType}/name/${encodeURIComponent(fqn)}/freshness`)
  },

  async getDataVolume(entityType: string, fqn: string, params?: { startTs?: number; endTs?: number }) {
    return this.request(`/${entityType}/name/${encodeURIComponent(fqn)}/volume${this.buildQueryString(params)}`)
  },
}
