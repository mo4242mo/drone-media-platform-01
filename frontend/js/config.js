// API Configuration
// Update this URL after deploying your Azure Functions
const CONFIG = {
    // For local development, use:
    // API_BASE_URL: 'http://localhost:7071/api'
    
    // For Azure Static Web Apps with managed functions, use relative path:
    API_BASE_URL: '/api',
    
    // Supported file types
    ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
    ALLOWED_VIDEO_TYPES: ['video/mp4', 'video/quicktime', 'video/webm'],
    
    // Max file size (100MB)
    MAX_FILE_SIZE: 100 * 1024 * 1024
};

// Helper function to format file size
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Helper function to format date
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// Helper function to get media type
function getMediaType(fileType) {
    if (CONFIG.ALLOWED_IMAGE_TYPES.includes(fileType)) {
        return 'image';
    } else if (CONFIG.ALLOWED_VIDEO_TYPES.includes(fileType)) {
        return 'video';
    }
    return 'unknown';
}

// API call helper
async function apiCall(endpoint, options = {}) {
    const url = `${CONFIG.API_BASE_URL}${endpoint}`;
    
    const defaultOptions = {
        headers: {
            'Accept': 'application/json'
        }
    };
    
    // Don't set Content-Type for FormData (browser will set it with boundary)
    if (!(options.body instanceof FormData)) {
        defaultOptions.headers['Content-Type'] = 'application/json';
    }
    
    const response = await fetch(url, { ...defaultOptions, ...options });
    
    if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Request failed' }));
        throw new Error(error.error || `HTTP error! status: ${response.status}`);
    }
    
    return response.json();
}

