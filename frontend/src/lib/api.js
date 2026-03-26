class ApiClient {
  constructor() {
    this.baseUrl = '/api'
  }

  async getToken() {
    if (typeof window === 'undefined') return null
    const stored = localStorage.getItem('golf_token')
    return stored || null
  }

  async request(path, options = {}) {
    const token = await this.getToken()
    const headers = {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    }

    const res = await fetch(`${this.baseUrl}${path}`, {
      ...options,
      headers,
    })

    if (res.status === 401) {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('golf_token')
        localStorage.removeItem('golf_user')
        window.location.href = '/auth/login'
      }
      throw new Error('Unauthorized')
    }

    const data = await res.json()
    if (!res.ok) throw new Error(data.detail || 'Request failed')
    return data
  }

  get(path) { return this.request(path) }
  post(path, body) { return this.request(path, { method: 'POST', body: JSON.stringify(body) }) }
  put(path, body) { return this.request(path, { method: 'PUT', body: JSON.stringify(body) }) }
  delete(path) { return this.request(path, { method: 'DELETE' }) }

  // Auth
  signup(data) { return this.post('/auth/signup', data) }
  login(data) { return this.post('/auth/login', data) }
  getMe() { return this.get('/auth/me') }
  updateProfile(data) { return this.put('/profile', data) }

  // Scores
  getScores() { return this.get('/scores') }
  addScore(data) { return this.post('/scores', data) }
  updateScore(id, data) { return this.put(`/scores/${id}`, data) }
  deleteScore(id) { return this.delete(`/scores/${id}`) }

  // Subscriptions
  createCheckout(productId) { return this.post('/subscriptions/checkout', { product_id: productId }) }
  getSubscription() { return this.get('/subscriptions/me') }
  getPortalUrl() { return this.get('/subscriptions/portal') }

  // Charities
  getCharities() { return this.get('/charities') }
  getCharity(id) { return this.get(`/charities/${id}`) }
  selectCharity(charityId, pct) { return this.post('/charities/select', { charity_id: charityId, contribution_pct: pct }) }
  donateToCharity(charityId, amount) { return this.post(`/charities/${charityId}/donate`, { amount }) }

  // Draws
  getDraws() { return this.get('/draws') }
  getDraw(id) { return this.get(`/draws/${id}`) }
  getMyResults() { return this.get('/draws/my-results') }

  // Winners
  uploadProof(resultId, imageUrl) { return this.post(`/winners/${resultId}/proof`, { proof_image_url: imageUrl }) }
  getNotifications() { return this.get('/notifications') }

  // Admin
  adminGetUsers() { return this.get('/admin/users') }
  adminGetUser(id) { return this.get(`/admin/users/${id}`) }
  adminUpdateUser(id, data) { return this.put(`/admin/users/${id}`, data) }
  adminGetSubscriptions() { return this.get('/admin/subscriptions') }
  adminUpdateSubscription(id, data) { return this.put(`/admin/subscriptions/${id}`, data) }
  adminGetCharities() { return this.get('/admin/charities') }
  adminCreateCharity(data) { return this.post('/admin/charities', data) }
  adminUpdateCharity(id, data) { return this.put(`/admin/charities/${id}`, data) }
  adminDeleteCharity(id) { return this.delete(`/admin/charities/${id}`) }
  adminGetDraws() { return this.get('/admin/draws') }
  adminCreateDraw(data) { return this.post('/admin/draws', data) }
  adminRunDraw(id, type) { return this.post(`/admin/draws/${id}/run`, { draw_type: type }) }
  adminPublishDraw(id) { return this.post(`/admin/draws/${id}/publish`) }
  adminSimulateDraw(id) { return this.post(`/admin/draws/${id}/simulate`) }
  adminGetWinners() { return this.get('/admin/winners') }
  adminVerifyWinner(id, status) { return this.put(`/admin/winners/${id}/verify`, { status }) }
  adminMarkPaid(id) { return this.put(`/admin/winners/${id}/pay`) }
  adminGetReports() { return this.get('/admin/reports') }
  adminUpdateScore(userId, scoreId, data) { return this.put(`/admin/users/${userId}/scores/${scoreId}`, data) }
  adminAddCharityEvent(charityId, data) { return this.post(`/admin/charities/${charityId}/events`, data) }
}

export const api = new ApiClient()
