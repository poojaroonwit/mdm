export interface OpenMetadataMethods2 {
  addTagToEntity(entityType: string, fqn: string, tagFqn: string): Promise<any>
  removeTagFromEntity(entityType: string, fqn: string, tagFqn: string): Promise<any>
  getClassification(fqn: string): Promise<any>
  createClassification(data: any): Promise<any>
  updateClassification(fqn: string, data: any): Promise<any>
  deleteClassification(fqn: string): Promise<any>
  getGlossaries(params?: { limit?: number; offset?: number }): Promise<any>
  getGlossary(fqn: string): Promise<any>
  getGlossaryTerms(glossaryFqn: string): Promise<any>
  createGlossary(data: any): Promise<any>
  updateGlossary(fqn: string, data: any): Promise<any>
  deleteGlossary(fqn: string): Promise<any>
  getGlossaryTerm(fqn: string): Promise<any>
  createGlossaryTerm(data: any): Promise<any>
  updateGlossaryTerm(fqn: string, data: any): Promise<any>
  deleteGlossaryTerm(fqn: string): Promise<any>
  getPolicies(params?: { limit?: number; offset?: number }): Promise<any>
  getPolicy(fqn: string): Promise<any>
  createPolicy(data: any): Promise<any>
  updatePolicy(fqn: string, data: any): Promise<any>
  deletePolicy(fqn: string): Promise<any>
  getQueries(params?: { limit?: number; offset?: number; entityType?: string; entityFqn?: string }): Promise<any>
  getQuery(id: string): Promise<any>
  createQuery(data: any): Promise<any>
  updateQuery(id: string, data: any): Promise<any>
  deleteQuery(id: string): Promise<any>
  getQueryUsage(queryId: string, params?: { limit?: number; startTs?: number; endTs?: number }): Promise<any>
  getRoles(params?: { limit?: number; offset?: number }): Promise<any>
  getRole(id: string): Promise<any>
  createRole(data: any): Promise<any>
  updateRole(id: string, data: any): Promise<any>
  deleteRole(id: string, recursive: boolean, hardDelete: boolean): Promise<any>
  getTeams(params?: { limit?: number; offset?: number }): Promise<any>
  getTeam(id: string): Promise<any>
  getTeamByName(name: string): Promise<any>
  createTeam(data: any): Promise<any>
  updateTeam(id: string, data: any): Promise<any>
  deleteTeam(id: string, recursive: boolean, hardDelete: boolean): Promise<any>
  addTeamMember(teamId: string, userId: string): Promise<any>
  removeTeamMember(teamId: string, userId: string): Promise<any>
  getTeamMembers(teamId: string): Promise<any>
  getUsers(params?: { limit?: number; offset?: number; team?: string; isBot?: boolean; isAdmin?: boolean }): Promise<any>
  getUser(id: string): Promise<any>
  getUserByName(name: string): Promise<any>
  createUser(data: any): Promise<any>
  updateUser(id: string, data: any): Promise<any>
  deleteUser(id: string, recursive: boolean, hardDelete: boolean): Promise<any>
  generateUserToken(userId: string): Promise<any>
  getUserTokens(userId: string): Promise<any>
  getUserToken(userId: string, tokenId: string): Promise<any>
  revokeUserToken(userId: string, tokenId: string): Promise<any>
  revokeAllUserTokens(userId: string): Promise<any>
  getPermissions(params?: { limit?: number; offset?: number; resource?: string; action?: string }): Promise<any>
  getPermission(id: string): Promise<any>
  createPermission(data: any): Promise<any>
  updatePermission(id: string, data: any): Promise<any>
  deletePermission(id: string): Promise<any>
  getRolePermissions(roleId: string): Promise<any>
  addRolePermission(roleId: string, permissionId: string): Promise<any>
  removeRolePermission(roleId: string, permissionId: string): Promise<any>
  getTeamPermissions(teamId: string): Promise<any>
  addTeamPermission(teamId: string, permissionId: string): Promise<any>
  removeTeamPermission(teamId: string, permissionId: string): Promise<any>
  getDatabaseServices(params?: { limit?: number; offset?: number }): Promise<any>
  getDatabaseService(fqn: string): Promise<any>
  getDashboardServices(params?: { limit?: number; offset?: number }): Promise<any>
  getDashboardService(fqn: string): Promise<any>
  createDashboardService(data: any): Promise<any>
  updateDashboardService(fqn: string, data: any): Promise<any>
  deleteDashboardService(fqn: string): Promise<any>
  getPipelineServices(params?: { limit?: number; offset?: number }): Promise<any>
  getPipelineService(fqn: string): Promise<any>
  createPipelineService(data: any): Promise<any>
  updatePipelineService(fqn: string, data: any): Promise<any>
  deletePipelineService(fqn: string): Promise<any>
}

export const openMetadataMethods2: Record<string, Function> & ThisType<any> = {
  async addTagToEntity(entityType: string, fqn: string, tagFqn: string) {
    return this.request(`/${entityType}/name/${encodeURIComponent(fqn)}/tags`, {
      method: 'POST',
      body: JSON.stringify([{ tagFQN: tagFqn }]),
    })
  },

  async removeTagFromEntity(entityType: string, fqn: string, tagFqn: string) {
    return this.request(`/${entityType}/name/${encodeURIComponent(fqn)}/tags/${encodeURIComponent(tagFqn)}`, {
      method: 'DELETE',
    })
  },

  // Classifications
  async getClassification(fqn: string) {
    return this.request(`/classifications/name/${encodeURIComponent(fqn)}`)
  },

  async createClassification(data: any) {
    return this.request('/classifications', { method: 'POST', body: JSON.stringify(data) })
  },

  async updateClassification(fqn: string, data: any) {
    return this.request(`/classifications/name/${encodeURIComponent(fqn)}`, { method: 'PATCH', body: JSON.stringify(data) })
  },

  async deleteClassification(fqn: string) {
    return this.request(`/classifications/name/${encodeURIComponent(fqn)}`, { method: 'DELETE' })
  },

  // Glossary & Terms
  async getGlossaries(params?: { limit?: number; offset?: number }) {
    return this.request(`/glossaries${this.buildQueryString(params)}`)
  },

  async getGlossary(fqn: string) {
    return this.request(`/glossaries/name/${encodeURIComponent(fqn)}`)
  },

  async getGlossaryTerms(glossaryFqn: string) {
    return this.request(`/glossaryTerms?glossary=${encodeURIComponent(glossaryFqn)}`)
  },

  async createGlossary(data: any) {
    return this.request('/glossaries', { method: 'POST', body: JSON.stringify(data) })
  },

  async updateGlossary(fqn: string, data: any) {
    return this.request(`/glossaries/name/${encodeURIComponent(fqn)}`, { method: 'PATCH', body: JSON.stringify(data) })
  },

  async deleteGlossary(fqn: string) {
    return this.request(`/glossaries/name/${encodeURIComponent(fqn)}`, { method: 'DELETE' })
  },

  async getGlossaryTerm(fqn: string) {
    return this.request(`/glossaryTerms/name/${encodeURIComponent(fqn)}`)
  },

  async createGlossaryTerm(data: any) {
    return this.request('/glossaryTerms', { method: 'POST', body: JSON.stringify(data) })
  },

  async updateGlossaryTerm(fqn: string, data: any) {
    return this.request(`/glossaryTerms/name/${encodeURIComponent(fqn)}`, { method: 'PATCH', body: JSON.stringify(data) })
  },

  async deleteGlossaryTerm(fqn: string) {
    return this.request(`/glossaryTerms/name/${encodeURIComponent(fqn)}`, { method: 'DELETE' })
  },

  // Policies
  async getPolicies(params?: { limit?: number; offset?: number }) {
    return this.request(`/policies${this.buildQueryString(params)}`)
  },

  async getPolicy(fqn: string) {
    return this.request(`/policies/name/${encodeURIComponent(fqn)}`)
  },

  async createPolicy(data: any) {
    return this.request('/policies', { method: 'POST', body: JSON.stringify(data) })
  },

  async updatePolicy(fqn: string, data: any) {
    return this.request(`/policies/name/${encodeURIComponent(fqn)}`, { method: 'PATCH', body: JSON.stringify(data) })
  },

  async deletePolicy(fqn: string) {
    return this.request(`/policies/name/${encodeURIComponent(fqn)}`, { method: 'DELETE' })
  },

  // Queries
  async getQueries(params?: { limit?: number; offset?: number; entityType?: string; entityFqn?: string }) {
    return this.request(`/queries${this.buildQueryString(params)}`)
  },

  async getQuery(id: string) {
    return this.request(`/queries/${id}`)
  },

  async createQuery(data: any) {
    return this.request('/queries', { method: 'POST', body: JSON.stringify(data) })
  },

  async updateQuery(id: string, data: any) {
    return this.request(`/queries/${id}`, { method: 'PATCH', body: JSON.stringify(data) })
  },

  async deleteQuery(id: string) {
    return this.request(`/queries/${id}`, { method: 'DELETE' })
  },

  async getQueryUsage(queryId: string, params?: { limit?: number; startTs?: number; endTs?: number }) {
    return this.request(`/queries/${queryId}/usage${this.buildQueryString(params)}`)
  },

  // Roles
  async getRoles(params?: { limit?: number; offset?: number }) {
    return this.request(`/roles${this.buildQueryString(params)}`)
  },

  async getRole(id: string) {
    return this.request(`/roles/${id}`)
  },

  async createRole(data: any) {
    return this.request('/roles', { method: 'POST', body: JSON.stringify(data) })
  },

  async updateRole(id: string, data: any) {
    return this.request(`/roles/${id}`, { method: 'PATCH', body: JSON.stringify(data) })
  },

  async deleteRole(id: string, recursive: boolean = false, hardDelete: boolean = false) {
    return this.request(`/roles/${id}?recursive=${recursive}&hardDelete=${hardDelete}`, { method: 'DELETE' })
  },

  // Teams
  async getTeams(params?: { limit?: number; offset?: number }) {
    return this.request(`/teams${this.buildQueryString(params)}`)
  },

  async getTeam(id: string) {
    return this.request(`/teams/${id}`)
  },

  async getTeamByName(name: string) {
    return this.request(`/teams/name/${encodeURIComponent(name)}`)
  },

  async createTeam(data: any) {
    return this.request('/teams', { method: 'POST', body: JSON.stringify(data) })
  },

  async updateTeam(id: string, data: any) {
    return this.request(`/teams/${id}`, { method: 'PATCH', body: JSON.stringify(data) })
  },

  async deleteTeam(id: string, recursive: boolean = false, hardDelete: boolean = false) {
    return this.request(`/teams/${id}?recursive=${recursive}&hardDelete=${hardDelete}`, { method: 'DELETE' })
  },

  async addTeamMember(teamId: string, userId: string) {
    return this.request(`/teams/${teamId}/users`, {
      method: 'POST',
      body: JSON.stringify([{ id: userId }]),
    })
  },

  async removeTeamMember(teamId: string, userId: string) {
    return this.request(`/teams/${teamId}/users/${userId}`, { method: 'DELETE' })
  },

  async getTeamMembers(teamId: string) {
    return this.request(`/teams/${teamId}/users`)
  },

  // Users
  async getUsers(params?: { limit?: number; offset?: number; team?: string; isBot?: boolean; isAdmin?: boolean }) {
    return this.request(`/users${this.buildQueryString(params)}`)
  },

  async getUser(id: string) {
    return this.request(`/users/${id}`)
  },

  async getUserByName(name: string) {
    return this.request(`/users/name/${encodeURIComponent(name)}`)
  },

  async createUser(data: any) {
    return this.request('/users', { method: 'POST', body: JSON.stringify(data) })
  },

  async updateUser(id: string, data: any) {
    return this.request(`/users/${id}`, { method: 'PATCH', body: JSON.stringify(data) })
  },

  async deleteUser(id: string, recursive: boolean = false, hardDelete: boolean = false) {
    return this.request(`/users/${id}?recursive=${recursive}&hardDelete=${hardDelete}`, { method: 'DELETE' })
  },

  async generateUserToken(userId: string) {
    return this.request(`/users/${userId}/generateToken`, { method: 'PUT' })
  },

  async getUserTokens(userId: string) {
    return this.request(`/users/${userId}/tokens`)
  },

  async getUserToken(userId: string, tokenId: string) {
    return this.request(`/users/${userId}/tokens/${tokenId}`)
  },

  async revokeUserToken(userId: string, tokenId: string) {
    return this.request(`/users/${userId}/revokeToken`, {
      method: 'PUT',
      body: JSON.stringify({ tokenId }),
    })
  },

  async revokeAllUserTokens(userId: string) {
    return this.request(`/users/${userId}/revokeAllTokens`, { method: 'PUT' })
  },

  // Permissions
  async getPermissions(params?: { limit?: number; offset?: number; resource?: string; action?: string }) {
    return this.request(`/permissions${this.buildQueryString(params)}`)
  },

  async getPermission(id: string) {
    return this.request(`/permissions/${id}`)
  },

  async createPermission(data: any) {
    return this.request('/permissions', { method: 'POST', body: JSON.stringify(data) })
  },

  async updatePermission(id: string, data: any) {
    return this.request(`/permissions/${id}`, { method: 'PATCH', body: JSON.stringify(data) })
  },

  async deletePermission(id: string) {
    return this.request(`/permissions/${id}`, { method: 'DELETE' })
  },

  // Role Permissions
  async getRolePermissions(roleId: string) {
    return this.request(`/roles/${roleId}/permissions`)
  },

  async addRolePermission(roleId: string, permissionId: string) {
    return this.request(`/roles/${roleId}/permissions`, {
      method: 'POST',
      body: JSON.stringify([{ id: permissionId }]),
    })
  },

  async removeRolePermission(roleId: string, permissionId: string) {
    return this.request(`/roles/${roleId}/permissions/${permissionId}`, { method: 'DELETE' })
  },

  // Team Permissions
  async getTeamPermissions(teamId: string) {
    return this.request(`/teams/${teamId}/permissions`)
  },

  async addTeamPermission(teamId: string, permissionId: string) {
    return this.request(`/teams/${teamId}/permissions`, {
      method: 'POST',
      body: JSON.stringify([{ id: permissionId }]),
    })
  },

  async removeTeamPermission(teamId: string, permissionId: string) {
    return this.request(`/teams/${teamId}/permissions/${permissionId}`, { method: 'DELETE' })
  },

  // Services & Connectors
  async getDatabaseServices(params?: { limit?: number; offset?: number }) {
    return this.request(`/services/databaseServices${this.buildQueryString(params)}`)
  },

  async getDatabaseService(fqn: string) {
    return this.request(`/services/databaseServices/name/${encodeURIComponent(fqn)}`)
  },

  async getDashboardServices(params?: { limit?: number; offset?: number }) {
    return this.request(`/services/dashboardServices${this.buildQueryString(params)}`)
  },

  async getDashboardService(fqn: string) {
    return this.request(`/services/dashboardServices/name/${encodeURIComponent(fqn)}`)
  },

  async createDashboardService(data: any) {
    return this.request('/services/dashboardServices', { method: 'POST', body: JSON.stringify(data) })
  },

  async updateDashboardService(fqn: string, data: any) {
    return this.request(`/services/dashboardServices/name/${encodeURIComponent(fqn)}`, { method: 'PATCH', body: JSON.stringify(data) })
  },

  async deleteDashboardService(fqn: string) {
    return this.request(`/services/dashboardServices/name/${encodeURIComponent(fqn)}`, { method: 'DELETE' })
  },

  async getPipelineServices(params?: { limit?: number; offset?: number }) {
    return this.request(`/services/pipelineServices${this.buildQueryString(params)}`)
  },

  async getPipelineService(fqn: string) {
    return this.request(`/services/pipelineServices/name/${encodeURIComponent(fqn)}`)
  },

  async createPipelineService(data: any) {
    return this.request('/services/pipelineServices', { method: 'POST', body: JSON.stringify(data) })
  },

  async updatePipelineService(fqn: string, data: any) {
    return this.request(`/services/pipelineServices/name/${encodeURIComponent(fqn)}`, { method: 'PATCH', body: JSON.stringify(data) })
  },

  async deletePipelineService(fqn: string) {
    return this.request(`/services/pipelineServices/name/${encodeURIComponent(fqn)}`, { method: 'DELETE' })
  },
}
