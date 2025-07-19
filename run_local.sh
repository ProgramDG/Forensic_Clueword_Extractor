#!/bin/bash

echo "Starting Forensic Clueword Extractor..."
echo

echo "Checking Python installation..."
if ! command -v python3 &> /dev/null; then
    echo "ERROR: Python 3 is not installed"
    echo "Please install Python 3.8+ from your package manager or python.org"
    exit 1
fi

python3 --version

echo
echo "Checking FFmpeg installation..."
if ! command -v ffmpeg &> /dev/null; then
    echo "ERROR: FFmpeg is not installed"
    echo "Please install FFmpeg:"
    echo "  Ubuntu/Debian: sudo apt-get install ffmpeg"
    echo "  macOS: brew install ffmpeg"
    echo "  Or download from https://ffmpeg.org"
    exit 1
fi

echo "FFmpeg found"

echo
echo "Installing Python dependencies..."
pip3 install Flask==2.3.3 pydub==0.25.1 python-docx==0.8.11

echo
echo "Starting application..."
echo "Open your browser and go to: http://localhost:5000"
echo "Press Ctrl+C to stop the application"
echo

python3 app.py