// DOM Elements
const loadingIndicator = document.getElementById('loadingIndicator');
const errorMessage = document.getElementById('errorMessage');
const errorText = document.getElementById('errorText');
const emptyState = document.getElementById('emptyState');
const mediaGrid = document.getElementById('mediaGrid');
const searchInput = document.getElementById('searchInput');
const filterButtons = document.querySelectorAll('.filter-btn');
const totalCount = document.getElementById('totalCount');
const storageUsed = document.getElementById('storageUsed');

// Modal Elements
const mediaModal = document.getElementById('mediaModal');
const editModal = document.getElementById('editModal');

// State
let mediaItems = [];
let currentFilter = 'all';
let currentMediaId = null;

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    loadMedia();
    setupEventListeners();
});

// Setup Event Listeners
function setupEventListeners() {
    // Search
    searchInput.addEventListener('input', debounce(filterMedia, 300));
    
    // Filter buttons
    filterButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            filterButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentFilter = btn.dataset.filter;
            filterMedia();
        });
    });
    
    // Close modals
    document.querySelectorAll('.close-btn').forEach(btn => {
        btn.addEventListener('click', closeAllModals);
    });
    
    document.querySelectorAll('.edit-cancel').forEach(btn => {
        btn.addEventListener('click', () => {
            editModal.classList.remove('show');
        });
    });
    
    // Click outside modal to close
    window.addEventListener('click', (e) => {
        if (e.target === mediaModal) closeAllModals();
        if (e.target === editModal) editModal.classList.remove('show');
    });
    
    // Edit form submit
    document.getElementById('editForm').addEventListener('submit', handleEditSubmit);
    
    // Edit button
    document.getElementById('editBtn').addEventListener('click', openEditModal);
    
    // Download button
    document.getElementById('downloadBtn').addEventListener('click', downloadMedia);
    
    // Delete button
    document.getElementById('deleteBtn').addEventListener('click', deleteMedia);
}

// Load Media from API
async function loadMedia() {
    showLoading(true);
    hideError();
    
    try {
        const response = await apiCall('/media');
        mediaItems = response.data || [];
        updateStats();
        renderMedia();
    } catch (error) {
        showError(error.message);
    } finally {
        showLoading(false);
    }
}

// Render Media Grid
function renderMedia() {
    const filteredItems = getFilteredItems();
    
    if (filteredItems.length === 0) {
        mediaGrid.innerHTML = '';
        emptyState.style.display = 'block';
        return;
    }
    
    emptyState.style.display = 'none';
    
    mediaGrid.innerHTML = filteredItems.map(item => createMediaCard(item)).join('');
    
    // Add click listeners to cards
    document.querySelectorAll('.media-card').forEach(card => {
        card.addEventListener('click', () => {
            const id = card.dataset.id;
            openMediaModal(id);
        });
    });
}

// Create Media Card HTML
function createMediaCard(item) {
    const mediaType = getMediaType(item.fileType);
    const isVideo = mediaType === 'video';
    
    return `
        <div class="media-card" data-id="${item.id}">
            <div class="thumbnail">
                ${isVideo 
                    ? `<video src="${item.blobUrl}" muted></video>`
                    : `<img src="${item.blobUrl}" alt="${item.title}" loading="lazy">`
                }
                <span class="media-type">
                    <i class="fas fa-${isVideo ? 'video' : 'image'}"></i>
                    ${mediaType.toUpperCase()}
                </span>
            </div>
            <div class="card-body">
                <h3>${escapeHtml(item.title)}</h3>
                <p>${escapeHtml(item.description || 'No description')}</p>
                <div class="card-meta">
                    <span><i class="fas fa-clock"></i> ${formatDate(item.uploadedAt)}</span>
                    <span><i class="fas fa-hdd"></i> ${formatFileSize(item.fileSize)}</span>
                </div>
            </div>
        </div>
    `;
}

// Filter Media
function filterMedia() {
    renderMedia();
}

// Get Filtered Items
function getFilteredItems() {
    let items = [...mediaItems];
    
    // Apply search filter
    const searchTerm = searchInput.value.toLowerCase();
    if (searchTerm) {
        items = items.filter(item => 
            item.title.toLowerCase().includes(searchTerm) ||
            (item.description && item.description.toLowerCase().includes(searchTerm))
        );
    }
    
    // Apply type filter
    if (currentFilter !== 'all') {
        items = items.filter(item => getMediaType(item.fileType) === currentFilter);
    }
    
    return items;
}

// Update Stats
function updateStats() {
    totalCount.textContent = mediaItems.length;
    
    const totalSize = mediaItems.reduce((sum, item) => sum + (item.fileSize || 0), 0);
    storageUsed.textContent = formatFileSize(totalSize);
}

// Open Media Modal
function openMediaModal(id) {
    const item = mediaItems.find(m => m.id === id);
    if (!item) return;
    
    currentMediaId = id;
    const isVideo = getMediaType(item.fileType) === 'video';
    
    // Set media preview
    const modalImage = document.getElementById('modalImage');
    const modalVideo = document.getElementById('modalVideo');
    
    if (isVideo) {
        modalImage.style.display = 'none';
        modalVideo.style.display = 'block';
        modalVideo.src = item.blobUrl;
    } else {
        modalVideo.style.display = 'none';
        modalImage.style.display = 'block';
        modalImage.src = item.blobUrl;
    }
    
    // Set info
    document.getElementById('modalTitle').textContent = item.title;
    document.getElementById('modalDescription').textContent = item.description || 'No description';
    document.getElementById('modalFileName').textContent = item.fileName;
    document.getElementById('modalFileType').textContent = item.fileType;
    document.getElementById('modalFileSize').textContent = formatFileSize(item.fileSize);
    document.getElementById('modalUploadDate').textContent = formatDate(item.uploadedAt);
    
    // Set GPS metadata
    const gps = item.metadata?.gps || {};
    document.getElementById('modalLatitude').textContent = gps.latitude || 'N/A';
    document.getElementById('modalLongitude').textContent = gps.longitude || 'N/A';
    document.getElementById('modalAltitude').textContent = gps.altitude ? `${gps.altitude}m` : 'N/A';
    document.getElementById('modalDroneModel').textContent = item.metadata?.droneModel || 'N/A';
    
    mediaModal.classList.add('show');
}

// Open Edit Modal
function openEditModal() {
    const item = mediaItems.find(m => m.id === currentMediaId);
    if (!item) return;
    
    document.getElementById('editId').value = item.id;
    document.getElementById('editTitle').value = item.title;
    document.getElementById('editDescription').value = item.description || '';
    document.getElementById('editLatitude').value = item.metadata?.gps?.latitude || '';
    document.getElementById('editLongitude').value = item.metadata?.gps?.longitude || '';
    document.getElementById('editAltitude').value = item.metadata?.gps?.altitude || '';
    document.getElementById('editDroneModel').value = item.metadata?.droneModel || '';
    
    editModal.classList.add('show');
}

// Handle Edit Submit
async function handleEditSubmit(e) {
    e.preventDefault();
    
    const id = document.getElementById('editId').value;
    const data = {
        title: document.getElementById('editTitle').value,
        description: document.getElementById('editDescription').value,
        latitude: document.getElementById('editLatitude').value || null,
        longitude: document.getElementById('editLongitude').value || null,
        altitude: document.getElementById('editAltitude').value || null,
        droneModel: document.getElementById('editDroneModel').value
    };
    
    try {
        await apiCall(`/media/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
        
        editModal.classList.remove('show');
        closeAllModals();
        await loadMedia();
        
        alert('Media updated successfully!');
    } catch (error) {
        alert('Error updating media: ' + error.message);
    }
}

// Download Media
function downloadMedia() {
    const item = mediaItems.find(m => m.id === currentMediaId);
    if (!item) return;
    
    const link = document.createElement('a');
    link.href = item.blobUrl;
    link.download = item.fileName;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// Delete Media
async function deleteMedia() {
    if (!confirm('Are you sure you want to delete this media? This action cannot be undone.')) {
        return;
    }
    
    try {
        await apiCall(`/media/${currentMediaId}`, {
            method: 'DELETE'
        });
        
        closeAllModals();
        await loadMedia();
        
        alert('Media deleted successfully!');
    } catch (error) {
        alert('Error deleting media: ' + error.message);
    }
}

// Close All Modals
function closeAllModals() {
    mediaModal.classList.remove('show');
    editModal.classList.remove('show');
    
    // Stop video playback
    const modalVideo = document.getElementById('modalVideo');
    modalVideo.pause();
    modalVideo.src = '';
    
    currentMediaId = null;
}

// Helper Functions
function showLoading(show) {
    loadingIndicator.style.display = show ? 'block' : 'none';
    if (show) {
        mediaGrid.innerHTML = '';
        emptyState.style.display = 'none';
    }
}

function showError(message) {
    errorText.textContent = message;
    errorMessage.style.display = 'flex';
}

function hideError() {
    errorMessage.style.display = 'none';
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

