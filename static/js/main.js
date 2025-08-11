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
let lastClickedTime = { question: 0, control: 0 };

// New variables for pending regions that need naming
let pendingRegions = { question: [], control: [] };

// Zoom slider variables
let questionZoomSlider = null;
let controlZoomSlider = null;

// Session management variables
let currentSessionId = null;
let currentSessionName = '';
let availableSessions = [];

// Zoom tracking
let questionZoomLevel = 1;
let controlZoomLevel = 1;
let activeWaveform = null;

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
    
    // Session management listeners
    setupSessionListeners();
    
    // Waveform activation listeners
    setupWaveformActivation();
    
    // Generate button listener
    document.getElementById('generate-button').addEventListener('click', generateClueWords);
    
    // Modal listeners
    setupModalListeners();
}

function setupSessionListeners() {
    document.getElementById('save-session-btn').addEventListener('click', openSaveSessionModal);
    document.getElementById('load-session-btn').addEventListener('click', openLoadSessionModal);
    document.getElementById('new-session-btn').addEventListener('click', createNewSession);
}

function setupWaveformActivation() {
    const questionContainer = document.getElementById('question-waveform');
    const controlContainer = document.getElementById('control-waveform');
    
    questionContainer.addEventListener('click', () => activateWaveform('question'));
    controlContainer.addEventListener('click', () => activateWaveform('control'));
    
    // Enhanced mouse wheel zoom with better event handling
    setupZoomHandlers(questionContainer, 'question');
    setupZoomHandlers(controlContainer, 'control');
}

function setupZoomHandlers(container, type) {
    // Remove any existing wheel listeners to prevent duplicates
    container.removeEventListener('wheel', container._zoomHandler);
    
    // Create a new zoom handler
    container._zoomHandler = (e) => handleWheelZoom(e, type);
    
    // Add the wheel listener with proper options
    container.addEventListener('wheel', container._zoomHandler, { 
        passive: false, 
        capture: true 
    });
    
    // Also add wheel listener to the document for better coverage
    document.addEventListener('wheel', (e) => {
        // Check if the mouse is over the container
        const rect = container.getBoundingClientRect();
        const isOverContainer = e.clientX >= rect.left && 
                               e.clientX <= rect.right && 
                               e.clientY >= rect.top && 
                               e.clientY <= rect.bottom;
        
        if (isOverContainer && container.getAttribute('data-active') === 'true') {
            handleWheelZoom(e, type);
        }
    }, { passive: false });
}

function activateWaveform(type) {
    // Deactivate all waveforms
    document.getElementById('question-waveform').setAttribute('data-active', 'false');
    document.getElementById('control-waveform').setAttribute('data-active', 'false');
    
    // Activate selected waveform
    const container = document.getElementById(`${type}-waveform`);
    container.setAttribute('data-active', 'true');
    activeWaveform = type;
    
    // Ensure container is focusable and focused for keyboard events
    container.setAttribute('tabindex', '0');
    container.focus();
    
    // Reinitialize zoom handlers for the active waveform
    setupZoomHandlers(container, type);
    
    updateStatus(`${type.charAt(0).toUpperCase() + type.slice(1)} waveform activated - Use mouse wheel to zoom`);
}

function handleWheelZoom(e, type) {
    // Prevent default scrolling behavior
    e.preventDefault();
    e.stopPropagation();
    
    // Check if waveform is active
    const container = document.getElementById(`${type}-waveform`);
    if (!container || container.getAttribute('data-active') !== 'true') {
        return;
    }
    
    const wavesurfer = type === 'question' ? questionWaveSurfer : controlWaveSurfer;
    if (!wavesurfer) {
        console.warn(`WaveSurfer not available for ${type}`);
        return;
    }
    
    // Check if WaveSurfer is ready
    if (!wavesurfer.isReady) {
        console.warn(`WaveSurfer not ready for ${type}`);
        return;
    }
    
    // Calculate zoom delta
    const delta = e.deltaY > 0 ? 0.8 : 1.25;
    
    try {
        let newZoomLevel;
        
        if (type === 'question') {
            questionZoomLevel = Math.max(0.1, Math.min(100, questionZoomLevel * delta));
            newZoomLevel = questionZoomLevel;
        } else {
            controlZoomLevel = Math.max(0.1, Math.min(100, controlZoomLevel * delta));
            newZoomLevel = controlZoomLevel;
        }
        
        // Update zoom display
        updateZoomDisplay(type, newZoomLevel);
        
        // Apply zoom using multiple methods for better compatibility
        const zoomValue = newZoomLevel * 10;
        
        // Method 1: Try the zoom method
        if (typeof wavesurfer.zoom === 'function') {
            wavesurfer.zoom(zoomValue);
        }
        // Method 2: Try setting minPxPerSec
        else if (typeof wavesurfer.setMinPxPerSec === 'function') {
            wavesurfer.setMinPxPerSec(zoomValue);
        }
        // Method 3: Try setting zoom level directly
        else if (wavesurfer.params) {
            wavesurfer.params.minPxPerSec = zoomValue;
            wavesurfer.drawBuffer();
        }
        
        // Update status to show zoom level
        updateStatus(`${type.charAt(0).toUpperCase() + type.slice(1)} zoom: ${newZoomLevel.toFixed(1)}x`);
        
    } catch (error) {
        console.warn('Zoom operation failed:', error);
        updateStatus(`Zoom failed for ${type} waveform`, 'error');
    }
}

function updateZoomDisplay(type, level) {
    const displayElement = document.getElementById(`${type === 'question' ? 'q' : 'c'}-zoom-level`);
    displayElement.textContent = `Zoom: ${level.toFixed(1)}x`;
    
    // Update zoom slider if it exists
    const slider = type === 'question' ? questionZoomSlider : controlZoomSlider;
    if (slider) {
        slider.value = level;
    }
}

function createZoomSlider(type) {
    const container = document.getElementById(`${type}-waveform`);
    if (!container) return;
    
    // Remove existing zoom slider if any
    const existingSlider = container.querySelector('.zoom-slider');
    if (existingSlider) {
        existingSlider.remove();
    }
    
    // Create zoom slider container
    const sliderContainer = document.createElement('div');
    sliderContainer.className = 'zoom-slider-container';
    
    // Create zoom slider
    const slider = document.createElement('input');
    slider.type = 'range';
    slider.min = '0.1';
    slider.max = '100';
    slider.step = '0.1';
    slider.value = type === 'question' ? questionZoomLevel : controlZoomLevel;
    slider.className = 'zoom-slider';
    slider.id = `${type}-zoom-slider`;
    
    // Create zoom labels
    const zoomOutLabel = document.createElement('span');
    zoomOutLabel.className = 'zoom-label zoom-out';
    zoomOutLabel.textContent = '−';
    zoomOutLabel.title = 'Zoom Out';
    
    const zoomInLabel = document.createElement('span');
    zoomInLabel.className = 'zoom-label zoom-in';
    zoomInLabel.textContent = '+';
    zoomInLabel.title = 'Zoom In';
    
    // Create zoom value display
    const zoomValue = document.createElement('span');
    zoomValue.className = 'zoom-value';
    zoomValue.textContent = `${slider.value}x`;
    
    // Assemble the slider container
    sliderContainer.appendChild(zoomOutLabel);
    sliderContainer.appendChild(slider);
    sliderContainer.appendChild(zoomInLabel);
    sliderContainer.appendChild(zoomValue);
    
    // Add to waveform container
    container.appendChild(sliderContainer);
    
    // Store slider reference
    if (type === 'question') {
        questionZoomSlider = slider;
    } else {
        controlZoomSlider = slider;
    }
    
    // Add event listener
    slider.addEventListener('input', (e) => {
        const newZoomLevel = parseFloat(e.target.value);
        applyZoom(type, newZoomLevel);
        zoomValue.textContent = `${newZoomLevel.toFixed(1)}x`;
    });
    
    // Add click handlers for zoom buttons
    zoomOutLabel.addEventListener('click', () => {
        const currentValue = parseFloat(slider.value);
        const newValue = Math.max(0.1, currentValue * 0.8);
        slider.value = newValue;
        applyZoom(type, newValue);
        zoomValue.textContent = `${newValue.toFixed(1)}x`;
    });
    
    zoomInLabel.addEventListener('click', () => {
        const currentValue = parseFloat(slider.value);
        const newValue = Math.min(100, currentValue * 1.25);
        slider.value = newValue;
        applyZoom(type, newValue);
        zoomValue.textContent = `${newValue.toFixed(1)}x`;
    });
}

function applyZoom(type, zoomLevel) {
    const wavesurfer = type === 'question' ? questionWaveSurfer : controlWaveSurfer;
    
    if (!wavesurfer || !wavesurfer.isReady) {
        console.warn(`WaveSurfer not ready for ${type}`);
        return;
    }
    
    try {
        // Update zoom level tracking
        if (type === 'question') {
            questionZoomLevel = zoomLevel;
        } else {
            controlZoomLevel = zoomLevel;
        }
        
        // Update zoom display
        updateZoomDisplay(type, zoomLevel);
        
        // Apply zoom using multiple methods for better compatibility
        const zoomValue = zoomLevel * 10;
        
        // Method 1: Try the zoom method
        if (typeof wavesurfer.zoom === 'function') {
            wavesurfer.zoom(zoomValue);
        }
        // Method 2: Try setting minPxPerSec
        else if (typeof wavesurfer.setMinPxPerSec === 'function') {
            wavesurfer.setMinPxPerSec(zoomValue);
        }
        // Method 3: Try setting zoom level directly
        else if (wavesurfer.params) {
            wavesurfer.params.minPxPerSec = zoomValue;
            wavesurfer.drawBuffer();
        }
        
        // Update status to show zoom level
        updateStatus(`${type.charAt(0).toUpperCase() + type.slice(1)} zoom: ${zoomLevel.toFixed(1)}x`);
        
    } catch (error) {
        console.warn('Zoom operation failed:', error);
        updateStatus(`Zoom failed for ${type} waveform`, 'error');
    }
}

function setupControlButtons() {
    // Question controls
    document.getElementById('q-play-pause').addEventListener('click', () => togglePlayPause('question'));
    document.getElementById('q-stop').addEventListener('click', () => stopWaveform('question'));
    document.getElementById('q-name-segment').addEventListener('click', () => handleNameSegmentClick('question'));
    
    // Control controls
    document.getElementById('c-play-pause').addEventListener('click', () => togglePlayPause('control'));
    document.getElementById('c-stop').addEventListener('click', () => stopWaveform('control'));
    document.getElementById('c-name-segment').addEventListener('click', () => handleNameSegmentClick('control'));
}

function setupModalListeners() {
    // Annotation modal
    document.getElementById('annotation-form').addEventListener('submit', handleAnnotationSubmit);
    document.getElementById('annotation-cancel').addEventListener('click', closeAnnotationModal);
    
    // Error modal
    document.getElementById('error-close').addEventListener('click', closeErrorModal);
    
    // Session modals
    document.getElementById('close-save-modal').addEventListener('click', closeSaveSessionModal);
    document.getElementById('close-load-modal').addEventListener('click', closeLoadSessionModal);
    document.getElementById('confirm-save-session').addEventListener('click', saveCurrentSession);
    document.getElementById('cancel-save-session').addEventListener('click', closeSaveSessionModal);
    document.getElementById('cancel-load-session').addEventListener('click', closeLoadSessionModal);
    document.getElementById('refresh-sessions').addEventListener('click', loadAvailableSessions);
    
    // Close modals on backdrop click
    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('modal')) {
            if (e.target.id === 'error-modal') closeErrorModal();
            if (e.target.id === 'annotation-modal') closeAnnotationModal();
            if (e.target.id === 'save-session-modal') closeSaveSessionModal();
            if (e.target.id === 'load-session-modal') closeLoadSessionModal();
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
        
        // Check if both files are loaded to advance to step 3
        if (questionWaveSurfer && controlWaveSurfer) {
            updateProgressStep(3);
            
            // If we have saved annotations, recreate regions
            if (panelType === 'question' && questionAnnotations.length > 0) {
                recreateRegionsFromAnnotations('question');
            } else if (panelType === 'control' && controlAnnotations.length > 0) {
                recreateRegionsFromAnnotations('control');
            }
        } else {
            updateProgressStep(2);
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

    // Helper to update timestamp display
    function updateTimestamp(current, duration) {
        const el = document.getElementById(panelType + '-timestamp');
        if (el) {
            el.textContent = `${formatTime(current)} / ${formatTime(duration)}`;
        }
    }

    // Load audio
    await new Promise((resolve, reject) => {
        wavesurfer.load(audioUrl);
        wavesurfer.on('ready', () => {
            // After waveform is ready, restore any saved annotations
            setTimeout(() => {
                if (panelType === 'question' && questionAnnotations.length > 0) {
                    recreateRegionsFromAnnotations('question');
                } else if (panelType === 'control' && controlAnnotations.length > 0) {
                    recreateRegionsFromAnnotations('control');
                }
            }, 100); // Small delay to ensure waveform is fully ready
            
            // Set initial timestamp
            updateTimestamp(0, wavesurfer.getDuration() || 0);
            
            // Create zoom slider for this waveform
            createZoomSlider(panelType);
            
            // Ensure zoom handlers are properly set up (keep for backward compatibility)
            const container = document.getElementById(containerId);
            if (container) {
                setupZoomHandlers(container, panelType);
            }
            
            resolve();
        });
        wavesurfer.on('error', reject);
    });

    // Update timestamp as audio plays or is seeked
    wavesurfer.on('audioprocess', () => {
        updateTimestamp(wavesurfer.getCurrentTime(), wavesurfer.getDuration() || 0);
    });
    wavesurfer.on('seek', () => {
        updateTimestamp(wavesurfer.getCurrentTime(), wavesurfer.getDuration() || 0);
    });
    wavesurfer.on('pause', () => {
        updateTimestamp(wavesurfer.getCurrentTime(), wavesurfer.getDuration() || 0);
    });
    wavesurfer.on('finish', () => {
        updateTimestamp(wavesurfer.getDuration() || 0, wavesurfer.getDuration() || 0);
        // Reset play/pause button state when audio finishes
        playingState[panelType] = false;
        const button = document.getElementById(`${panelType === 'question' ? 'q' : 'c'}-play-pause`);
        if (button) {
            button.classList.remove('playing');
        }
    });
    
    // Handle play/pause state changes
    wavesurfer.on('play', () => {
        playingState[panelType] = true;
        const button = document.getElementById(`${panelType === 'question' ? 'q' : 'c'}-play-pause`);
        if (button) {
            button.classList.add('playing');
        }
    });
    
    wavesurfer.on('pause', () => {
        playingState[panelType] = false;
        const button = document.getElementById(`${panelType === 'question' ? 'q' : 'c'}-play-pause`);
        if (button) {
            button.classList.remove('playing');
        }
    });
    
    // Setup region creation
    wavesurfer.on('region-created', (region) => handleRegionCreated(region, panelType));
    wavesurfer.on('region-click', (region, e) => {
        e.stopPropagation();
        playRegion(region);
    });

    // Add region update event listeners
    wavesurfer.on('region-updated', (region) => {
        handleRegionUpdate(region, panelType);
    });
    wavesurfer.on('region-update-end', (region) => {
        handleRegionUpdate(region, panelType);
    });
    
    // Enable region selection
    wavesurfer.enableDragSelection({
        color: getComputedStyle(document.documentElement).getPropertyValue('--region-color')
    });

    // Add click-to-seek and remember last clicked time
    container.addEventListener('click', function(e) {
        // Only respond to clicks on the waveform, not overlays or regions
        if (e.target !== container) return;
        if (!wavesurfer.isReady) return;
        const rect = container.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const percent = x / rect.width;
        const duration = wavesurfer.getDuration();
        const seekTime = percent * duration;
        wavesurfer.seekTo(percent);
        lastClickedTime[panelType] = seekTime;
    });
}

function handleRegionCreated(region, panelType) {
    // Add region to pending regions list instead of immediately showing modal
    pendingRegions[panelType].push(region);
    
    // Update the name segment button state
    updateNameSegmentButtonState(panelType);
    
    // Update status to inform user
    updateStatus(`${panelType.charAt(0).toUpperCase() + panelType.slice(1)} segment selected - Click "Name Segment" to label it`);
}

function showAnnotationModal(start, end, title = 'Add Clueword Annotation') {
    const modal = document.getElementById('annotation-modal');
    const modalTitle = modal.querySelector('h3');
    const timeDisplay = document.getElementById('annotation-time-display');
    const labelInput = document.getElementById('annotation-label');
    
    modalTitle.textContent = title;
    timeDisplay.textContent = `${formatTime(start)} - ${formatTime(end)} (${formatDuration(end - start)})`;
    labelInput.value = '';
    
    modal.style.display = 'block';
    labelInput.focus();
    currentModal = 'annotation';
}

function handleNameSegmentClick(panelType) {
    const regions = pendingRegions[panelType];
    if (regions.length === 0) return;
    
    // Get the first pending region
    const region = regions[0];
    
    // Play the selected segment first so user can hear it
    playRegion(region);
    
    // Store region info for annotation
    pendingRegion = region;
    pendingPanelType = panelType;
    
    // Show annotation modal with information about multiple regions if applicable
    let modalTitle = 'Add Clueword Annotation';
    if (regions.length > 1) {
        modalTitle = `Add Clueword Annotation (${regions.length} segments pending)`;
    }
    
    showAnnotationModal(region.start, region.end, modalTitle);
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
    
    // Remove the region from pending regions
    const pendingIndex = pendingRegions[pendingPanelType].indexOf(pendingRegion);
    if (pendingIndex > -1) {
        pendingRegions[pendingPanelType].splice(pendingIndex, 1);
    }
    
    // Update annotations display
    updateAnnotationsDisplay(pendingPanelType);
    
    // Update name segment button state
    updateNameSegmentButtonState(pendingPanelType);
    
    // Store panel type before clearing
    const panelTypeForStatus = pendingPanelType;
    
    // Clear pending data
    pendingRegion = null;
    pendingPanelType = null;
    
    closeAnnotationModal();
    updateGenerateButtonState();
    updateProgressStep(4);
    updateStatus(`Annotation "${label}" added to ${panelTypeForStatus || 'audio'}`);
    autoSaveSession();
}

function closeAnnotationModal() {
    const modal = document.getElementById('annotation-modal');
    modal.style.display = 'none';
    
    // Remove pending region if cancelled
    if (pendingRegion && pendingPanelType) {
        // Remove from pending regions list
        const pendingIndex = pendingRegions[pendingPanelType].indexOf(pendingRegion);
        if (pendingIndex > -1) {
            pendingRegions[pendingPanelType].splice(pendingIndex, 1);
        }
        
        // Remove the region from the waveform
        pendingRegion.remove();
        
        // Update name segment button state
        updateNameSegmentButtonState(pendingPanelType);
        
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
    const wavesurfer = panelType === 'question' ? questionWaveSurfer : controlWaveSurfer;
    if (annotation && wavesurfer) {
        // Find the region in the current wavesurfer instance that matches the annotation's start/end
        const region = Object.values(wavesurfer.regions.list).find(r =>
            Math.abs(r.start - annotation.start) < 0.01 && Math.abs(r.end - annotation.end) < 0.01
        );
        if (region) {
            playRegion(region);
        }
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
        autoSaveSession();
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

// Track playing state for each panel
let playingState = { question: false, control: false };

function togglePlayPause(panelType) {
    const wavesurfer = panelType === 'question' ? questionWaveSurfer : controlWaveSurfer;
    const button = document.getElementById(`${panelType === 'question' ? 'q' : 'c'}-play-pause`);
    
    if (!wavesurfer) return;
    
    if (playingState[panelType]) {
        // Currently playing, pause it
        wavesurfer.pause();
        playingState[panelType] = false;
        button.classList.remove('playing');
    } else {
        // Currently paused, play it
        wavesurfer.play();
        playingState[panelType] = true;
        button.classList.add('playing');
    }
}

function playWaveform(panelType) {
    const wavesurfer = panelType === 'question' ? questionWaveSurfer : controlWaveSurfer;
    const button = document.getElementById(`${panelType === 'question' ? 'q' : 'c'}-play-pause`);
    
    if (wavesurfer) {
        wavesurfer.play();
        playingState[panelType] = true;
        button.classList.add('playing');
    }
}

function pauseWaveform(panelType) {
    const wavesurfer = panelType === 'question' ? questionWaveSurfer : controlWaveSurfer;
    const button = document.getElementById(`${panelType === 'question' ? 'q' : 'c'}-play-pause`);
    
    if (wavesurfer) {
        wavesurfer.pause();
        playingState[panelType] = false;
        button.classList.remove('playing');
    }
}

function stopWaveform(panelType) {
    const wavesurfer = panelType === 'question' ? questionWaveSurfer : controlWaveSurfer;
    const button = document.getElementById(`${panelType === 'question' ? 'q' : 'c'}-play-pause`);
    
    if (wavesurfer) {
        wavesurfer.stop();
        playingState[panelType] = false;
        button.classList.remove('playing');
    }
}

async function generateClueWords() {
    if (!canGenerate()) return;
    
    // Check if case information is provided
    const caseNumber = document.getElementById('case-number').value.trim();
    const policeStation = document.getElementById('police-station').value.trim();
    const district = document.getElementById('district').value.trim();
    const crAdrNumber = document.getElementById('cr-adr-number').value.trim();
    
    if (!caseNumber && !policeStation && !district && !crAdrNumber) {
        if (!confirm('No case information provided. Continue with analysis anyway?')) {
            return;
        }
    }
    
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
        
        // Add case information
        formData.append('case_number', document.getElementById('case-number').value || '');
        formData.append('police_station', document.getElementById('police-station').value || '');
        formData.append('district', document.getElementById('district').value || '');
        formData.append('cr_adr_number', document.getElementById('cr-adr-number').value || '');
        formData.append('speaker_name', document.getElementById('speaker-name').value || '');
        
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
        
        updateProgressStep(5);
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

function updateNameSegmentButtonState(panelType) {
    const button = document.getElementById(`${panelType === 'question' ? 'q' : 'c'}-name-segment`);
    const hasPendingRegions = pendingRegions[panelType].length > 0;
    
    button.disabled = !hasPendingRegions;
    if (hasPendingRegions) {
        const count = pendingRegions[panelType].length;
        button.textContent = `Name Segment${count > 1 ? ` (${count})` : ''}`;
    } else {
        button.textContent = 'Name Segment';
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
    
    // Add event listeners for case information fields
    const caseFields = ['case-number', 'police-station', 'district', 'cr-adr-number', 'speaker-name'];
    caseFields.forEach(fieldId => {
        const field = document.getElementById(fieldId);
        field.addEventListener('input', checkCaseInformation);
    });
}

function checkCaseInformation() {
    const caseNumber = document.getElementById('case-number').value.trim();
    const policeStation = document.getElementById('police-station').value.trim();
    const district = document.getElementById('district').value.trim();
    const crAdrNumber = document.getElementById('cr-adr-number').value.trim();
    const speakerName = document.getElementById('speaker-name').value.trim();
    
    // Check if at least one field is filled (you can make this more strict if needed)
    if (caseNumber || policeStation || district || crAdrNumber || speakerName) {
        updateProgressStep(Math.max(getCurrentProgressStep(), 2));
        updateStatus('Case information entered - Ready for audio files');
    }
}

function getCurrentProgressStep() {
    const activeStep = document.querySelector('.progress-step.active');
    return activeStep ? parseInt(activeStep.dataset.step) : 1;
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

// Session Management Functions

function openSaveSessionModal() {
    const modal = document.getElementById('save-session-modal');
    modal.style.display = 'block';
    
    // Pre-fill session name with case number if available
    const caseNumber = document.getElementById('case-number').value.trim();
    const sessionNameInput = document.getElementById('session-name-input');
    if (caseNumber && !sessionNameInput.value) {
        sessionNameInput.value = `Case-${caseNumber}-${new Date().getFullYear()}`;
    }
    sessionNameInput.focus();
}

function closeSaveSessionModal() {
    document.getElementById('save-session-modal').style.display = 'none';
    document.getElementById('session-name-input').value = '';
}

function openLoadSessionModal() {
    const modal = document.getElementById('load-session-modal');
    modal.style.display = 'block';
    loadAvailableSessions();
}

function closeLoadSessionModal() {
    document.getElementById('load-session-modal').style.display = 'none';
}

async function loadAvailableSessions() {
    const container = document.getElementById('sessions-container');
    container.innerHTML = '<div class="loading-sessions">Loading sessions...</div>';
    
    try {
        const response = await fetch('/api/sessions');
        if (!response.ok) {
            throw new Error('Failed to load sessions');
        }
        
        const sessions = await response.json();
        availableSessions = sessions;
        
        if (sessions.length === 0) {
            container.innerHTML = '<div class="no-sessions">No saved sessions found.</div>';
            return;
        }
        
        container.innerHTML = '';
        sessions.forEach(session => {
            const sessionElement = createSessionElement(session);
            container.appendChild(sessionElement);
        });
        
    } catch (error) {
        console.error('Error loading sessions:', error);
        container.innerHTML = '<div class="no-sessions">Error loading sessions. Please try again.</div>';
    }
}

function createSessionElement(session) {
    const div = document.createElement('div');
    div.className = 'session-item';
    div.dataset.sessionId = session.id;
    
    const createdDate = new Date(session.created_at).toLocaleDateString();
    const updatedDate = new Date(session.updated_at).toLocaleDateString();
    
    div.innerHTML = `
        <div class="session-header">
            <div class="session-name">${session.session_name}</div>
            <div class="session-date">Updated: ${updatedDate}</div>
        </div>
        <div class="session-details">
            <div class="session-detail"><strong>Case:</strong> ${session.case_number || 'N/A'}</div>
            <div class="session-detail"><strong>Station:</strong> ${session.police_station || 'N/A'}</div>
            <div class="session-detail"><strong>Speaker:</strong> ${session.speaker_name || 'N/A'}</div>
            <div class="session-detail"><strong>Files:</strong> ${session.question_filename && session.control_filename ? 'Both uploaded' : 'Incomplete'}</div>
        </div>
        <div class="session-actions">
            <button class="session-action-btn load" onclick="loadSession(${session.id})">📂 Load</button>
            <button class="session-action-btn delete" onclick="deleteSession(${session.id})">🗑️ Delete</button>
        </div>
    `;
    
    div.addEventListener('click', (e) => {
        if (!e.target.classList.contains('session-action-btn')) {
            selectSession(div);
        }
    });
    
    return div;
}

function selectSession(element) {
    document.querySelectorAll('.session-item').forEach(item => {
        item.classList.remove('selected');
    });
    element.classList.add('selected');
}

async function saveCurrentSession() {
    const sessionName = document.getElementById('session-name-input').value.trim();
    if (!sessionName) {
        alert('Please enter a session name');
        return;
    }
    
    try {
        const sessionData = {
            session_id: currentSessionId,
            session_name: sessionName,
            case_number: document.getElementById('case-number').value.trim(),
            police_station: document.getElementById('police-station').value.trim(),
            district: document.getElementById('district').value.trim(),
            cr_number: document.getElementById('cr-adr-number').value.trim(),
            speaker_name: document.getElementById('speaker-name').value.trim(),
            question_filename: questionOriginalFilename,
            control_filename: controlOriginalFilename,
            bandpass_enabled: document.getElementById('enable-bandpass').checked,
            annotations: {
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
            }
        };
        
        const response = await fetch('/api/sessions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(sessionData)
        });
        
        if (!response.ok) {
            throw new Error('Failed to save session');
        }
        
        const savedSession = await response.json();
        currentSessionId = savedSession.id;
        currentSessionName = savedSession.session_name;
        
        updateSessionStatus(`Session "${sessionName}" saved successfully`);
        closeSaveSessionModal();
        
    } catch (error) {
        console.error('Error saving session:', error);
        alert('Failed to save session: ' + error.message);
    }
}

async function loadSession(sessionId) {
    try {
        const response = await fetch(`/api/sessions/${sessionId}`);
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || response.statusText || 'Failed to load session');
        }
        const session = await response.json();
        // Load case information
        document.getElementById('case-number').value = session.case_number || '';
        document.getElementById('police-station').value = session.police_station || '';
        document.getElementById('district').value = session.district || '';
        document.getElementById('cr-adr-number').value = session.cr_number || '';
        document.getElementById('speaker-name').value = session.speaker_name || '';
        document.getElementById('enable-bandpass').checked = session.bandpass_enabled || false;
        // Load annotations
        questionAnnotations = session.annotations.question || [];
        controlAnnotations = session.annotations.control || [];
        
        // Clear any pending regions
        pendingRegions.question = [];
        pendingRegions.control = [];
        // Update session tracking
        currentSessionId = session.id;
        currentSessionName = session.session_name;
        // Set original filenames from session
        questionOriginalFilename = session.question_filename || '';
        controlOriginalFilename = session.control_filename || '';
        // Load audio files if filenames are present
        if (questionOriginalFilename) {
            await initializeWaveform('question', `/static/temp_standardized/question_standardized.wav`);
            document.getElementById('question-filename').textContent = questionOriginalFilename;
            document.getElementById('question-filename').classList.add('loaded');
        }
        if (controlOriginalFilename) {
            await initializeWaveform('control', `/static/temp_standardized/control_standardized.wav`);
            document.getElementById('control-filename').textContent = controlOriginalFilename;
            document.getElementById('control-filename').classList.add('loaded');
        }
        // Refresh annotations display
        updateAnnotationsDisplay('question');
        updateAnnotationsDisplay('control');
        // Reset playing state when loading session
        playingState = { question: false, control: false };
        const qButton = document.getElementById('q-play-pause');
        const cButton = document.getElementById('c-play-pause');
        if (qButton) qButton.classList.remove('playing');
        if (cButton) cButton.classList.remove('playing');
        
        // Update progress if files are available
        if (questionOriginalFilename && controlOriginalFilename) {
            updateProgressStep(3);
        }
        updateSessionStatus(`Session "${session.session_name}" loaded`);
        updateProgressStep(2); // Update progress based on loaded data
        closeLoadSessionModal();
    } catch (error) {
        console.error('Error loading session:', error);
        alert('Failed to load session: ' + error.message);
    }
}

// Auto-save session when annotations change
function autoSaveSession() {
    if (!currentSessionId) return;
    const sessionData = {
        session_id: currentSessionId,
        session_name: currentSessionName,
        case_number: document.getElementById('case-number').value.trim(),
        police_station: document.getElementById('police-station').value.trim(),
        district: document.getElementById('district').value.trim(),
        cr_number: document.getElementById('cr-adr-number').value.trim(),
        speaker_name: document.getElementById('speaker-name').value.trim(),
        question_filename: questionOriginalFilename,
        control_filename: controlOriginalFilename,
        bandpass_enabled: document.getElementById('enable-bandpass').checked,
        annotations: {
            question: questionAnnotations.map(ann => ({ label: ann.label, start: ann.start, end: ann.end })),
            control: controlAnnotations.map(ann => ({ label: ann.label, start: ann.start, end: ann.end }))
        }
    };
    fetch('/api/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sessionData)
    }).then(() => {
        updateSessionStatus('Session auto-saved');
    }).catch(() => {
        updateSessionStatus('Auto-save failed', 'error');
    });
}

async function deleteSession(sessionId) {
    if (!confirm('Are you sure you want to delete this session? This action cannot be undone.')) {
        return;
    }
    
    try {
        const response = await fetch(`/api/sessions/${sessionId}`, {
            method: 'DELETE'
        });
        
        if (!response.ok) {
            throw new Error('Failed to delete session');
        }
        
        // Refresh the sessions list
        loadAvailableSessions();
        
        // Clear current session if it was deleted
        if (currentSessionId === sessionId) {
            currentSessionId = null;
            currentSessionName = '';
            updateSessionStatus('');
        }
        
    } catch (error) {
        console.error('Error deleting session:', error);
        alert('Failed to delete session: ' + error.message);
    }
}

function createNewSession() {
    if (confirm('Create a new session? This will clear all current data.')) {
        // Clear all form data
        document.getElementById('case-number').value = '';
        document.getElementById('police-station').value = '';
        document.getElementById('district').value = '';
        document.getElementById('cr-adr-number').value = '';
        document.getElementById('speaker-name').value = '';
        document.getElementById('enable-bandpass').checked = true;
        
        // Clear annotations
        questionAnnotations = [];
        controlAnnotations = [];
        
        // Clear pending regions
        pendingRegions.question = [];
        pendingRegions.control = [];
        
        // Clear waveforms
        if (questionWaveSurfer) {
            questionWaveSurfer.clearRegions();
        }
        if (controlWaveSurfer) {
            controlWaveSurfer.clearRegions();
        }
        
        // Clear zoom sliders
        questionZoomSlider = null;
        controlZoomSlider = null;
        
        // Update annotation lists
        updateAnnotationsDisplay('question');
        updateAnnotationsDisplay('control');
        
        // Update name segment button states
        updateNameSegmentButtonState('question');
        updateNameSegmentButtonState('control');
        
        // Reset session tracking
        currentSessionId = null;
        currentSessionName = '';
        updateSessionStatus('');
        
        // Reset playing state
        playingState = { question: false, control: false };
        const qButton = document.getElementById('q-play-pause');
        const cButton = document.getElementById('c-play-pause');
        if (qButton) qButton.classList.remove('playing');
        if (cButton) cButton.classList.remove('playing');
        
        // Reset progress
        updateProgressStep(1);
        updateStatus('New session created - Enter case information to begin');
    }
}

function updateSessionStatus(message) {
    const statusElement = document.getElementById('session-status');
    statusElement.textContent = message;
    
    if (message) {
        setTimeout(() => {
            statusElement.textContent = '';
        }, 5000);
    }
}

function recreateRegionsFromAnnotations(panelType) {
    const wavesurfer = panelType === 'question' ? questionWaveSurfer : controlWaveSurfer;
    const annotations = panelType === 'question' ? questionAnnotations : controlAnnotations;
    
    if (!wavesurfer || !annotations) return;
    
    // Clear existing regions
    wavesurfer.clearRegions();
    
    // Clear pending regions for this panel type
    pendingRegions[panelType] = [];
    
    // Recreate regions from annotations
    annotations.forEach(annotation => {
        try {
            const region = wavesurfer.addRegion({
                start: annotation.start,
                end: annotation.end,
                color: 'rgba(255, 206, 84, 0.4)',
                attributes: {
                    label: annotation.label
                }
            });
            
            // Update the annotation object with the new region
            annotation.region = region;
        } catch (error) {
            console.warn(`Failed to recreate region for annotation: ${annotation.label}`, error);
        }
    });
    
    // Update name segment button state
    updateNameSegmentButtonState(panelType);
    
    // Recreate zoom slider if waveform is loaded
    if ((panelType === 'question' && questionWaveSurfer) || 
        (panelType === 'control' && controlWaveSurfer)) {
        createZoomSlider(panelType);
    }
}

function handleRegionUpdate(region, panelType) {
    // Find the annotation linked to this region
    const annotations = panelType === 'question' ? questionAnnotations : controlAnnotations;
    const annotation = annotations.find(ann => ann.region && ann.region.id === region.id);
    if (annotation) {
        annotation.start = region.start;
        annotation.end = region.end;
        // Optionally, update label if region label can be changed interactively
        // annotation.label = region.attributes.label;
        updateAnnotationsDisplay(panelType);
        autoSaveSession();
    }
}

// Handle page unload warning if there are unsaved annotations
window.addEventListener('beforeunload', function(e) {
    if (questionAnnotations.length > 0 || controlAnnotations.length > 0) {
        const message = 'You have unsaved annotations. Are you sure you want to leave?';
        e.returnValue = message;
        return message;
    }
});

document.addEventListener('keydown', function(e) {
    // Ignore if a modal, input, or textarea is focused
    const tag = document.activeElement.tagName.toLowerCase();
    if (tag === 'input' || tag === 'textarea' || document.activeElement.classList.contains('modal')) return;
    
    if (e.code === 'Space' && activeWaveform) {
        e.preventDefault();
        let ws = activeWaveform === 'question' ? questionWaveSurfer : controlWaveSurfer;
        if (ws && ws.isReady) {
            // Play from last clicked time if set, else from current position
            const lastTime = lastClickedTime[activeWaveform] || ws.getCurrentTime();
            ws.setTime(lastTime);
            ws.play();
        }
    }
    
    // Keyboard zoom controls
    if (activeWaveform && (e.code === 'Equal' || e.code === 'Minus')) {
        e.preventDefault();
        const zoomFactor = e.code === 'Equal' ? 1.25 : 0.8;
        const wavesurfer = activeWaveform === 'question' ? questionWaveSurfer : controlWaveSurfer;
        
        if (wavesurfer && wavesurfer.isReady) {
            try {
                let newZoomLevel;
                if (activeWaveform === 'question') {
                    questionZoomLevel = Math.max(0.1, Math.min(100, questionZoomLevel * zoomFactor));
                    newZoomLevel = questionZoomLevel;
                } else {
                    controlZoomLevel = Math.max(0.1, Math.min(100, controlZoomLevel * zoomFactor));
                    newZoomLevel = controlZoomLevel;
                }
                
                updateZoomDisplay(activeWaveform, newZoomLevel);
                
                const zoomValue = newZoomLevel * 10;
                if (typeof wavesurfer.zoom === 'function') {
                    wavesurfer.zoom(zoomValue);
                } else if (typeof wavesurfer.setMinPxPerSec === 'function') {
                    wavesurfer.setMinPxPerSec(zoomValue);
                } else if (wavesurfer.params) {
                    wavesurfer.params.minPxPerSec = zoomValue;
                    wavesurfer.drawBuffer();
                }
                
                updateStatus(`${activeWaveform.charAt(0).toUpperCase() + activeWaveform.slice(1)} zoom: ${newZoomLevel.toFixed(1)}x`);
            } catch (error) {
                console.warn('Keyboard zoom failed:', error);
            }
        }
    }
});
