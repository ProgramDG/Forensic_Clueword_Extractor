# Local Setup Guide - Forensic Clueword Extractor

## Prerequisites

Before setting up the application locally, ensure you have the following installed:

### 1. Python 3.8 or higher
- **Windows**: Download from [python.org](https://python.org/downloads/)
- **macOS**: Install via Homebrew: `brew install python3` or download from python.org
- **Linux**: Use your package manager: `sudo apt-get install python3 python3-pip` (Ubuntu/Debian)

### 2. FFmpeg (Required for audio processing)
- **Windows**: 
  1. Download from [ffmpeg.org](https://ffmpeg.org/download.html)
  2. Extract to a folder (e.g., `C:\ffmpeg`)
  3. Add `C:\ffmpeg\bin` to your system PATH
  4. Verify: Open Command Prompt and run `ffmpeg -version`

- **macOS**: 
  1. Install via Homebrew: `brew install ffmpeg`
  2. Verify: Run `ffmpeg -version` in Terminal

- **Linux**: 
  1. Install via package manager: `sudo apt-get install ffmpeg` (Ubuntu/Debian)
  2. Verify: Run `ffmpeg -version`

## Installation Steps

### Step 1: Download and Extract Project
1. Extract the downloaded project files to your desired location
2. Open Terminal/Command Prompt and navigate to the project folder:
   ```bash
   cd path/to/forensic-clueword-extractor
   ```

### Step 2: Create Virtual Environment (Recommended)
```bash
# Create virtual environment
python -m venv venv

# Activate virtual environment
# On Windows:
venv\Scripts\activate
# On macOS/Linux:
source venv/bin/activate
```

### Step 3: Install Python Dependencies
```bash
pip install Flask==2.3.3
pip install pydub==0.25.1
pip install python-docx==0.8.11
pip install gunicorn==21.2.0
```

### Step 4: Verify Installation
Check that all dependencies are installed:
```bash
pip list
```

You should see Flask, pydub, python-docx, and gunicorn in the list.

## Running the Application

### Option 1: Development Mode (Recommended for local use)
```bash
python app.py
```

### Option 2: Production Mode with Gunicorn
```bash
gunicorn --bind 127.0.0.1:5000 --workers 1 main:app
```

## Accessing the Application

1. Open your web browser
2. Navigate to: `http://localhost:5000` or `http://127.0.0.1:5000`
3. You should see the Forensic Clueword Extractor interface

## Project Structure

```
forensic-clueword-extractor/
├── app.py                 # Main Flask application
├── main.py               # Entry point for gunicorn
├── static/               # Static files (CSS, JS)
│   ├── css/
│   │   └── style.css
│   ├── js/
│   │   └── main.js
│   └── temp_standardized/ # Auto-created for processed audio
├── templates/            # HTML templates
│   └── index.html
├── uploads/              # Auto-created for file uploads
└── output/               # Auto-created for analysis results
```

## Usage Instructions

1. **Upload Audio Files**: Select question and control audio files (supports MP3, WAV, M4A, etc.)
2. **Create Annotations**: Click on waveforms to create regions and label them with cluewords
3. **Zoom Controls**: Use zoom in/out buttons for detailed waveform analysis
4. **Generate Analysis**: Click "Generate CLUE WORDS" to create analysis report
5. **Download Results**: Analysis report and extracted audio segments download as ZIP file

## Troubleshooting

### Common Issues:

**1. "FFmpeg not found" error:**
- Ensure FFmpeg is properly installed and in your system PATH
- Restart Command Prompt/Terminal after installing FFmpeg

**2. "Port already in use" error:**
- Stop any other applications running on port 5000
- Or change the port in app.py: `app.run(host='0.0.0.0', port=8000)`

**3. Audio processing fails:**
- Verify your audio files are not corrupted
- Try different audio formats (WAV works best)

**4. Permission errors on Windows:**
- Run Command Prompt as Administrator
- Ensure antivirus isn't blocking the application

**5. Python module not found:**
- Ensure virtual environment is activated
- Reinstall missing packages with pip

### Getting Help:
- Check that FFmpeg is working: `ffmpeg -version`
- Check Python version: `python --version`
- Check installed packages: `pip list`

## Security Notes for Local Use

- The application runs in debug mode for easy troubleshooting
- Only accessible from your local machine (localhost)
- Audio files are processed locally and not sent anywhere
- Temporary files are cleaned automatically between sessions

## Performance Tips

- Use WAV format for fastest processing
- Close other audio applications when running analysis
- For large files, ensure sufficient disk space in the project folder

## Stopping the Application

- Press `Ctrl+C` in the terminal where the application is running
- This will stop the server and clean up temporary files