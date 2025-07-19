# Creating Standalone EXE for Forensic Clueword Extractor

## Overview
This guide explains how to convert the Flask-based Forensic Clueword Extractor into a standalone Windows executable (.exe) file that can run on any Windows computer without requiring Python installation.

## Method 1: PyInstaller (Recommended)

### Step 1: Prepare the Environment
```bash
# Install PyInstaller
pip install pyinstaller

# Install all project dependencies
pip install flask pydub python-docx gunicorn
```

### Step 2: Create Standalone Script
Create a new file called `standalone_app.py`:

```python
import os
import sys
import threading
import webbrowser
from flask import Flask
import time
import socket

# Add the current directory to Python path
if hasattr(sys, '_MEIPASS'):
    # When running as PyInstaller bundle
    base_path = sys._MEIPASS
else:
    # When running as script
    base_path = os.path.dirname(os.path.abspath(__file__))

# Import your main app
sys.path.insert(0, base_path)
from app import app

def find_free_port():
    """Find a free port to run the Flask app"""
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        s.bind(('', 0))
        s.listen(1)
        port = s.getsockname()[1]
    return port

def run_flask_app(port):
    """Run Flask app in a separate thread"""
    app.run(host='127.0.0.1', port=port, debug=False, use_reloader=False)

def main():
    # Find available port
    port = find_free_port()
    
    # Start Flask app in background thread
    flask_thread = threading.Thread(target=run_flask_app, args=(port,))
    flask_thread.daemon = True
    flask_thread.start()
    
    # Wait a moment for Flask to start
    time.sleep(2)
    
    # Open browser
    url = f"http://127.0.0.1:{port}"
    print(f"Starting Forensic Clueword Extractor at {url}")
    webbrowser.open(url)
    
    # Keep the main thread alive
    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        print("Shutting down...")

if __name__ == '__main__':
    main()
```

### Step 3: Create PyInstaller Spec File
Create `forensic_app.spec`:

```python
# -*- mode: python ; coding: utf-8 -*-

block_cipher = None

a = Analysis(
    ['standalone_app.py'],
    pathex=[],
    binaries=[],
    datas=[
        ('templates', 'templates'),
        ('static', 'static'),
        ('app.py', '.'),
    ],
    hiddenimports=['pydub', 'python-docx', 'flask'],
    hookspath=[],
    hooksconfig={},
    runtime_hooks=[],
    excludes=[],
    win_no_prefer_redirects=False,
    win_private_assemblies=False,
    cipher=block_cipher,
    noarchive=False,
)

pyz = PYZ(a.pure, a.zipped_data, cipher=block_cipher)

exe = EXE(
    pyz,
    a.scripts,
    a.binaries,
    a.zipfiles,
    a.datas,
    [],
    name='ForensicCluewordExtractor',
    debug=False,
    bootloader_ignore_signals=False,
    strip=False,
    upx=True,
    upx_exclude=[],
    runtime_tmpdir=None,
    console=True,
    disable_windowed_traceback=False,
    target_arch=None,
    codesign_identity=None,
    entitlements_file=None,
    icon='icon.ico'  # Optional: Add your icon file
)
```

### Step 4: Bundle FFmpeg
Download FFmpeg for Windows:
1. Go to https://ffmpeg.org/download.html
2. Download Windows build
3. Extract `ffmpeg.exe` to your project folder
4. Update the spec file to include it:

```python
# Add to binaries in the spec file
binaries=[('ffmpeg.exe', '.')],
```

### Step 5: Build the EXE
```bash
pyinstaller forensic_app.spec
```

The executable will be created in the `dist` folder.

## Method 2: Auto-py-to-exe (GUI Tool)

### Step 1: Install Auto-py-to-exe
```bash
pip install auto-py-to-exe
```

### Step 2: Launch GUI
```bash
auto-py-to-exe
```

### Step 3: Configure Settings
- **Script Location**: Select `standalone_app.py`
- **Onefile**: Yes (creates single .exe file)
- **Console Window**: Yes (for debugging)
- **Additional Files**: Add templates/, static/, app.py, ffmpeg.exe
- **Hidden Imports**: flask, pydub, python-docx

### Step 4: Convert
Click "CONVERT .PY TO .EXE"

## Method 3: Electron-based (Advanced)

For a more professional desktop app experience:

### Step 1: Create Electron Wrapper
```bash
npm init -y
npm install electron electron-builder
```

### Step 2: Create main.js
```javascript
const { app, BrowserWindow } = require('electron');
const { spawn } = require('child_process');
const path = require('path');

let mainWindow;
let flaskProcess;

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1200,
        height: 800,
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true
        },
        icon: path.join(__dirname, 'icon.png') // Optional
    });

    // Start Flask backend
    flaskProcess = spawn('python', ['app.py'], {
        cwd: __dirname
    });

    // Load the app
    setTimeout(() => {
        mainWindow.loadURL('http://127.0.0.1:5000');
    }, 3000);
}

app.whenReady().then(createWindow);

app.on('before-quit', () => {
    if (flaskProcess) {
        flaskProcess.kill();
    }
});
```

## Important Notes for All Methods

### FFmpeg Integration
- FFmpeg must be bundled with the executable
- Update `app.py` to look for FFmpeg in the correct path:

```python
import sys
import os

# Get FFmpeg path for bundled app
if hasattr(sys, '_MEIPASS'):
    ffmpeg_path = os.path.join(sys._MEIPASS, 'ffmpeg.exe')
else:
    ffmpeg_path = 'ffmpeg'  # Assume it's in PATH

# Configure pydub to use the bundled FFmpeg
from pydub import AudioSegment
from pydub.utils import which
AudioSegment.converter = ffmpeg_path
AudioSegment.ffmpeg = ffmpeg_path
AudioSegment.ffprobe = ffmpeg_path.replace('ffmpeg', 'ffprobe')
```

### File Paths
Update all file operations to use absolute paths:

```python
import os
import sys

def get_resource_path(relative_path):
    """Get absolute path to resource, works for dev and for PyInstaller"""
    if hasattr(sys, '_MEIPASS'):
        return os.path.join(sys._MEIPASS, relative_path)
    return os.path.join(os.path.abspath("."), relative_path)

# Use this for templates, static files, etc.
app.template_folder = get_resource_path('templates')
app.static_folder = get_resource_path('static')
```

### Testing
1. Test the standalone script before building
2. Test the .exe on a clean Windows machine without Python
3. Ensure all audio formats work correctly
4. Verify all features function as expected

### Distribution
- The final .exe will be 50-100MB due to bundled Python and dependencies
- Consider creating an installer using NSIS or Inno Setup
- Include FFmpeg license information if distributing

## Recommended Approach
**PyInstaller with the spec file method** is recommended because:
- Creates a single executable file
- Handles dependencies automatically  
- Works reliably with Flask applications
- Supports bundling additional files easily
- Creates professional standalone applications

The resulting .exe will run the complete Forensic Clueword Extractor application locally without any installation requirements!