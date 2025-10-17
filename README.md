# Forma Project Info Extension

A React-based Forma extension that retrieves and displays comprehensive project information including geographic location, terrain bounds, and project metadata.

![Forma Extension Screenshot](/public/ScreenshotFormExtension.png)

## Features

- 📍 Geographic Location (Latitude/Longitude)
- 🗺️ Terrain Bounding Box Information
- 📐 Terrain Tile Dimensions and Area
- 📋 Project Metadata
- 💾 Export All Data as JSON

## Technical Details

- Built with React + TypeScript + Vite
- Uses Forma Embedded View SDK
- Implements CRS (Coordinate Reference System) handling
- Provides dimension calculations and area measurements

## Installation

1. Clone the repository:
```bash
git clone [your-repository-url]
cd Forma-Project-Info
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

## Usage

1. Launch the extension in Forma
2. Click "Get Project Info" to retrieve project metadata
3. Click "Get Terrain BBox" to fetch terrain bounds
4. Use "Copy JSON" to export all data to clipboard

## Data Structure

The extension provides the following information:
- Geographic coordinates (WGS84/EPSG:4326)
- Project details (ID, name, country, timezone, etc.)
- Terrain bounds with dimensions and area
- CRS information and reference points