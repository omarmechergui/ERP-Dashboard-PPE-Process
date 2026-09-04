import API from '../../../lib/api';

// The organigrammeService manages fetching real users and org snapshots.

export const organigrammeService = {
  getUsers: async () => {
    const res = await API.get('/users');
    return res.data;
  },

  updateManager: async (employeeId, newManagerId) => {
    // This is handled by saving the snapshot, not individually
    return Promise.resolve({ success: true });
  },

  // ── Workflow API ─────────────────────────────────────────────────────────────

  getOrganigrammes: async () => {
    const res = await API.get('/organigrammes');
    return res.data;
  },

  getActiveOrganigramme: async () => {
    try {
      const res = await API.get('/organigrammes/active');
      return res.data;
    } catch {
      return null;
    }
  },

  getOrganigrammeById: async (id) => {
    const res = await API.get(`/organigrammes/${id}`);
    return res.data;
  },

  createOrganigramme: async (data) => {
    const res = await API.post('/organigrammes', data);
    return res.data;
  },

  updateOrganigramme: async (id, data) => {
    const res = await API.put(`/organigrammes/${id}`, data);
    return res.data;
  },

  submitOrganigramme: async (id, comment) => {
    const res = await API.patch(`/organigrammes/${id}/submit`, { comment });
    return res.data;
  },

  validateOrganigramme: async (id, comment) => {
    const res = await API.patch(`/organigrammes/${id}/validate`, { comment });
    return res.data;
  },

  rejectOrganigramme: async (id, rejectionReason, comment) => {
    const res = await API.patch(`/organigrammes/${id}/reject`, {
      rejection_reason: rejectionReason,
      comment,
    });
    return res.data;
  },

  resubmitOrganigramme: async (id, comment) => {
    const res = await API.patch(`/organigrammes/${id}/resubmit`, { comment });
    return res.data;
  },

  archiveOrganigramme: async (id, comment) => {
    const res = await API.patch(`/organigrammes/${id}/archive`, { comment });
    return res.data;
  },

  getOrganigrammeHistory: async (id) => {
    const res = await API.get(`/organigrammes/${id}/history`);
    return res.data;
  },

  cloneOrganigramme: async (id) => {
    const res = await API.post(`/organigrammes/${id}/clone`);
    return res.data;
  },

  validateHierarchy: async (snapshot) => {
    const res = await API.post('/organigrammes/validate-tree', { snapshot });
    return res.data;
  },
};
