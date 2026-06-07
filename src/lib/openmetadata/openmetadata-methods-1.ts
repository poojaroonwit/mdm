export interface OpenMetadataMethods1 {
  getTables(params?: { limit?: number; offset?: number; fields?: string[] }): Promise<any>
  getTable(fqn: string, fields?: string[]): Promise<any>
  createTable(data: any): Promise<any>
  updateTable(fqn: string, data: any): Promise<any>
  deleteTable(fqn: string, recursive: boolean, hardDelete: boolean): Promise<any>
  softDeleteTable(fqn: string): Promise<any>
  hardDeleteTable(fqn: string): Promise<any>
  restoreTable(fqn: string): Promise<any>
  getTableColumns(fqn: string): Promise<any>
  addTableColumn(fqn: string, columnData: any): Promise<any>
  updateTableColumn(fqn: string, columnName: string, columnData: any): Promise<any>
  deleteTableColumn(fqn: string, columnName: string): Promise<any>
  getTableConstraints(fqn: string): Promise<any>
  addTableConstraint(fqn: string, constraintData: any): Promise<any>
  updateTableConstraint(fqn: string, constraintId: string, constraintData: any): Promise<any>
  deleteTableConstraint(fqn: string, constraintId: string): Promise<any>
  getTableConstraint(fqn: string, constraintId: string): Promise<any>
  getTableSampleData(fqn: string, limit?: number): Promise<any>
  createTableSampleData(fqn: string, sampleData: any): Promise<any>
  updateTableSampleData(fqn: string, sampleData: any): Promise<any>
  deleteTableSampleData(fqn: string): Promise<any>
  getDatabases(params?: { limit?: number; offset?: number }): Promise<any>
  getDatabase(fqn: string): Promise<any>
  createDatabase(data: any): Promise<any>
  updateDatabase(fqn: string, data: any): Promise<any>
  deleteDatabase(fqn: string, recursive: boolean, hardDelete: boolean): Promise<any>
  getDashboards(params?: { limit?: number; offset?: number }): Promise<any>
  getDashboard(fqn: string): Promise<any>
  createDashboard(data: any): Promise<any>
  updateDashboard(fqn: string, data: any): Promise<any>
  deleteDashboard(fqn: string, recursive: boolean, hardDelete: boolean): Promise<any>
  getPipelines(params?: { limit?: number; offset?: number }): Promise<any>
  getPipeline(fqn: string): Promise<any>
  createPipeline(data: any): Promise<any>
  updatePipeline(fqn: string, data: any): Promise<any>
  deletePipeline(fqn: string, recursive: boolean, hardDelete: boolean): Promise<any>
  getTopics(params?: { limit?: number; offset?: number }): Promise<any>
  getTopic(fqn: string): Promise<any>
  createTopic(data: any): Promise<any>
  updateTopic(fqn: string, data: any): Promise<any>
  deleteTopic(fqn: string, recursive: boolean, hardDelete: boolean): Promise<any>
  getMLModels(params?: { limit?: number; offset?: number }): Promise<any>
  getMLModel(fqn: string): Promise<any>
  createMLModel(data: any): Promise<any>
  updateMLModel(fqn: string, data: any): Promise<any>
  deleteMLModel(fqn: string, recursive: boolean, hardDelete: boolean): Promise<any>
  getLineage(fqn: string, type: 'upstream' | 'downstream' | 'both', depth: number): Promise<any>
  getColumnLineage(fqn: string, columnName: string, depth: number): Promise<any>
  addLineageEdge(data: any): Promise<any>
  deleteLineageEdge(data: any): Promise<any>
  getTestSuites(params?: { limit?: number; offset?: number }): Promise<any>
  getTestSuite(fqn: string): Promise<any>
  getTestCases(testSuiteId: string): Promise<any>
  getTestCase(id: string): Promise<any>
  getTestResults(testCaseId: string, params?: { limit?: number; startTs?: number; endTs?: number }): Promise<any>
  runTestSuite(fqn: string): Promise<any>
  getTestSuiteRuns(fqn: string, params?: { limit?: number; offset?: number; startTs?: number; endTs?: number }): Promise<any>
  getTestSuiteRun(fqn: string, runId: string): Promise<any>
  createTestSuite(data: any): Promise<any>
  updateTestSuite(fqn: string, data: any): Promise<any>
  deleteTestSuite(fqn: string): Promise<any>
  createTestCase(data: any): Promise<any>
  updateTestCase(id: string, data: any): Promise<any>
  deleteTestCase(id: string): Promise<any>
  getTableProfile(fqn: string): Promise<any>
  getColumnProfile(fqn: string, columnName: string): Promise<any>
  getTags(params?: { limit?: number; offset?: number }): Promise<any>
  getClassifications(params?: { limit?: number; offset?: number }): Promise<any>
  getTag(fqn: string): Promise<any>
  createTag(data: any): Promise<any>
  updateTag(fqn: string, data: any): Promise<any>
  deleteTag(fqn: string): Promise<any>
}

export const openMetadataMethods1: Record<string, Function> & ThisType<any> = {
  // Tables
  async getTables(params?: { limit?: number; offset?: number; fields?: string[] }) {
    return this.request(`/tables${this.buildQueryString(params)}`)
  },

  async getTable(fqn: string, fields?: string[]) {
    return this.request(`/tables/name/${encodeURIComponent(fqn)}${fields ? `?fields=${fields.join(',')}` : ''}`)
  },

  async createTable(data: any) {
    return this.request('/tables', { method: 'POST', body: JSON.stringify(data) })
  },

  async updateTable(fqn: string, data: any) {
    return this.request(`/tables/name/${encodeURIComponent(fqn)}`, { method: 'PATCH', body: JSON.stringify(data) })
  },

  async deleteTable(fqn: string, recursive: boolean = false, hardDelete: boolean = false) {
    return this.request(`/tables/name/${encodeURIComponent(fqn)}?recursive=${recursive}&hardDelete=${hardDelete}`, { method: 'DELETE' })
  },

  async softDeleteTable(fqn: string) {
    return this.deleteTable(fqn, false, false)
  },

  async hardDeleteTable(fqn: string) {
    return this.deleteTable(fqn, false, true)
  },

  async restoreTable(fqn: string) {
    return this.request(`/tables/name/${encodeURIComponent(fqn)}/restore`, { method: 'PUT' })
  },

  // Table Columns
  async getTableColumns(fqn: string) {
    return this.request(`/tables/name/${encodeURIComponent(fqn)}/columns`)
  },

  async addTableColumn(fqn: string, columnData: any) {
    return this.request(`/tables/name/${encodeURIComponent(fqn)}/columns`, {
      method: 'POST',
      body: JSON.stringify(columnData),
    })
  },

  async updateTableColumn(fqn: string, columnName: string, columnData: any) {
    return this.request(`/tables/name/${encodeURIComponent(fqn)}/columns/${encodeURIComponent(columnName)}`, {
      method: 'PATCH',
      body: JSON.stringify(columnData),
    })
  },

  async deleteTableColumn(fqn: string, columnName: string) {
    return this.request(`/tables/name/${encodeURIComponent(fqn)}/columns/${encodeURIComponent(columnName)}`, {
      method: 'DELETE',
    })
  },

  // Table Constraints
  async getTableConstraints(fqn: string) {
    return this.request(`/tables/name/${encodeURIComponent(fqn)}?fields=tableConstraints`)
  },

  async addTableConstraint(fqn: string, constraintData: any) {
    return this.request(`/tables/name/${encodeURIComponent(fqn)}/tableConstraints`, {
      method: 'POST',
      body: JSON.stringify(constraintData),
    })
  },

  async updateTableConstraint(fqn: string, constraintId: string, constraintData: any) {
    return this.request(`/tables/name/${encodeURIComponent(fqn)}/tableConstraints/${constraintId}`, {
      method: 'PATCH',
      body: JSON.stringify(constraintData),
    })
  },

  async deleteTableConstraint(fqn: string, constraintId: string) {
    return this.request(`/tables/name/${encodeURIComponent(fqn)}/tableConstraints/${constraintId}`, {
      method: 'DELETE',
    })
  },

  async getTableConstraint(fqn: string, constraintId: string) {
    return this.request(`/tables/name/${encodeURIComponent(fqn)}/tableConstraints/${constraintId}`)
  },

  // Sample Data
  async getTableSampleData(fqn: string, limit?: number) {
    return this.request(`/tables/name/${encodeURIComponent(fqn)}/sampleData${limit ? `?limit=${limit}` : ''}`)
  },

  async createTableSampleData(fqn: string, sampleData: any) {
    return this.request(`/tables/name/${encodeURIComponent(fqn)}/sampleData`, {
      method: 'POST',
      body: JSON.stringify(sampleData),
    })
  },

  async updateTableSampleData(fqn: string, sampleData: any) {
    return this.request(`/tables/name/${encodeURIComponent(fqn)}/sampleData`, {
      method: 'PUT',
      body: JSON.stringify(sampleData),
    })
  },

  async deleteTableSampleData(fqn: string) {
    return this.request(`/tables/name/${encodeURIComponent(fqn)}/sampleData`, {
      method: 'DELETE',
    })
  },

  // Databases
  async getDatabases(params?: { limit?: number; offset?: number }) {
    return this.request(`/databases${this.buildQueryString(params)}`)
  },

  async getDatabase(fqn: string) {
    return this.request(`/databases/name/${encodeURIComponent(fqn)}`)
  },

  async createDatabase(data: any) {
    return this.request('/databases', { method: 'POST', body: JSON.stringify(data) })
  },

  async updateDatabase(fqn: string, data: any) {
    return this.request(`/databases/name/${encodeURIComponent(fqn)}`, { method: 'PATCH', body: JSON.stringify(data) })
  },

  async deleteDatabase(fqn: string, recursive: boolean = false, hardDelete: boolean = false) {
    return this.request(`/databases/name/${encodeURIComponent(fqn)}?recursive=${recursive}&hardDelete=${hardDelete}`, { method: 'DELETE' })
  },

  // Dashboards
  async getDashboards(params?: { limit?: number; offset?: number }) {
    return this.request(`/dashboards${this.buildQueryString(params)}`)
  },

  async getDashboard(fqn: string) {
    return this.request(`/dashboards/name/${encodeURIComponent(fqn)}`)
  },

  async createDashboard(data: any) {
    return this.request('/dashboards', { method: 'POST', body: JSON.stringify(data) })
  },

  async updateDashboard(fqn: string, data: any) {
    return this.request(`/dashboards/name/${encodeURIComponent(fqn)}`, { method: 'PATCH', body: JSON.stringify(data) })
  },

  async deleteDashboard(fqn: string, recursive: boolean = false, hardDelete: boolean = false) {
    return this.request(`/dashboards/name/${encodeURIComponent(fqn)}?recursive=${recursive}&hardDelete=${hardDelete}`, { method: 'DELETE' })
  },

  // Pipelines
  async getPipelines(params?: { limit?: number; offset?: number }) {
    return this.request(`/pipelines${this.buildQueryString(params)}`)
  },

  async getPipeline(fqn: string) {
    return this.request(`/pipelines/name/${encodeURIComponent(fqn)}`)
  },

  async createPipeline(data: any) {
    return this.request('/pipelines', { method: 'POST', body: JSON.stringify(data) })
  },

  async updatePipeline(fqn: string, data: any) {
    return this.request(`/pipelines/name/${encodeURIComponent(fqn)}`, { method: 'PATCH', body: JSON.stringify(data) })
  },

  async deletePipeline(fqn: string, recursive: boolean = false, hardDelete: boolean = false) {
    return this.request(`/pipelines/name/${encodeURIComponent(fqn)}?recursive=${recursive}&hardDelete=${hardDelete}`, { method: 'DELETE' })
  },

  // Topics
  async getTopics(params?: { limit?: number; offset?: number }) {
    return this.request(`/topics${this.buildQueryString(params)}`)
  },

  async getTopic(fqn: string) {
    return this.request(`/topics/name/${encodeURIComponent(fqn)}`)
  },

  async createTopic(data: any) {
    return this.request('/topics', { method: 'POST', body: JSON.stringify(data) })
  },

  async updateTopic(fqn: string, data: any) {
    return this.request(`/topics/name/${encodeURIComponent(fqn)}`, { method: 'PATCH', body: JSON.stringify(data) })
  },

  async deleteTopic(fqn: string, recursive: boolean = false, hardDelete: boolean = false) {
    return this.request(`/topics/name/${encodeURIComponent(fqn)}?recursive=${recursive}&hardDelete=${hardDelete}`, { method: 'DELETE' })
  },

  // ML Models
  async getMLModels(params?: { limit?: number; offset?: number }) {
    return this.request(`/mlModels${this.buildQueryString(params)}`)
  },

  async getMLModel(fqn: string) {
    return this.request(`/mlModels/name/${encodeURIComponent(fqn)}`)
  },

  async createMLModel(data: any) {
    return this.request('/mlModels', { method: 'POST', body: JSON.stringify(data) })
  },

  async updateMLModel(fqn: string, data: any) {
    return this.request(`/mlModels/name/${encodeURIComponent(fqn)}`, { method: 'PATCH', body: JSON.stringify(data) })
  },

  async deleteMLModel(fqn: string, recursive: boolean = false, hardDelete: boolean = false) {
    return this.request(`/mlModels/name/${encodeURIComponent(fqn)}?recursive=${recursive}&hardDelete=${hardDelete}`, { method: 'DELETE' })
  },

  // Lineage
  async getLineage(fqn: string, type: 'upstream' | 'downstream' | 'both' = 'both', depth: number = 1) {
    return this.request(`/lineage/table/name/${encodeURIComponent(fqn)}?upstreamDepth=${depth}&downstreamDepth=${depth}`)
  },

  async getColumnLineage(fqn: string, columnName: string, depth: number = 1) {
    return this.request(`/lineage/table/name/${encodeURIComponent(fqn)}/column/${encodeURIComponent(columnName)}?upstreamDepth=${depth}&downstreamDepth=${depth}`)
  },

  async addLineageEdge(data: any) {
    return this.request('/lineage', { method: 'PUT', body: JSON.stringify(data) })
  },

  async deleteLineageEdge(data: any) {
    return this.request('/lineage', { method: 'DELETE', body: JSON.stringify(data) })
  },

  // Data Quality
  async getTestSuites(params?: { limit?: number; offset?: number }) {
    return this.request(`/testSuites${this.buildQueryString(params)}`)
  },

  async getTestSuite(fqn: string) {
    return this.request(`/testSuites/name/${encodeURIComponent(fqn)}`)
  },

  async getTestCases(testSuiteId: string) {
    return this.request(`/testCases?testSuite=${encodeURIComponent(testSuiteId)}`)
  },

  async getTestCase(id: string) {
    return this.request(`/testCases/${id}`)
  },

  async getTestResults(testCaseId: string, params?: { limit?: number; startTs?: number; endTs?: number }) {
    return this.request(`/testCases/${testCaseId}/testCaseResult${this.buildQueryString(params)}`)
  },

  async runTestSuite(fqn: string) {
    return this.request(`/testSuites/name/${encodeURIComponent(fqn)}/run`, { method: 'POST' })
  },

  async getTestSuiteRuns(fqn: string, params?: { limit?: number; offset?: number; startTs?: number; endTs?: number }) {
    return this.request(`/testSuites/name/${encodeURIComponent(fqn)}/runs${this.buildQueryString(params)}`)
  },

  async getTestSuiteRun(fqn: string, runId: string) {
    return this.request(`/testSuites/name/${encodeURIComponent(fqn)}/runs/${runId}`)
  },

  async createTestSuite(data: any) {
    return this.request('/testSuites', { method: 'POST', body: JSON.stringify(data) })
  },

  async updateTestSuite(fqn: string, data: any) {
    return this.request(`/testSuites/name/${encodeURIComponent(fqn)}`, { method: 'PATCH', body: JSON.stringify(data) })
  },

  async deleteTestSuite(fqn: string) {
    return this.request(`/testSuites/name/${encodeURIComponent(fqn)}`, { method: 'DELETE' })
  },

  async createTestCase(data: any) {
    return this.request('/testCases', { method: 'POST', body: JSON.stringify(data) })
  },

  async updateTestCase(id: string, data: any) {
    return this.request(`/testCases/${id}`, { method: 'PATCH', body: JSON.stringify(data) })
  },

  async deleteTestCase(id: string) {
    return this.request(`/testCases/${id}`, { method: 'DELETE' })
  },

  // Data Profiler
  async getTableProfile(fqn: string) {
    return this.request(`/tables/name/${encodeURIComponent(fqn)}?fields=profile`)
  },

  async getColumnProfile(fqn: string, columnName: string) {
    return this.request(`/tables/name/${encodeURIComponent(fqn)}/columns/${encodeURIComponent(columnName)}?fields=profile`)
  },

  // Tags & Classifications
  async getTags(params?: { limit?: number; offset?: number }) {
    return this.request(`/tags${this.buildQueryString(params)}`)
  },

  async getClassifications(params?: { limit?: number; offset?: number }) {
    return this.request(`/classifications${this.buildQueryString(params)}`)
  },

  async getTag(fqn: string) {
    return this.request(`/tags/name/${encodeURIComponent(fqn)}`)
  },

  async createTag(data: any) {
    return this.request('/tags', { method: 'POST', body: JSON.stringify(data) })
  },

  async updateTag(fqn: string, data: any) {
    return this.request(`/tags/name/${encodeURIComponent(fqn)}`, { method: 'PATCH', body: JSON.stringify(data) })
  },

  async deleteTag(fqn: string) {
    return this.request(`/tags/name/${encodeURIComponent(fqn)}`, { method: 'DELETE' })
  },
}
