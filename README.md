# Forma Project Info Extension

A React-based Forma extension that retrieves and displays comprehensive project information including geographic location, terrain bounds, project metadata, and Mapbox satellite imagery.

![Forma Extension Screenshot](/public/FormaWithZoom.png)

## Features

- 📍 Geographic Location (Latitude/Longitude)
- 🗺️ Terrain Bounding Box Information
- 🛰️ Mapbox Satellite Imagery Integration
- 🔍 Interactive Zoom Controls
- 📐 Terrain Tile Dimensions and Area
- 📋 Project Metadata
- 💾 Export All Data as JSON

## Technical Details

- Built with React + TypeScript + Vite
- Uses Forma Embedded View SDK
- Integrates Mapbox Static Images API
- Implements CRS (Coordinate Reference System) handling
- Provides dimension calculations and area measurements

## Prerequisites

- Node.js (version 14 or higher)
- npm or yarn
- Forma account and access
- **Mapbox Access Token** (Get one at [mapbox.com](https://account.mapbox.com/))

## Installation

1. Clone the repository:
```bash
git clone https://github.com/YOUR_USERNAME/Forma-Project-Info.git
cd Forma-Project-Info
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the project root:
```bash
VITE_MAPBOX_TOKEN=your_mapbox_token_here
```

4. Start the development server:
```bash
npm run dev
```

## Usage

1. Launch the extension in Forma
2. Click **"Get Project Info"** to retrieve project metadata (location, ID, timezone, etc.)
3. Click **"Get Terrain BBox"** to fetch terrain bounds and dimensions
4. Click **"Fetch Mapbox Tile"** to load satellite imagery
5. Use zoom controls (➕ Zoom In / ➖ Zoom Out / 🔄 Reset) to adjust the view
6. Click **"Copy JSON"** to export project data
7. Click **"Copy Mapbox JSON"** to export Mapbox parameters (without API token)

## Data Structure

The extension provides the following information:
- **Geographic coordinates** (WGS84/EPSG:4326)
- **Project details** (ID, name, country, timezone, SRID)
- **Terrain bounds** with dimensions (width, length) and area
- **Mapbox satellite imagery** with adjustable zoom levels
- **CRS information** and reference points

## Environment Variables

Create a `.env` file with the following variables:

```env
VITE_MAPBOX_TOKEN=your_mapbox_access_token_here
```

**⚠️ Important:** Never commit your `.env` file to version control. It's already included in `.gitignore`.

## Security

- API tokens are stored in environment variables
- Tokens are never exposed in exported JSON or console logs
- The `.env` file is excluded from Git tracking

## Development

Built following the [official Forma tutorial](https://aps.autodesk.com/en/docs/forma/v1/embedded-views/tutorial/).

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build

## License

[Your chosen license]

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request