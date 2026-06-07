export interface OpenMetadataMethods6 {
  deleteAuthProvider(providerId: string): Promise<any>
  testSSOConnection(providerId: string): Promise<any>
  getSSOConfig(): Promise<any>
  updateSSOConfig(data: any): Promise<any>
  login(credentials: { username: string; password: string }): Promise<any>
  logout(): Promise<any>
  refreshToken(refreshToken: string): Promise<any>
  getCurrentUser(): Promise<any>
  changePassword(userId: string, oldPassword: string, newPassword: string): Promise<any>
  resetPassword(userId: string, newPassword: string): Promise<any>
  getSettings(category?: string): Promise<any>
  getSetting(key: string): Promise<any>
  updateSetting(key: string, value: any): Promise<any>
  updateSettings(settings: Record<string, any>): Promise<any>
  deleteSetting(key: string): Promise<any>
  getEvents(params?: { limit?: number; offset?: number; eventType?: string; entityType?: string; startTs?: number; endTs?: number }): Promise<any>
  getEntityEvents(entityType: string, fqn: string, params?: { limit?: number; offset?: number; startTs?: number; endTs?: number }): Promise<any>
  subscribeToEvents(eventTypes: string[], callback: (event: any) => void): Promise<any>
  getEntitySummary(entityType: string, fqn: string): Promise<any>
  getEntityStatistics(entityType: string, fqn: string): Promise<any>
  compareEntities(entityType: string, fqn1: string, fqn2: string): Promise<any>
  getEntityDependencies(entityType: string, fqn: string): Promise<any>
  getEntityReferences(entityType: string, fqn: string): Promise<any>
  getEntityHealth(entityType: string, fqn: string): Promise<any>
  getEntityStatus(entityType: string, fqn: string): Promise<any>
  getFollowers(entityType: string, fqn: string): Promise<any>
  addFollower(entityType: string, fqn: string, userId: string): Promise<any>
  removeFollower(entityType: string, fqn: string, userId: string): Promise<any>
  getOwners(entityType: string, fqn: string): Promise<any>
  addOwner(entityType: string, fqn: string, owner: { id: string; type: string }): Promise<any>
  removeOwner(entityType: string, fqn: string, ownerId: string): Promise<any>
  getVotes(entityType: string, fqn: string): Promise<any>
  addVote(entityType: string, fqn: string, vote: { updatedVoteType: 'votedUp' | 'votedDown' }): Promise<any>
  removeVote(entityType: string, fqn: string): Promise<any>
  getReviews(entityType: string, fqn: string, params?: { limit?: number; offset?: number }): Promise<any>
  addReview(entityType: string, fqn: string, review: any): Promise<any>
  updateReview(entityType: string, fqn: string, reviewId: string, review: any): Promise<any>
  deleteReview(entityType: string, fqn: string, reviewId: string): Promise<any>
}

export const openMetadataMethods6: Record<string, Function> & ThisType<any> = {
  async deleteAuthProvider(providerId: string) {
    return this.request(`/auth/providers/${providerId}`, { method: 'DELETE' })
  },

  async testSSOConnection(providerId: string) {
    return this.request(`/auth/providers/${providerId}/test`, { method: 'POST' })
  },

  async getSSOConfig() {
    return this.request('/auth/sso/config')
  },

  async updateSSOConfig(data: any) {
    return this.request('/auth/sso/config', { method: 'PUT', body: JSON.stringify(data) })
  },

  async login(credentials: { username: string; password: string }) {
    return this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    })
  },

  async logout() {
    return this.request('/auth/logout', { method: 'POST' })
  },

  async refreshToken(refreshToken: string) {
    return this.request('/auth/refresh', {
      method: 'POST',
      body: JSON.stringify({ refreshToken }),
    })
  },

  async getCurrentUser() {
    return this.request('/auth/me')
  },

  async changePassword(userId: string, oldPassword: string, newPassword: string) {
    return this.request(`/users/${userId}/changePassword`, {
      method: 'PUT',
      body: JSON.stringify({ oldPassword, newPassword }),
    })
  },

  async resetPassword(userId: string, newPassword: string) {
    return this.request(`/users/${userId}/resetPassword`, {
      method: 'PUT',
      body: JSON.stringify({ newPassword }),
    })
  },

  // Settings & Configuration
  async getSettings(category?: string) {
    return this.request(`/settings${category ? `?category=${category}` : ''}`)
  },

  async getSetting(key: string) {
    return this.request(`/settings/${key}`)
  },

  async updateSetting(key: string, value: any) {
    return this.request(`/settings/${key}`, {
      method: 'PUT',
      body: JSON.stringify({ value }),
    })
  },

  async updateSettings(settings: Record<string, any>) {
    return this.request('/settings', {
      method: 'PUT',
      body: JSON.stringify(settings),
    })
  },

  async deleteSetting(key: string) {
    return this.request(`/settings/${key}`, { method: 'DELETE' })
  },

  // Events & Streaming
  async getEvents(params?: { limit?: number; offset?: number; eventType?: string; entityType?: string; startTs?: number; endTs?: number }) {
    return this.request(`/events${this.buildQueryString(params)}`)
  },

  async getEntityEvents(entityType: string, fqn: string, params?: { limit?: number; offset?: number; startTs?: number; endTs?: number }) {
    return this.request(`/${entityType}/name/${encodeURIComponent(fqn)}/events${this.buildQueryString(params)}`)
  },

  async subscribeToEvents(eventTypes: string[], callback: (event: any) => void) {
    // This would typically use WebSocket or Server-Sent Events
    // For REST API, this is a placeholder for event subscription
    return this.request('/events/subscribe', {
      method: 'POST',
      body: JSON.stringify({ eventTypes }),
    })
  },

  // Utility Operations
  async getEntitySummary(entityType: string, fqn: string) {
    return this.request(`/${entityType}/name/${encodeURIComponent(fqn)}/summary`)
  },

  async getEntityStatistics(entityType: string, fqn: string) {
    return this.request(`/${entityType}/name/${encodeURIComponent(fqn)}/statistics`)
  },

  async compareEntities(entityType: string, fqn1: string, fqn2: string) {
    return this.request(`/${entityType}/compare`, {
      method: 'POST',
      body: JSON.stringify({ fqn1, fqn2 }),
    })
  },

  async getEntityDependencies(entityType: string, fqn: string) {
    return this.request(`/${entityType}/name/${encodeURIComponent(fqn)}/dependencies`)
  },

  async getEntityReferences(entityType: string, fqn: string) {
    return this.request(`/${entityType}/name/${encodeURIComponent(fqn)}/references`)
  },

  // Health & Status
  async getEntityHealth(entityType: string, fqn: string) {
    return this.request(`/${entityType}/name/${encodeURIComponent(fqn)}/health`)
  },

  async getEntityStatus(entityType: string, fqn: string) {
    return this.request(`/${entityType}/name/${encodeURIComponent(fqn)}/status`)
  },

  // Followers & Owners
  async getFollowers(entityType: string, fqn: string) {
    return this.request(`/${entityType}/name/${encodeURIComponent(fqn)}/followers`)
  },

  async addFollower(entityType: string, fqn: string, userId: string) {
    return this.request(`/${entityType}/name/${encodeURIComponent(fqn)}/followers`, {
      method: 'PUT',
      body: JSON.stringify({ id: userId }),
    })
  },

  async removeFollower(entityType: string, fqn: string, userId: string) {
    return this.request(`/${entityType}/name/${encodeURIComponent(fqn)}/followers/${userId}`, {
      method: 'DELETE',
    })
  },

  async getOwners(entityType: string, fqn: string) {
    return this.request(`/${entityType}/name/${encodeURIComponent(fqn)}/owners`)
  },

  async addOwner(entityType: string, fqn: string, owner: { id: string; type: string }) {
    return this.request(`/${entityType}/name/${encodeURIComponent(fqn)}/owners`, {
      method: 'PUT',
      body: JSON.stringify([owner]),
    })
  },

  async removeOwner(entityType: string, fqn: string, ownerId: string) {
    return this.request(`/${entityType}/name/${encodeURIComponent(fqn)}/owners/${ownerId}`, {
      method: 'DELETE',
    })
  },

  // Votes & Reviews
  async getVotes(entityType: string, fqn: string) {
    return this.request(`/${entityType}/name/${encodeURIComponent(fqn)}/votes`)
  },

  async addVote(entityType: string, fqn: string, vote: { updatedVoteType: 'votedUp' | 'votedDown' }) {
    return this.request(`/${entityType}/name/${encodeURIComponent(fqn)}/votes`, {
      method: 'PUT',
      body: JSON.stringify(vote),
    })
  },

  async removeVote(entityType: string, fqn: string) {
    return this.request(`/${entityType}/name/${encodeURIComponent(fqn)}/votes`, {
      method: 'DELETE',
    })
  },

  async getReviews(entityType: string, fqn: string, params?: { limit?: number; offset?: number }) {
    return this.request(`/${entityType}/name/${encodeURIComponent(fqn)}/reviews${this.buildQueryString(params)}`)
  },

  async addReview(entityType: string, fqn: string, review: any) {
    return this.request(`/${entityType}/name/${encodeURIComponent(fqn)}/reviews`, {
      method: 'POST',
      body: JSON.stringify(review),
    })
  },

  async updateReview(entityType: string, fqn: string, reviewId: string, review: any) {
    return this.request(`/${entityType}/name/${encodeURIComponent(fqn)}/reviews/${reviewId}`, {
      method: 'PATCH',
      body: JSON.stringify(review),
    })
  },

  async deleteReview(entityType: string, fqn: string, reviewId: string) {
    return this.request(`/${entityType}/name/${encodeURIComponent(fqn)}/reviews/${reviewId}`, {
      method: 'DELETE',
    })
  },
}
