/**
 * Shared CV Viewer Component
 * Used by both admin.html and werkgevers.html
 */

const CVViewer = {
    currentPdfUrl: null,
    isLoading: false,

    /**
     * Initialize the viewer - call this on page load
     */
    init() {
        // Create modal HTML if it doesn't exist
        if (!document.getElementById('cvViewerModal')) {
            this.createModal();
        }
    },

    /**
     * Create the modal HTML structure
     */
    createModal() {
        const modal = document.createElement('div');
        modal.id = 'cvViewerModal';
        modal.className = 'cv-viewer-modal';
        modal.innerHTML = `
            <div class="cv-viewer-overlay" onclick="CVViewer.close()"></div>
            <div class="cv-viewer-container">
                <div class="cv-viewer-header">
                    <div class="cv-viewer-title">
                        <span id="cvViewerName">CV</span>
                    </div>
                    <div class="cv-viewer-actions">
                        <button class="cv-viewer-btn" onclick="CVViewer.download()" title="Download">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                                <polyline points="7 10 12 15 17 10"></polyline>
                                <line x1="12" y1="15" x2="12" y2="3"></line>
                            </svg>
                        </button>
                        <button class="cv-viewer-btn cv-viewer-close" onclick="CVViewer.close()" title="Sluiten">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <line x1="18" y1="6" x2="6" y2="18"></line>
                                <line x1="6" y1="6" x2="18" y2="18"></line>
                            </svg>
                        </button>
                    </div>
                </div>
                <div class="cv-viewer-body">
                    <div id="cvViewerLoading" class="cv-viewer-loading">
                        <div class="cv-viewer-spinner"></div>
                        <p>CV laden...</p>
                    </div>
                    <iframe id="cvViewerFrame" class="cv-viewer-frame"></iframe>
                    <div id="cvViewerFallback" class="cv-viewer-fallback" style="display: none;">
                        <div class="cv-viewer-fallback-content">
                            <h3 id="cvFallbackName"></h3>
                            <div id="cvFallbackDetails"></div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    },

    /**
     * Check if viewer is currently loading
     * @returns {boolean}
     */
    isBusy() {
        return this.isLoading;
    },

    /**
     * Start loading state (call before async operations)
     * @param {string} name - Optional name to display while loading
     */
    startLoading(name) {
        if (this.isLoading) {
            return false;
        }
        this.isLoading = true;

        const modal = document.getElementById('cvViewerModal');
        const loading = document.getElementById('cvViewerLoading');
        const frame = document.getElementById('cvViewerFrame');
        const fallback = document.getElementById('cvViewerFallback');
        const nameEl = document.getElementById('cvViewerName');

        nameEl.textContent = name || 'CV laden...';
        loading.style.display = 'flex';
        frame.style.display = 'none';
        fallback.style.display = 'none';

        modal.classList.add('active');
        document.body.style.overflow = 'hidden';

        return true;
    },

    /**
     * Open the viewer with a CV
     * @param {Object} cv - CV object with fileData, fullName, etc.
     */
    open(cv) {
        // If not already loading, set loading state
        if (!this.isLoading) {
            this.isLoading = true;
        }
        this.currentCV = cv;

        const modal = document.getElementById('cvViewerModal');
        const frame = document.getElementById('cvViewerFrame');
        const fallback = document.getElementById('cvViewerFallback');
        const loading = document.getElementById('cvViewerLoading');
        const nameEl = document.getElementById('cvViewerName');

        nameEl.textContent = cv.fullName || 'CV';

        // Show loading state initially
        loading.style.display = 'flex';
        frame.style.display = 'none';
        fallback.style.display = 'none';

        // Clean up previous blob URL
        if (this.currentPdfUrl) {
            URL.revokeObjectURL(this.currentPdfUrl);
            this.currentPdfUrl = null;
        }

        // If we have PDF data, show it directly
        if (cv.fileData && cv.fileType === 'application/pdf') {
            try {
                const byteCharacters = atob(cv.fileData);
                const byteNumbers = new Array(byteCharacters.length);
                for (let i = 0; i < byteCharacters.length; i++) {
                    byteNumbers[i] = byteCharacters.charCodeAt(i);
                }
                const byteArray = new Uint8Array(byteNumbers);
                const blob = new Blob([byteArray], { type: 'application/pdf' });
                this.currentPdfUrl = URL.createObjectURL(blob);

                // Listen for iframe load to hide loading spinner
                frame.onload = () => {
                    loading.style.display = 'none';
                    frame.style.display = 'block';
                };

                frame.src = this.currentPdfUrl;
            } catch (e) {
                console.error('Error loading PDF:', e);
                loading.style.display = 'none';
                this.showFallback(cv);
            }
        } else {
            // No PDF data, show fallback with parsed info
            loading.style.display = 'none';
            this.showFallback(cv);
        }

        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    },

    /**
     * Show fallback view when PDF is not available
     */
    showFallback(cv) {
        const frame = document.getElementById('cvViewerFrame');
        const fallback = document.getElementById('cvViewerFallback');
        const nameEl = document.getElementById('cvFallbackName');
        const detailsEl = document.getElementById('cvFallbackDetails');

        frame.style.display = 'none';
        fallback.style.display = 'block';

        nameEl.textContent = cv.fullName || 'Onbekend';

        let html = '';

        if (cv.jobTitle) {
            html += `<div class="cv-fallback-jobtitle">${this.escapeHtml(cv.jobTitle)}</div>`;
        }
        if (cv.location) {
            html += `<div class="cv-fallback-location">${this.escapeHtml(cv.location)}</div>`;
        }
        if (cv.email) {
            html += `<div class="cv-fallback-contact"><strong>Email:</strong> ${this.escapeHtml(cv.email)}</div>`;
        }
        if (cv.phone) {
            html += `<div class="cv-fallback-contact"><strong>Telefoon:</strong> ${this.escapeHtml(cv.phone)}</div>`;
        }
        if (cv.skills) {
            html += `<div class="cv-fallback-section"><strong>Vaardigheden:</strong><br>${this.escapeHtml(cv.skills)}</div>`;
        }
        if (cv.languages) {
            html += `<div class="cv-fallback-section"><strong>Talen:</strong><br>${this.escapeHtml(cv.languages)}</div>`;
        }
        if (cv.experience) {
            html += `<div class="cv-fallback-section"><strong>Ervaring:</strong><br>${this.escapeHtml(cv.experience).replace(/\n/g, '<br>')}</div>`;
        }
        if (cv.education) {
            html += `<div class="cv-fallback-section"><strong>Opleiding:</strong><br>${this.escapeHtml(cv.education).replace(/\n/g, '<br>')}</div>`;
        }

        detailsEl.innerHTML = html || '<p>Geen details beschikbaar</p>';
    },

    /**
     * Close the viewer
     */
    close() {
        const modal = document.getElementById('cvViewerModal');
        modal.classList.remove('active');
        document.body.style.overflow = '';

        // Reset loading state
        this.isLoading = false;

        // Clean up blob URL
        if (this.currentPdfUrl) {
            URL.revokeObjectURL(this.currentPdfUrl);
            this.currentPdfUrl = null;
        }

        // Clear iframe
        const frame = document.getElementById('cvViewerFrame');
        frame.src = 'about:blank';
    },

    /**
     * Download the current CV
     */
    download() {
        if (!this.currentCV) return;

        const cv = this.currentCV;

        if (cv.fileData) {
            const byteCharacters = atob(cv.fileData);
            const byteNumbers = new Array(byteCharacters.length);
            for (let i = 0; i < byteCharacters.length; i++) {
                byteNumbers[i] = byteCharacters.charCodeAt(i);
            }
            const byteArray = new Uint8Array(byteNumbers);
            const blob = new Blob([byteArray], { type: cv.fileType || 'application/pdf' });

            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = cv.fileName || `${cv.fullName || 'cv'}.pdf`;
            link.click();
            URL.revokeObjectURL(link.href);
        }
    },

    /**
     * Escape HTML to prevent XSS
     */
    escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
};

// CSS styles for the viewer
const cvViewerStyles = `
    .cv-viewer-modal {
        display: none;
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        z-index: 10000;
    }

    .cv-viewer-modal.active {
        display: flex;
        align-items: center;
        justify-content: center;
    }

    .cv-viewer-overlay {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.8);
    }

    .cv-viewer-container {
        position: relative;
        width: 90%;
        max-width: 900px;
        height: 90vh;
        background: #fff;
        border-radius: 12px;
        display: flex;
        flex-direction: column;
        overflow: hidden;
        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
    }

    .cv-viewer-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 16px 20px;
        background: #1a1a2e;
        color: white;
        flex-shrink: 0;
    }

    .cv-viewer-title {
        font-size: 18px;
        font-weight: 600;
    }

    .cv-viewer-actions {
        display: flex;
        gap: 8px;
    }

    .cv-viewer-btn {
        background: rgba(255, 255, 255, 0.1);
        border: none;
        color: white;
        padding: 8px;
        border-radius: 8px;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: background 0.2s;
    }

    .cv-viewer-btn:hover {
        background: rgba(255, 255, 255, 0.2);
    }

    .cv-viewer-close:hover {
        background: #e74c3c;
    }

    .cv-viewer-body {
        flex: 1;
        overflow: hidden;
        position: relative;
    }

    .cv-viewer-loading {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        background: #fff;
        color: #666;
        font-size: 14px;
    }

    .cv-viewer-spinner {
        width: 40px;
        height: 40px;
        border: 3px solid #eee;
        border-top-color: #1a1a2e;
        border-radius: 50%;
        animation: cv-viewer-spin 0.8s linear infinite;
        margin-bottom: 12px;
    }

    @keyframes cv-viewer-spin {
        to { transform: rotate(360deg); }
    }

    .cv-viewer-frame {
        width: 100%;
        height: 100%;
        border: none;
    }

    .cv-viewer-fallback {
        width: 100%;
        height: 100%;
        overflow-y: auto;
        padding: 30px;
        box-sizing: border-box;
    }

    .cv-viewer-fallback-content {
        max-width: 700px;
        margin: 0 auto;
    }

    .cv-viewer-fallback h3 {
        font-size: 28px;
        margin: 0 0 10px 0;
        color: #333;
    }

    .cv-fallback-jobtitle {
        font-size: 18px;
        color: #555;
        margin-bottom: 5px;
    }

    .cv-fallback-location {
        font-size: 14px;
        color: #7eb8c9;
        margin-bottom: 20px;
    }

    .cv-fallback-contact {
        font-size: 14px;
        color: #333;
        margin-bottom: 8px;
    }

    .cv-fallback-section {
        margin-top: 20px;
        padding-top: 20px;
        border-top: 1px solid #eee;
        font-size: 14px;
        line-height: 1.6;
        color: #333;
    }

    @media (max-width: 768px) {
        .cv-viewer-container {
            width: 100%;
            height: 100%;
            border-radius: 0;
        }
    }
`;

// Inject styles
const styleEl = document.createElement('style');
styleEl.textContent = cvViewerStyles;
document.head.appendChild(styleEl);

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => CVViewer.init());
} else {
    CVViewer.init();
}
