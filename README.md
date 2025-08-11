
# Clue_Word Extractor · Forensic-Grade Clueword Analysis Suite 🎯🔍

> Upload. Annotate. Extract. Report. A complete, offline-capable forensic audio workflow for investigators and experts. 📝🎧

***

## ✨ Highlights

- 🎛️ Purpose-built for forensic audio analysis
- 🌊 Interactive waveform with precise region annotation
- 💾 Session save/load with full case metadata
- 🧾 Professional Word report generation
- 🧱 SQLite offline fallback, PostgreSQL in production
- 🎚️ Optional bandpass filter (400–4000 Hz) for voice clarity

***

## 🧭 Table of Contents

- Project Overview
- System Requirements
- Technology Stack
- Architecture \& Design
- Database Schema
- File Structure
- Core Features
- User Interface Design
- Audio Processing Pipeline
- Session Management
- Report Generation
- Setup \& Deployment
- Configuration
- Complete Code Implementation
- Testing \& QA
- Security
- Maintenance \& Support
- License
- Credits

***

## 🧩 Project Overview

Clue_Word Extractor is a professional web application for forensic audio analysis that helps investigators:

- ⤴️ Upload “Question” and “Control” recordings
- 👁️ Visualize waveforms with WaveSurfer.js
- 🏷️ Create labeled regions (cluewords) with millisecond precision
- ✂️ Extract segments per label and compare across files
- 🧳 Save entire analysis sessions and generate clean, court-ready Word reports


### 👥 Target Users

- Forensic audio analysts
- Law enforcement agencies
- Legal professionals
- Audio forensics researchers

***

## 🖥️ System Requirements

### 🧰 Hardware

- RAM: 4GB minimum (8GB recommended)
- Storage: 2GB free
- CPU: Dual-core or better
- Audio: Playback capability


### 🧪 Software

- Python: 3.10+ (3.11 recommended)
- FFmpeg: Required for audio processing
- Browser: Chrome 90+, Firefox 88+, Safari 14+, Edge 90+
- Database: PostgreSQL (prod) or SQLite (offline/local)


### 🌐 Network

- Online Mode: Optional; loads CDN resources if allowed
- Offline Mode: Fully functional post-setup (SQLite + local assets)

***

## 🧱 Technology Stack

### Backend

- Flask 3.1.1+
- Flask-SQLAlchemy 3.1.1+
- Gunicorn 23.0.0+ (production)


### Audio

- PyDub 0.25.1+ (FFmpeg under the hood)
- FFmpeg (system dependency)


### Documents

- python-docx 1.2.0+ (report generation)


### Database

- PostgreSQL (prod) with psycopg2-binary
- SQLite (local/offline)


### Frontend

- HTML5, CSS3, Vanilla JS
- WaveSurfer.js 6.6.3 (waveforms + regions)
- Google Fonts: Inter

***

## 🏗️ Architecture \& Design

### Patterns

- MVC with a lightweight SPA-style frontend
- RESTful JSON endpoints
- Progressive enhancement (basic upload works without JS)


### High-Level Flow

- Browser UI (WaveSurfer.js) ↔ Flask API ↔ Database (PostgreSQL/SQLite)
- Static assets: CSS/JS; Runtime dirs: uploads/, static/temp_standardized/, output/
- File ops: secure temp processing, deterministic naming, clean-up


### Principles

- 🔐 Security-first: no external data transmission
- 👤 Human-centered UI with dark, professional palette
- ⚡ Performance-optimized audio processing
- ♿ Accessible (keyboard navigation, clear contrasts)

***

## 🗃️ Database Schema

### Table: forensic_sessions

- id (PK)
- session_name (str, required)
- case_number, police_station, district, cr_number, speaker_name
- question_filename, control_filename
- question_file_path, control_file_path
- annotations_data (JSON as text)
- bandpass_enabled (bool)
- created_at, updated_at (timestamps)


### Annotation JSON

```json
{
  "question": [
    { "id": 1642534567890, "label": "Hello", "start": 1.234, "end": 2.567 }
  ],
  "control": [
    { "id": 1642534567891, "label": "Hello", "start": 0.987, "end": 2.123 }
  ]
}
```


***

## 📁 File Structure

```
forensic-clueword-extractor/
├─ app.py
├─ main.py
├─ pyproject.toml
├─ replit.md
├─ PROJECT_BLUEPRINT.md
├─ LOCAL_SETUP.md
├─ QUICK_FIX.md
├─ CREATE_EXE_GUIDE.md
├─ run_local.bat
├─ run_local.sh
├─ templates/
│  └─ index.html
├─ static/
│  ├─ css/style.css
│  ├─ js/main.js
│  └─ temp_standardized/   (runtime)
├─ uploads/                (runtime)
└─ output/                 (runtime)
```


***

## 🚀 Core Features

### 1) Upload \& Standardization

- Formats: WAV, MP3, M4A, FLAC, OGG, AAC
- Auto-standardize to WAV (44.1kHz, 16-bit, mono)
- Dual-panel: Question vs Control


### 2) Interactive Analysis

- Zoom (scroll), pan, and region creation
- Playback per region or whole track
- Color-coded labels, millisecond timestamps


### 3) Annotations

- Click-to-annotate with custom labels
- Edit/delete regions
- Persisted in DB as JSON


### 4) Sessions

- Save/Load with case metadata and full state
- SQLite or PostgreSQL backends


### 5) Audio Enhancement

- Optional bandpass filter 400–4000Hz
- Toggle per session


### 6) Reporting

- Word document with case info, tables, and timings
- Side-by-side Question/Control comparison
- Extracted clueword WAVs packaged (ZIP)


### 7) Progress \& UX

- Guided steps, status updates, and smooth interactions

***

## 🎨 User Interface Design

### Color Tokens (excerpt)

- Background: \#1a1a1d
- Panels: \#2c2f33
- Primary: \#4a90e2
- Success: \#28a745
- Danger: \#dc3545
- Warning: \#ffc107
- Waveform: \#4a90e2
- Region: rgba(230, 74, 25, 0.3)
- Region border: \#e64a19


### Layout

- Header: title + feature badges
- Session tools: New / Save / Load
- Case metadata panel
- Dual audio panels (Question / Control)
- Annotation lists (side-by-side)
- Controls: bandpass toggle, generate analysis/report
- Footer: authorship/certification seal


### Typography

- Inter: weights 400/500/700
- Clear hierarchy and spacing for professional readability

***

## 🔊 Audio Processing Pipeline

### Upload \& Standardize

1. Client upload (validated)
2. Flask receives with size limits
3. PyDub detects/loads
4. Convert to WAV 44.1kHz 16-bit mono
5. Save to static/temp_standardized
6. Serve paths to frontend for WaveSurfer

### Bandpass Filtering (optional)

- High-pass 400Hz + Low-pass 4000Hz via PyDub
- Toggle in UI; dual output supported


### Segment Extraction

- Use region timestamps per label
- Export to WAV with label-based filenames
- Bundle in ZIP for download alongside report

***

## 🗂️ Session Management

### Model (Python)

- ForensicSession with identity, case info, file refs
- annotations_data as JSON text
- bandpass_enabled flag
- created_at/updated_at


### Lifecycle

- Create → Upload → Annotate → Save → Load/Update
- Atomic saves; consistent file references

***

## 🧾 Report Generation

### Word Structure

- Case details block
- Total matching cluewords
- Comparison table:
    - label, start/end, duration
    - Question vs Control columns
- Clean and court-friendly formatting

***

## ⚙️ Setup \& Deployment

### Quick Start (local)

```bash
python -m venv venv
# Activate venv (Linux/Mac)
source venv/bin/activate
# OR (Windows)
venv\Scripts\activate

pip install flask flask-sqlalchemy pydub python-docx gunicorn psycopg2-binary

# Install FFmpeg (system)
# Ubuntu/Debian: sudo apt update && sudo apt install ffmpeg
# macOS: brew install ffmpeg
# Windows: https://ffmpeg.org/

export DATABASE_URL="sqlite:///forensic_sessions.db"
export SESSION_SECRET="change-this"

# Initialize DB
python -c "from app import app, db; app.app_context().push(); db.create_all()"

# Run
python app.py
```


### Production (example: Gunicorn)

```bash
# Ensure DATABASE_URL points to PostgreSQL
gunicorn -w 2 -b 0.0.0.0:5000 main:app
```


### Replit (example)

- nix: python311 + ffmpeg
- pyproject lists dependencies
- Use provided run scripts if included

***

## 🔧 Configuration

### Environment variables

- DATABASE_URL=postgresql://user:pass@host:5432/db OR sqlite:///forensic_sessions.db
- SESSION_SECRET=your-strong-secret
- FLASK_ENV=development|production
- FLASK_DEBUG=True|False
- HOST=0.0.0.0
- PORT=5000


### Audio and App Settings (in app.py)

- MAX_CONTENT_LENGTH = 100MB
- Uploads: uploads/
- Output: output/
- Standardized: static/temp_standardized/
- FFmpeg paths can be set for PyDub if needed

***

## 🧩 Complete Code Implementation

- app.py
- templates/index.html
- static/css/style.css
- static/js/main.js

Note: This README summarizes structure and responsibilities; the code files in the repo contain the full implementation.

***

## ✅ Testing \& QA

### Manual test checklist

- Upload various formats (WAV, MP3, M4A, FLAC, OGG, AAC)
- Waveform rendering accuracy and responsiveness
- Create/edit/delete regions; check millisecond precision
- Zoom/pan usability
- Bandpass toggle effect and output
- Save/Load session roundtrip
- Report generation: table structure, time formatting
- ZIP packaging with extracted segments
- SQLite offline mode
- Cross-browser and responsive layout


### Performance targets

- Upload: <5s for 50MB
- Waveform render: <2s for 10-min audio
- Save session: <1s for complex sets
- Report build: <3s for ~20 cluewords
- Typical memory: <500MB

***

## 🔒 Security

- All processing local; no external data transmission
- Parameterized DB access through SQLAlchemy
- Temporary files cleaned automatically
- Sessions isolated per user
- Secrets via environment variables
- Optionally encrypt DB at rest (deployment-specific)

***

## 🛠️ Maintenance \& Support

### Routine tasks

- Clear old temp files and stale sessions
- Update dependencies and FFmpeg regularly
- Monitor logs and storage usage
- Back up PostgreSQL in production


### Troubleshooting

- Audio not loading: verify FFmpeg in PATH and file format
- Save errors: check DATABASE_URL and permissions
- Zoom inactive: click waveform to focus, then scroll
- Report fails: ensure python-docx installed and output writable
- DB connectivity: validate credentials and network access

***

## 📜 License

Add your preferred license here. If help is needed selecting one (MIT, Apache-2.0, GPL-3.0, etc.), share constraints (commercial use, patents, copyleft).

***

## 👤 Credits

- Author: Dayanand Gawade (Forensic Audio Analysis Expert)
- Core Libraries: Flask, SQLAlchemy, PyDub, python-docx, WaveSurfer.js
- Compatibility: Python 3.10+, Flask 3.1+, WaveSurfer.js 6.6.3
- Document Version: 1.0
- Last Updated: July 19, 2025

***

## 🧩 Extras (available on request)

- 🛡️ Shields badges (build, Python version, license, last commit)
- 🎞️ Minimal demo GIF of upload → annotate → report
- 🐳 Dockerfile + docker-compose for PG + app
- 🧪 CI workflow (GitHub Actions) for linting/tests
- 📦 Offline assets bundling (no CDN usage)
- 🎧 Sample dataset and sample generated report template

Tip: For GitHub’s dark theme readability, keep emoji sparing, use code blocks for commands, and prefer flat lists over deep nesting.
