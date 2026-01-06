// DOM Elements
const uploadForm = document.getElementById('uploadForm');
const dropZone = document.getElementById('dropZone');
const fileInput = document.getElementById('fileInput');
const filePreview = document.getElementById('filePreview');
const previewImage = document.getElementById('previewImage');
const previewVideo = document.getElementById('previewVideo');
const removeFileBtn = document.getElementById('removeFile');
const submitBtn = document.getElementById('submitBtn');
const getLocationBtn = document.getElementById('getLocation');
const uploadProgress = document.getElementById('uploadProgress');
const progressFill = document.getElementById('progressFill');
const progressText = document.getElementById('progressText');
const successMessage = document.getElementById('successMessage');
const errorMessage = document.getElementById('errorMessage');
const errorText = document.getElementById('errorText');

// State
let selectedFile = null;

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    setupEventListeners();
});

// Setup Event Listeners
function setupEventListeners() {
    // Drop zone click
    dropZone.addEventListener('click', () => fileInput.click());
    
    // File input change
    fileInput.addEventListener('change', handleFileSelect);
    
    // Drag and drop
    dropZone.addEventListener('dragover', handleDragOver);
    dropZone.addEventListener('dragleave', handleDragLeave);
    dropZone.addEventListener('drop', handleDrop);
    
    // Remove file
    removeFileBtn.addEventListener('click', removeFile);
    
    // Get location
    getLocationBtn.addEventListener('click', getCurrentLocation);
    
    // Form submit
    uploadForm.addEventListener('submit', handleUpload);
}

// Handle File Select
function handleFileSelect(e) {
    const file = e.target.files[0];
    if (file) {
        validateAndPreviewFile(file);
    }
}

// Handle Drag Over
function handleDragOver(e) {
    e.preventDefault();
    e.stopPropagation();
    dropZone.classList.add('dragover');
}

// Handle Drag Leave
function handleDragLeave(e) {
    e.preventDefault();
    e.stopPropagation();
    dropZone.classList.remove('dragover');
}

// Handle Drop
function handleDrop(e) {
    e.preventDefault();
    e.stopPropagation();
    dropZone.classList.remove('dragover');
    
    const file = e.dataTransfer.files[0];
    if (file) {
        validateAndPreviewFile(file);
    }
}

// Validate and Preview File
function validateAndPreviewFile(file) {
    hideMessages();
    
    // Check file type
    const allowedTypes = [...CONFIG.ALLOWED_IMAGE_TYPES, ...CONFIG.ALLOWED_VIDEO_TYPES];
    if (!allowedTypes.includes(file.type)) {
        showError('Invalid file type. Please upload an image or video file.');
        return;
    }
    
    // Check file size
    if (file.size > CONFIG.MAX_FILE_SIZE) {
        showError(`File too large. Maximum size is ${formatFileSize(CONFIG.MAX_FILE_SIZE)}.`);
        return;
    }
    
    selectedFile = file;
    
    // Show preview
    const isVideo = CONFIG.ALLOWED_VIDEO_TYPES.includes(file.type);
    const fileURL = URL.createObjectURL(file);
    
    if (isVideo) {
        previewImage.style.display = 'none';
        previewVideo.style.display = 'block';
        previewVideo.src = fileURL;
    } else {
        previewVideo.style.display = 'none';
        previewImage.style.display = 'block';
        previewImage.src = fileURL;
    }
    
    // Update file info
    document.getElementById('fileName').textContent = file.name;
    document.getElementById('fileSize').textContent = formatFileSize(file.size);
    document.getElementById('fileType').textContent = file.type;
    
    // Show preview section
    dropZone.style.display = 'none';
    filePreview.style.display = 'flex';
    
    // Enable submit button
    submitBtn.disabled = false;
    
    // Auto-fill title if empty
    const titleInput = document.getElementById('title');
    if (!titleInput.value) {
        titleInput.value = file.name.split('.').slice(0, -1).join('.');
    }
}

// Remove File
function removeFile() {
    selectedFile = null;
    fileInput.value = '';
    
    // Clear previews
    previewImage.src = '';
    previewVideo.src = '';
    
    // Show drop zone
    dropZone.style.display = 'block';
    filePreview.style.display = 'none';
    
    // Disable submit
    submitBtn.disabled = true;
    
    hideMessages();
}

// Get Current Location
function getCurrentLocation() {
    if (!navigator.geolocation) {
        showError('Geolocation is not supported by your browser.');
        return;
    }
    
    getLocationBtn.disabled = true;
    getLocationBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Getting location...';
    
    navigator.geolocation.getCurrentPosition(
        (position) => {
            document.getElementById('latitude').value = position.coords.latitude.toFixed(6);
            document.getElementById('longitude').value = position.coords.longitude.toFixed(6);
            
            if (position.coords.altitude) {
                document.getElementById('altitude').value = position.coords.altitude.toFixed(1);
            }
            
            getLocationBtn.disabled = false;
            getLocationBtn.innerHTML = '<i class="fas fa-crosshairs"></i> Get Current Location';
        },
        (error) => {
            showError('Unable to get your location: ' + error.message);
            getLocationBtn.disabled = false;
            getLocationBtn.innerHTML = '<i class="fas fa-crosshairs"></i> Get Current Location';
        },
        {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 0
        }
    );
}

// Handle Upload
async function handleUpload(e) {
    e.preventDefault();
    
    if (!selectedFile) {
        showError('Please select a file to upload.');
        return;
    }
    
    hideMessages();
    showProgress(true);
    submitBtn.disabled = true;
    
    try {
        // Create FormData
        const formData = new FormData();
        formData.append('file', selectedFile);
        formData.append('title', document.getElementById('title').value);
        formData.append('description', document.getElementById('description').value);
        formData.append('latitude', document.getElementById('latitude').value);
        formData.append('longitude', document.getElementById('longitude').value);
        formData.append('altitude', document.getElementById('altitude').value);
        formData.append('droneModel', document.getElementById('droneModel').value);
        formData.append('missionId', document.getElementById('missionId').value);
        
        // Simulate progress (real progress would require XMLHttpRequest)
        simulateProgress();
        
        // Upload
        const response = await fetch(`${CONFIG.API_BASE_URL}/media`, {
            method: 'POST',
            body: formData
        });
        
        if (!response.ok) {
            const error = await response.json().catch(() => ({ error: 'Upload failed' }));
            throw new Error(error.error || 'Upload failed');
        }
        
        // Complete progress
        setProgress(100, 'Upload complete!');
        
        // Show success
        setTimeout(() => {
            showProgress(false);
            showSuccess();
            resetForm();
        }, 500);
        
    } catch (error) {
        showProgress(false);
        showError('Upload failed: ' + error.message);
        submitBtn.disabled = false;
    }
}

// Progress Helpers
function showProgress(show) {
    uploadProgress.style.display = show ? 'block' : 'none';
    if (show) {
        setProgress(0, 'Uploading...');
    }
}

function setProgress(percent, text) {
    progressFill.style.width = `${percent}%`;
    progressText.textContent = text;
}

function simulateProgress() {
    let progress = 0;
    const interval = setInterval(() => {
        progress += Math.random() * 15;
        if (progress >= 90) {
            clearInterval(interval);
            progress = 90;
        }
        setProgress(progress, `Uploading... ${Math.round(progress)}%`);
    }, 200);
}

// Message Helpers
function showError(message) {
    errorText.textContent = message;
    errorMessage.style.display = 'flex';
    successMessage.style.display = 'none';
}

function showSuccess() {
    successMessage.style.display = 'flex';
    errorMessage.style.display = 'none';
}

function hideMessages() {
    successMessage.style.display = 'none';
    errorMessage.style.display = 'none';
}

// Reset Form
function resetForm() {
    removeFile();
    uploadForm.reset();
}

