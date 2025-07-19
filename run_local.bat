@echo off
echo Starting Forensic Clueword Extractor...
echo.
echo Checking Python installation...
python --version
if errorlevel 1 (
    echo ERROR: Python is not installed or not in PATH
    echo Please install Python 3.8+ from https://python.org
    pause
    exit /b 1
)

echo.
echo Checking FFmpeg installation...
ffmpeg -version >nul 2>&1
if errorlevel 1 (
    echo ERROR: FFmpeg is not installed or not in PATH
    echo Please install FFmpeg from https://ffmpeg.org
    echo and add it to your system PATH
    pause
    exit /b 1
)

echo.
echo Installing Python dependencies...
pip install Flask==2.3.3 pydub==0.25.1 python-docx==0.8.11

echo.
echo Starting application...
echo Open your browser and go to: http://localhost:5000
echo Press Ctrl+C to stop the application
echo.
python app.py
pause