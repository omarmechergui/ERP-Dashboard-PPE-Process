import API from '../../../lib/api';

export const interventionService = {
  getAll: async (filters = {}) => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value && value !== 'Tous' && value !== 'All') {
        params.append(key, value);
      }
    });
    
    const queryString = params.toString();
    const url = queryString ? `/maintenance/interventions?${queryString}` : '/maintenance/interventions';
    
    const response = await API.get(url);
    return response.data;
  },

  getById: async (id) => {
    const response = await API.get(`/maintenance/interventions/${id}`);
    return response.data;
  },

  create: async (data) => {
    const response = await API.post('/maintenance/interventions', data);
    return response.data;
  },

  update: async (id, data) => {
    const response = await API.put(`/maintenance/interventions/${id}`, data);
    return response.data;
  },

  delete: async (id) => {
    const response = await API.delete(`/maintenance/interventions/${id}`);
    return response.data;
  },

  changeStatus: async (id, status) => {
    const response = await API.patch(`/maintenance/interventions/${id}/status`, { status });
    return response.data;
  },

  start: async (id) => {
    const response = await API.patch(`/maintenance/interventions/${id}/start`);
    return response.data;
  },

  complete: async (id, data) => {
    const response = await API.patch(`/maintenance/interventions/${id}/complete`, data);
    return response.data;
  },

  cancel: async (id, reason) => {
    const response = await API.patch(`/maintenance/interventions/${id}/cancel`, { reason });
    return response.data;
  },

  addParts: async (id, articleId, quantite) => {
    const response = await API.post(`/maintenance/interventions/${id}/parts`, { articleId, quantite });
    return response.data;
  }
};
