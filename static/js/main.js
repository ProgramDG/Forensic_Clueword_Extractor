// Global variables
let questionWaveSurfer = null;
let controlWaveSurfer = null;
let questionAnnotations = [];
let controlAnnotations = [];
let questionOriginalFilename = '';
let controlOriginalFilename = '';
let currentModal = null;
let pendingRegion = null;
let pendingPanelType = null;

// Initialize application
document.addEventListener('DOMContentLoaded', function() {
    initializeEventListeners();
    initializeProgressSteps();
    updateStatus('Ready - Upload audio files to begin');
});

function initializeEventListeners() {
    // File upload listeners
    document.getElementById('question-file-input').addEventListener('change', (e) => handleFileUpload(e, 'question'));
    document.getElementById('control-file-input').addEventListener('change', (e) => handleFileUpload(e, 'control'));
    
    // Control button listeners
    setupControlButtons();
    
    // Generate button listener
    document.getElementById('generate-button').addEventListener('click', generateClueWords);
    
    // Modal listeners
    setupModalListeners();
}

function setupControlButtons() {
    // Question controls
    document.getElementById('q-zoom-in').addEventListener('click', () => zoomWaveform('question', 1.5));
    document.getElementById('q-zoom-out').addEventListener('click', () => zoomWaveform('question', 0.75));
    document.getElementById('q-play').addEventListener('click', () => playWaveform('question'));
    document.getElementById('q-pause').addEventListener('click', () => pauseWaveform('question'));
    document.getElementById('q-stop').addEventListener('click', () => stopWaveform('question'));
    
    // Control controls
    document.getElementById('c-zoom-in').addEventListener('click', () => zoomWaveform('control', 1.5));
    document.getElementById('c-zoom-out').addEventListener('click', () => zoomWaveform('control', 0.75));
    document.getElementById('c-play').addEventListener('click', () => playWaveform('control'));
    document.getElementById('c-pause').addEventListener('click', () => pauseWaveform('control'));
    document.getElementById('c-stop').addEventListener('click', () => stopWaveform('control'));
}

function setupModalListeners() {
    // Annotation modal
    document.getElementById('annotation-form').addEventListener('submit', handleAnnotationSubmit);
    document.getElementById('annotation-cancel').addEventListener('click', closeAnnotationModal);
    
    // Error modal
    document.getElementById('error-close').addEventListener('click', closeErrorModal);
    
    // Close modals on backdrop click
    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('modal')) {
            if (e.target.id === 'error-modal') closeErrorModal();
            if (e.target.id === 'annotation-modal') closeAnnotationModal();
        }
    });
}

async function handleFileUpload(event, panelType) {
    const file = event.target.files[0];
    if (!file) return;
    
    try {
        showLoading('Standardizing audio...');
        
        const formData = new FormData();
        formData.append('audio_file', file);
        formData.append('type', panelType);
        
        const response = await fetch('/standardize', {
            method: 'POST',
            body: formData
        });
        
        const result = await response.json();
        
        if (!response.ok) {
            throw new Error(result.error || 'Failed to process audio');
        }
        
        // Update filename display
        const filenameElement = document.getElementById(`${panelType}-filename`);
        filenameElement.textContent = result.original_filename;
        filenameElement.classList.add('loaded');
        
        // Store original filename
        if (panelType === 'question') {
            questionOriginalFilename = result.original_filename;
        } else {
            controlOriginalFilename = result.original_filename;
        }
        
        // Initialize waveform
        await initializeWaveform(panelType, result.url);
        
        updateGenerateButtonState();
        
        // Check if both files are loaded to advance to step 2
        if (questionWaveSurfer && controlWaveSurfer) {
            updateProgressStep(2);
        } else {
            updateProgressStep(1);
        }
        
        updateStatus(`${panelType.charAt(0).toUpperCase() + panelType.slice(1)} audio loaded successfully`);
        
    } catch (error) {
        console.error('Error uploading file:', error);
        showError(`Failed to upload ${panelType} audio: ${error.message}`);
    } finally {
        hideLoading();
    }
}

async function initializeWaveform(panelType, audioUrl) {
    const containerId = `${panelType}-waveform`;
    const container = document.getElementById(containerId);
    
    // Clear existing waveform
    container.innerHTML = '';
    
    // Create new WaveSurfer instance
    const wavesurfer = WaveSurfer.create({
        container: `#${containerId}`,
        waveColor: getComputedStyle(document.documentElement).getPropertyValue('--waveform-color'),
        progressColor: getComputedStyle(document.documentElement).getPropertyValue('--waveform-progress-color'),
        cursorColor: '#ffffff',
        barWidth: 2,
        barRadius: 1,
        responsive: true,
        height: 80,
        normalize: true,
        minPxPerSec: 50, // Set initial zoom level
        plugins: [
            WaveSurfer.regions.create({
                regionsMinLength: 0.1,
                regions: [],
                dragSelection: {
                    slop: 5
                }
            })
        ]
    });
    
    // Store wavesurfer instance
    if (panelType === 'question') {
        questionWaveSurfer = wavesurfer;
    } else {
        controlWaveSurfer = wavesurfer;
    }
    
    // Load audio
    await new Promise((resolve, reject) => {
        wavesurfer.load(audioUrl);
        wavesurfer.on('ready', resolve);
        wavesurfer.on('error', reject);
    });
    
    // Setup region creation
    wavesurfer.on('region-created', (region) => handleRegionCreated(region, panelType));
    wavesurfer.on('region-click', (region, e) => {
        e.stopPropagation();
        playRegion(region);
    });
    
    // Enable region selection
    wavesurfer.enableDragSelection({
        color: getComputedStyle(document.documentElement).getPropertyValue('--region-color')
    });
}

function handleRegionCreated(region, panelType) {
    // Store region info for annotation
    pendingRegion = region;
    pendingPanelType = panelType;
    
    // Show annotation modal
    showAnnotationModal(region.start, region.end);
}

function showAnnotationModal(start, end) {
    const modal = document.getElementById('annotation-modal');
    const timeDisplay = document.getElementById('annotation-time-display');
    const labelInput = document.getElementById('annotation-label');
    
    timeDisplay.textContent = `${formatTime(start)} - ${formatTime(end)} (${formatDuration(end - start)})`;
    labelInput.value = '';
    
    modal.style.display = 'block';
    labelInput.focus();
    currentModal = 'annotation';
}

function handleAnnotationSubmit(event) {
    event.preventDefault();
    
    if (!pendingRegion || !pendingPanelType) return;
    
    const label = document.getElementById('annotation-label').value.trim();
    if (!label) return;
    
    // Create annotation object
    const annotation = {
        id: Date.now(),
        label: label,
        start: pendingRegion.start,
        end: pendingRegion.end,
        region: pendingRegion
    };
    
    // Add to appropriate annotations array
    if (pendingPanelType === 'question') {
        questionAnnotations.push(annotation);
    } else {
        controlAnnotations.push(annotation);
    }
    
    // Update region appearance and add label
    pendingRegion.update({
        attributes: {
            label: label
        }
    });
    
    // Update annotations display
    updateAnnotationsDisplay(pendingPanelType);
    
    // Clear pending data
    pendingRegion = null;
    pendingPanelType = null;
    
    closeAnnotationModal();
    updateGenerateButtonState();
    updateProgressStep(3);
    updateStatus(`Annotation "${label}" added to ${pendingPanelType || 'audio'}`);
}

function closeAnnotationModal() {
    const modal = document.getElementById('annotation-modal');
    modal.style.display = 'none';
    
    // Remove pending region if cancelled
    if (pendingRegion && pendingPanelType) {
        pendingRegion.remove();
        pendingRegion = null;
        pendingPanelType = null;
    }
    
    currentModal = null;
}

function updateAnnotationsDisplay(panelType) {
    const container = document.getElementById(`${panelType}-annotations`);
    const annotations = panelType === 'question' ? questionAnnotations : controlAnnotations;
    
    if (annotations.length === 0) {
        container.innerHTML = '<div class="empty-state">No annotations yet. Click on the waveform to add cluewords.</div>';
        return;
    }
    
    container.innerHTML = annotations.map(ann => `
        <div class="annotation-item" data-id="${ann.id}">
            <div>
                <div class="annotation-label">${escapeHtml(ann.label)}</div>
                <div class="annotation-time">${formatTime(ann.start)} - ${formatTime(ann.end)}</div>
            </div>
            <div class="annotation-actions">
                <button class="control-btn btn-small" onclick="playAnnotation('${panelType}', ${ann.id})">Play</button>
                <button class="control-btn btn-small btn-danger" onclick="deleteAnnotation('${panelType}', ${ann.id})">Delete</button>
            </div>
        </div>
    `).join('');
}

function playAnnotation(panelType, annotationId) {
    const annotations = panelType === 'question' ? questionAnnotations : controlAnnotations;
    const annotation = annotations.find(ann => ann.id === annotationId);
    
    if (annotation && annotation.region) {
        playRegion(annotation.region);
    }
}

function deleteAnnotation(panelType, annotationId) {
    const annotations = panelType === 'question' ? questionAnnotations : controlAnnotations;
    const index = annotations.findIndex(ann => ann.id === annotationId);
    
    if (index !== -1) {
        const annotation = annotations[index];
        if (annotation.region) {
            annotation.region.remove();
        }
        annotations.splice(index, 1);
        updateAnnotationsDisplay(panelType);
        updateGenerateButtonState();
        updateStatus(`Annotation "${annotation.label}" deleted`);
    }
}

function playRegion(region) {
    region.play();
}

function zoomWaveform(panelType, factor) {
    const wavesurfer = panelType === 'question' ? questionWaveSurfer : controlWaveSurfer;
    if (wavesurfer && wavesurfer.isReady) {
        const currentZoom = wavesurfer.params.minPxPerSec || 50;
        const newZoom = Math.max(10, Math.min(1000, currentZoom * factor));
        wavesurfer.zoom(newZoom);
        
        // Update status to show current zoom level
        const zoomLevel = Math.round((newZoom / 50) * 100);
        updateStatus(`${panelType.charAt(0).toUpperCase() + panelType.slice(1)} waveform zoom: ${zoomLevel}%`);
    }
}

function playWaveform(panelType) {
    const wavesurfer = panelType === 'question' ? questionWaveSurfer : controlWaveSurfer;
    if (wavesurfer) {
        wavesurfer.play();
    }
}

function pauseWaveform(panelType) {
    const wavesurfer = panelType === 'question' ? questionWaveSurfer : controlWaveSurfer;
    if (wavesurfer) {
        wavesurfer.pause();
    }
}

function stopWaveform(panelType) {
    const wavesurfer = panelType === 'question' ? questionWaveSurfer : controlWaveSurfer;
    if (wavesurfer) {
        wavesurfer.stop();
    }
}

async function generateClueWords() {
    if (!canGenerate()) return;
    
    try {
        const bandpassEnabled = document.getElementById('enable-bandpass').checked;
        showLoading(`Processing annotations and generating cluewords${bandpassEnabled ? ' with bandpass filtering' : ''}...`);
        showProgressBar();
        
        const formData = new FormData();
        formData.append('annotations', JSON.stringify({
            question: questionAnnotations.map(ann => ({
                label: ann.label,
                start: ann.start,
                end: ann.end
            })),
            control: controlAnnotations.map(ann => ({
                label: ann.label,
                start: ann.start,
                end: ann.end
            }))
        }));
        formData.append('question_original_filename', questionOriginalFilename);
        formData.append('control_original_filename', controlOriginalFilename);
        formData.append('enable_bandpass', bandpassEnabled.toString());
        
        const response = await fetch('/process', {
            method: 'POST',
            body: formData
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Processing failed');
        }
        
        // Handle file download
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'clueword_analysis.zip';
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        
        updateProgressStep(4);
        updateStatus(`Clueword analysis complete! ${bandpassEnabled ? 'Bandpass filtered files included. ' : ''}Download started.`);
        
    } catch (error) {
        console.error('Error generating cluewords:', error);
        showError(`Failed to generate cluewords: ${error.message}`);
        updateStatus('Error during clueword generation', 'error');
    } finally {
        hideLoading();
        hideProgressBar();
    }
}

function updateGenerateButtonState() {
    const button = document.getElementById('generate-button');
    const canGen = canGenerate();
    button.disabled = !canGen;
    
    if (canGen) {
        const questionCount = questionAnnotations.length;
        const controlCount = controlAnnotations.length;
        button.textContent = `Generate CLUE WORDS (Q:${questionCount}, C:${controlCount})`;
    } else {
        button.textContent = 'Generate CLUE WORDS';
    }
}

function canGenerate() {
    return questionWaveSurfer && 
           controlWaveSurfer && 
           questionAnnotations.length > 0 && 
           controlAnnotations.length > 0 &&
           questionOriginalFilename &&
           controlOriginalFilename;
}

function updateStatus(message, type = '') {
    const statusElement = document.getElementById('status-area');
    statusElement.textContent = message;
    statusElement.className = 'status';
    if (type) {
        statusElement.classList.add(type);
    }
}

function showLoading(message = 'Processing...') {
    const modal = document.getElementById('loading-modal');
    const text = document.getElementById('loading-text');
    text.textContent = message;
    modal.style.display = 'block';
}

function hideLoading() {
    const modal = document.getElementById('loading-modal');
    modal.style.display = 'none';
}

function showError(message) {
    const modal = document.getElementById('error-modal');
    const text = document.getElementById('error-text');
    text.textContent = message;
    modal.style.display = 'block';
}

function closeErrorModal() {
    const modal = document.getElementById('error-modal');
    modal.style.display = 'none';
}

// Utility functions
function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = (seconds % 60).toFixed(2);
    return `${mins}:${secs.padStart(5, '0')}`;
}

function formatDuration(seconds) {
    return `${seconds.toFixed(2)}s`;
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Handle window resize
window.addEventListener('resize', function() {
    if (questionWaveSurfer) {
        questionWaveSurfer.drawBuffer();
    }
    if (controlWaveSurfer) {
        controlWaveSurfer.drawBuffer();
    }
});

// Progress step management
function initializeProgressSteps() {
    updateProgressStep(1); // Start with step 1 active
}

function updateProgressStep(step) {
    // Update progress indicators
    document.querySelectorAll('.progress-step').forEach((el, index) => {
        const stepNum = index + 1;
        el.classList.remove('active', 'completed');
        
        if (stepNum < step) {
            el.classList.add('completed');
        } else if (stepNum === step) {
            el.classList.add('active');
        }
    });
    
    // Update instruction steps
    document.querySelectorAll('.instruction-step').forEach((el, index) => {
        const stepNum = index + 1;
        el.classList.remove('active', 'completed');
        
        if (stepNum < step) {
            el.classList.add('completed');
        } else if (stepNum === step) {
            el.classList.add('active');
        }
    });
}

function showProgressBar() {
    const progressBar = document.getElementById('progress-bar');
    const progressFill = progressBar.querySelector('.progress-fill');
    progressBar.classList.remove('hidden');
    
    // Animate progress
    let progress = 0;
    const interval = setInterval(() => {
        progress += Math.random() * 15;
        if (progress > 90) progress = 90;
        progressFill.style.width = progress + '%';
    }, 200);
    
    // Store interval for cleanup
    progressBar.dataset.interval = interval;
}

function hideProgressBar() {
    const progressBar = document.getElementById('progress-bar');
    const progressFill = progressBar.querySelector('.progress-fill');
    
    // Complete the progress
    progressFill.style.width = '100%';
    
    // Clear interval
    if (progressBar.dataset.interval) {
        clearInterval(progressBar.dataset.interval);
        delete progressBar.dataset.interval;
    }
    
    // Hide after brief completion display
    setTimeout(() => {
        progressBar.classList.add('hidden');
        progressFill.style.width = '0%';
    }, 1000);
}

// Handle page unload warning if there are unsaved annotations
window.addEventListener('beforeunload', function(e) {
    if (questionAnnotations.length > 0 || controlAnnotations.length > 0) {
        const message = 'You have unsaved annotations. Are you sure you want to leave?';
        e.returnValue = message;
        return message;
    }
});
