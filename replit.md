# Forensic Clueword Extractor

## Overview

The Forensic Clueword Extractor is a web-based audio analysis tool designed for forensic investigations. It allows investigators to upload audio files, create visual annotations on waveforms, label cluewords, and generate comparative analysis between question and control audio samples.

## User Preferences

Preferred communication style: Simple, everyday language.

## Recent Changes (July 19, 2025)

✓ Fixed zoom functionality with proper bounds (10x to 1000x zoom range)
✓ Improved Word document report format with side-by-side comparison
✓ Added HH:MM:SS:MS time format for professional forensic reporting
✓ Enhanced table structure with question and control file headers
✓ Added zoom level status feedback for better user experience

## System Architecture

### Frontend Architecture
- **Single Page Application (SPA)**: Uses vanilla JavaScript with HTML/CSS for a responsive web interface
- **Audio Visualization**: Integrates WaveSurfer.js library for real-time waveform rendering and audio playback
- **Interactive Annotations**: Click-to-annotate functionality with modal dialogs for labeling
- **Responsive Design**: CSS Grid and Flexbox layout with dark theme optimized for professional forensic work

### Backend Architecture
- **Flask Web Framework**: Lightweight Python web server handling file uploads, audio processing, and analysis generation
- **File Processing Pipeline**: Multi-stage processing including upload, standardization, annotation, and output generation
- **RESTful API Design**: JSON-based communication between frontend and backend for file operations and analysis requests

## Key Components

### Audio Processing Engine
- **Format Standardization**: Uses PyDub to convert various audio formats to standardized WAV files
- **Waveform Generation**: Creates visual representations accessible via static file serving
- **Region-based Analysis**: Processes time-based annotations for clueword extraction

### File Management System
- **Upload Handler**: Secure file upload with validation and temporary storage
- **Directory Management**: Automated cleanup and organization of processed files
- **Output Generation**: Creates downloadable ZIP archives containing analysis results

### User Interface Components
- **Dual Audio Panels**: Side-by-side comparison of question and control audio files
- **Interactive Controls**: Zoom, play, pause, stop functionality for precise audio analysis
- **Annotation System**: Modal-based labeling system for marking cluewords
- **Status Feedback**: Real-time progress updates and error handling

## Data Flow

1. **File Upload**: User selects audio files through file input controls
2. **Audio Processing**: Backend standardizes audio format and generates waveform data
3. **Visualization**: Frontend renders interactive waveforms using WaveSurfer.js
4. **Annotation Creation**: User clicks on waveforms to create time-based regions
5. **Label Assignment**: Modal dialogs capture clueword labels for each annotation
6. **Analysis Generation**: Backend processes annotations and generates comparative analysis
7. **Result Download**: System packages results into downloadable ZIP archive

## External Dependencies

### Frontend Libraries
- **WaveSurfer.js v6.6.3**: Audio waveform visualization and playback control
- **Google Fonts (Inter)**: Typography for professional appearance

### Backend Libraries
- **Flask**: Web framework for HTTP handling and template rendering
- **PyDub**: Audio file processing and format conversion
- **python-docx**: Document generation for analysis reports
- **FFmpeg**: Audio codec support (system dependency)

### System Requirements
- **Python 3.10+**: Runtime environment
- **FFmpeg**: Audio processing backend
- **Modern Web Browser**: Chrome, Firefox, Safari, or Edge with HTML5 audio support

## Deployment Strategy

### Replit Configuration
- **Nix Package Management**: Uses replit.nix for system dependencies including FFmpeg
- **Environment Variables**: Session secrets and configuration through environment variables
- **Static File Serving**: Flask serves processed audio files and assets directly

### File System Organization
```
/
├── uploads/              # Temporary upload storage
├── static/
│   ├── temp_standardized/  # Processed audio files
│   ├── css/               # Stylesheets
│   └── js/                # Frontend JavaScript
├── templates/             # HTML templates
└── output/               # Generated analysis results
```

### Session Management
- **Stateless Design**: Each session cleans up previous data automatically
- **Temporary Storage**: All files are session-scoped and automatically cleaned
- **Memory Management**: Directory cleanup prevents storage accumulation

### Error Handling
- **Comprehensive Logging**: Debug-level logging for troubleshooting
- **Graceful Degradation**: User-friendly error messages and status updates
- **File Validation**: Input sanitization and format verification

The application is designed to be deployed on Replit with minimal configuration, requiring only the installation of Python dependencies and FFmpeg through the Nix package manager.