# Quick Fix for Local Installation Error

## Problem
You're getting a "ModuleNotFoundError: No module named 'flask_sqlalchemy'" error when running locally.

## Solution
Install the missing Flask-SQLAlchemy dependency by running this command:

### For Windows:
```cmd
pip install Flask-SQLAlchemy==3.1.1
```

### For macOS/Linux:
```bash
pip3 install Flask-SQLAlchemy==3.1.1
```

## Alternative: Run the Updated Script
The updated `run_local.bat` (Windows) or `run_local.sh` (Linux/macOS) scripts now include Flask-SQLAlchemy in the installation.

## What Flask-SQLAlchemy Does
This module enables the session save/load functionality so you can:
- Save your forensic analysis sessions
- Load previous cases to continue work
- Manage multiple investigations simultaneously

After installing Flask-SQLAlchemy, the application will work with all features including the new session management system!