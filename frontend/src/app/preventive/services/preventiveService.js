import API from '../../../lib/api';

const basePath = '/maintenance/preventive';

export const preventiveService = {
  // KPIs
  getKpis: async () => {
    const response = await API.get(`${basePath}/kpis`);
    return response.data;
  },

  // History
  getHistory: async () => {
      const response = await API.get(`${basePath}/history`);
      return response.data;
  },

  // CRUD
  getAll: async (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.status && filters.status !== 'Tous') params.append('status', filters.status);
    if (filters.frequency && filters.frequency !== 'Tous') params.append('frequency', filters.frequency);
    if (filters.machineId && filters.machineId !== 'Tous') params.append('machineId', filters.machineId);
    if (filters.technicienId && filters.technicienId !== 'Tous') params.append('technicienId', filters.technicienId);

    const response = await API.get(`${basePath}?${params.toString()}`);
    return response.data;
  },

  getById: async (id) => {
    const response = await API.get(`${basePath}/${id}`);
    return response.data;
  },

  create: async (data) => {
    const response = await API.post(basePath, data);
    return response.data;
  },

  update: async (id, data) => {
    const response = await API.put(`${basePath}/${id}`, data);
    return response.data;
  },

  delete: async (id) => {
    const response = await API.delete(`${basePath}/${id}`);
    return response.data;
  },

  // Specific Actions
  changeStatus: async (id, data) => {
      // data: { status, observations, duration }
      const response = await API.patch(`${basePath}/${id}/status`, data);
      return response.data;
  },

  updateChecklist: async (id, items) => {
      // items: array of { id, status, comment, inspectionDate }
      const response = await API.put(`${basePath}/${id}/checklist`, { items });
      return response.data;
  },

  // Import
  validateImport: async (rows) => {
      const response = await API.post(`${basePath}/import/validate`, { rows });
      return response.data;
  },

  confirmImport: async (rows) => {
      const response = await API.post(`${basePath}/import/confirm`, { rows });
      return response.data;
  }
};
