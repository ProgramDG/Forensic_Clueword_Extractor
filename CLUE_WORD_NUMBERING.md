# Clue Word Color System

## Overview
The Forensic Clueword Extractor now includes an intuitive color-based system that helps users track which audio segment corresponds to which clue word annotation. Each segment is assigned a unique color that appears both in the annotation list and on the highlighted waveform segments.

## Features

### 1. Independent Color System
- **Question Audio**: Has its own color sequence (Red, Teal, Blue, Green, etc.)
- **Control Audio**: Has its own independent color sequence (Red, Teal, Blue, Green, etc.)
- Same clue word labels can have the same color in both audio files

### 2. Visual Indicators
- **Annotation List**: Numbers appear as colored circular badges next to each clue word
- **Waveform Segments**: Segments are highlighted with their assigned colors
- **Headers**: Numbering indicator (🔢) shows in the annotation panel headers

### 3. Color Palette
The system uses 15 distinct, accessible colors:
- Red (#FF6B6B)
- Teal (#4ECDC4)
- Blue (#45B7D1)
- Green (#96CEB4)
- Yellow (#FFEAA7)
- Plum (#DDA0DD)
- Mint (#98D8C8)
- Gold (#F7DC6F)
- Purple (#BB8FCE)
- Sky Blue (#85C1E9)
- Orange (#F8C471)
- Light Green (#82E0AA)
- Salmon (#F1948A)
- Light Blue (#85C1E9)
- Peach (#FAD7A0)

### 4. Automatic Updates
- When a clue word is deleted, all remaining colors are automatically reassigned
- Colors are preserved when saving and loading sessions
- Colors are reset when creating a new session

## How It Works

### Creating Annotations
1. Select a segment on the waveform
2. Click "Name Segment" to add a clue word
3. Enter the clue word label
4. The system automatically assigns the next available color

### Visual Feedback
- **Colored circular badges** in the annotation list show the clue word number
- **Colored waveform segments** show the corresponding color
- **Numbers in badges** help with identification
- Colors are always sequential and cycle through the palette

### Session Management
- Colors are saved with session data
- When loading older sessions without colors, they are automatically assigned
- Creating a new session resets colors to start from the first color

## Benefits

1. **Immediate Visual Recognition**: Users can instantly see which segment matches which clue word
2. **No Complex Positioning**: No need for dynamic number bars or overlays
3. **Zoom Independent**: Colors work perfectly at any zoom level
4. **Professional Appearance**: Clean, modern color-coded system
5. **Accessibility**: High contrast colors for better visibility
6. **Automatic Maintenance**: Colors stay organized even when annotations are deleted

## Technical Details

- Colors are stored as part of the annotation object
- Each audio type (question/control) maintains its own independent color sequence
- Colors cycle through the predefined palette when more than 15 annotations exist
- All color operations are automatic and require no user intervention
- Colors are applied directly to WaveSurfer regions for optimal performance 