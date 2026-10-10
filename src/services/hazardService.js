import { apiClient } from './apiClient';

export const hazardService = {
  async getHazards() {
    return apiClient.request('/hazards');
  },
  async verifyHazard(id, status) {
    return apiClient.request(`/hazards/${id}/verify`, {
      method: 'PATCH',
      body: JSON.stringify({ status })
    });
  }
};

export const complaintService = {
  async getComplaints() {
    return apiClient.request('/complaints');
  },
  async createComplaint(data) {
    return apiClient.request('/complaints', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }
};

export const surveyService = {
  async createSurvey(data) {
    return apiClient.request('/surveys', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }
};

export const workOrderService = {
  async createWorkOrder(data) {
    return apiClient.request('/work-orders', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }
};

export const notificationService = {
  async getNotifications() {
    return apiClient.request('/notifications');
  }
};
