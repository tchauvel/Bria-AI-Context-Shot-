// API configuration for ContextShot
const API_BASE_URL = (import.meta as any).env?.VITE_API_URL || 'http://localhost:8000'

export const apiConfig = {
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
}

// API endpoints
export const endpoints = {
  health: '/health',
  uploadSingle: '/upload/single',
  uploadBatch: '/upload/batch',
  batchStatus: (batchId: string) => `/batch/${batchId}/status`,
  batchResults: (batchId: string) => `/batch/${batchId}/results`,
  stats: '/stats',
  resetStats: '/stats/reset',
  contextPreview: '/context/preview',
}

// Helper function to get full API URL
export const getApiUrl = (endpoint: string) => `${API_BASE_URL}${endpoint}`

// Error handling
export const handleApiError = (error: any) => {
  console.error('API Error:', error)
  
  if (error.response) {
    // Server responded with error status
    return {
      message: error.response.data?.detail || error.response.data?.message || 'Server error',
      status: error.response.status
    }
  } else if (error.request) {
    // Request was made but no response received
    return {
      message: 'Network error - please check your connection',
      status: 0
    }
  } else {
    // Something else happened
    return {
      message: error.message || 'Unknown error occurred',
      status: 0
    }
  }
}
