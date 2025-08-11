# Updated Workflow for Forensic Clueword Extractor

## New Segment Naming Workflow

The application has been updated to provide a better user experience when creating audio segment annotations. Here's how the new workflow works:

### Previous Workflow (Old)
1. User drags to select an audio segment
2. Popup immediately appears asking for clueword name
3. User has to guess what the segment contains without hearing it

### New Workflow (Updated)
1. User drags to select an audio segment
2. Segment is highlighted but no popup appears
3. "Name Segment" button becomes active and shows count of pending segments
4. User clicks "Name Segment" button
5. Selected segment automatically plays so user can hear the content
6. Popup appears for naming the segment
7. After naming, segment is saved to the annotations list

### Key Improvements

#### Visual Feedback
- **"Name Segment" button**: Appears after each audio panel's Stop button
- **Button states**: 
  - Disabled (gray) when no segments are selected
  - Enabled (yellow with pulse animation) when segments are pending
  - Shows count: "Name Segment (2)" when multiple segments are pending

#### Audio Preview
- When "Name Segment" is clicked, the selected segment automatically plays
- User can hear the content before deciding on the clueword name
- This eliminates the need to guess what the segment contains

#### Better User Control
- Users can select multiple segments before naming them
- Each segment is processed one at a time
- Users can cancel naming and the segment is removed
- Clear status messages guide the user through the process

### Technical Changes

#### JavaScript Updates
- Added `pendingRegions` object to track segments awaiting naming
- Modified `handleRegionCreated()` to not immediately show popup
- Added `handleNameSegmentClick()` function for button interaction
- Updated `updateNameSegmentButtonState()` for visual feedback
- Enhanced `showAnnotationModal()` to support custom titles

#### HTML Updates
- Added "Name Segment" buttons to both question and control audio panels
- Buttons are initially disabled and become enabled when segments are selected

#### CSS Updates
- Added styling for "Name Segment" button states
- Pulse animation for active buttons
- Warning color scheme (yellow) to draw attention

### Benefits

1. **Better Accuracy**: Users can hear segments before naming them
2. **Improved UX**: No more guessing what segments contain
3. **Batch Processing**: Can select multiple segments before naming
4. **Visual Clarity**: Clear indication of pending segments
5. **Error Prevention**: Reduces mislabeled annotations

### Usage Instructions

1. **Upload Audio Files**: Load question and control audio files
2. **Select Segments**: Click and drag on waveforms to create selections
3. **Review Segments**: Notice the "Name Segment" button becomes active
4. **Name Segments**: Click "Name Segment" to hear and name each segment
5. **Complete Analysis**: Generate clueword analysis when all segments are named

This workflow ensures that forensic analysts can accurately identify and label audio segments with confidence, leading to more reliable analysis results. 