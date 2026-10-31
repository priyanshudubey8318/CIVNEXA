import { apiClient } from './apiClient';

export const aiService = {
  /**
   * Classify complaint text and recommend category, department, priority, and summary
   * @param {{ title: string, description: string }} data
   */
  async classifyComplaint(data) {
    const response = await apiClient.post('/ai/classify', data);
    return response.data?.data || response.data;
  },

  /**
   * Generate factual case synopsis with preserved source citations
   * @param {number|string} caseId
   */
  async summarizeCase(caseId) {
    const response = await apiClient.post(`/ai/summarize-case/${caseId}`);
    return response.data?.data || response.data;
  },

  /**
   * Find potential duplicate cases using word-set similarity
   * @param {{ title: string, description: string, excludeCaseId?: number }} data
   */
  async detectDuplicates(data) {
    const response = await apiClient.post('/ai/detect-duplicates', data);
    return response.data?.data || response.data;
  },

  /**
   * Ask the Institutional Policy AI Assistant (RAG over university documents)
   * @param {string} question
   */
  async askAssistant(question) {
    const response = await apiClient.post('/ai/ask', { question });
    return response.data?.data || response.data;
  },

  /**
   * Retrieve active institutional knowledge documents
   */
  async getKnowledgeDocuments() {
    const response = await apiClient.get('/ai/knowledge');
    return response.data?.data || response.data;
  },

  /**
   * Upload and index new institutional knowledge document (PDF/TXT)
   * @param {FormData} formData
   */
  async uploadKnowledgeDocument(formData) {
    const response = await apiClient.post('/ai/knowledge/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data?.data || response.data;
  },
};
