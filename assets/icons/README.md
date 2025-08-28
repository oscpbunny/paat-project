# PAAT Application Icons

This directory contains the application icons and branding assets for PAAT distribution.

## Required Icon Files

### Windows (.ico format)
- `icon.ico` - Main application icon (256x256, 128x128, 64x64, 48x48, 32x32, 16x16)
- `installer.ico` - NSIS installer icon (256x256)
- `uninstaller.ico` - NSIS uninstaller icon (256x256) 
- `installer-header.ico` - NSIS installer header icon (150x57)

### macOS (.icns format)
- `icon.icns` - Main application icon (1024x1024, 512x512, 256x256, 128x128, 64x64, 32x32, 16x16)

### Linux (.png format)
- `icon.png` - Main application icon (512x512)

### Additional Assets
- `dmg-background.png` - macOS DMG background image (540x380)

## Icon Design Guidelines

### Brand Identity
- **Primary Color**: #1976d2 (Material Blue)
- **Accent Color**: #f50057 (Material Pink)
- **Style**: Modern, professional, tech-focused
- **Theme**: AI/Automation with project management elements

### Design Elements
- Abstract geometric patterns representing AI/automation
- Subtle project management icons (kanban board, tasks, etc.)
- Clean, minimalist design suitable for professional development tools
- High contrast for visibility at small sizes

### Technical Requirements
- **Windows**: Must support multiple resolutions in single .ico file
- **macOS**: Must be properly formatted .icns with retina support
- **Linux**: High-resolution PNG with transparency
- **All**: Sharp edges, clear visibility at 16x16 pixels

## Icon Generation Tools
- **Electron Icon Generator**: `electron-icon-maker`
- **ImageMagick**: For batch conversion and resizing
- **GIMP/Photoshop**: For professional icon design
- **Online Tools**: Favicon.io, RealFaviconGenerator

## Installation
```bash
# Install electron-icon-maker for easy icon generation
npm install -g electron-icon-maker

# Generate all required formats from source PNG
electron-icon-maker --input=source-icon.png --output=./icons/
```

## Current Status
🚧 **PLACEHOLDER** - Production icons need to be created and placed in this directory.

The electron-builder configuration is ready to use these icons once they are created.

---
*Generated for PAAT v0.1.0 Distribution Preparation*
