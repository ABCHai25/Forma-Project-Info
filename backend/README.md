# Express Backend

Express.js backend server that handles tile storage, proxies tree detection requests to the Python API, and generates 3D models.

## Prerequisites

- Node.js 16+ and npm
- Python backend running on port 5001 (for tree detection and model generation)

## Installation

```bash
cd backend
npm install
```

## Environment Variables

Create a `.env` file in the `backend` directory (optional):

```env
PORT=3001
PYTHON_API_URL=http://localhost:5001
```

**Defaults:**
- `PORT`: 3001
- `PYTHON_API_URL`: http://localhost:5001

## Starting the Server

```bash
npm start
```

Or with nodemon for development (auto-restart on changes):

```bash
npm run dev
```

The server will start on `http://0.0.0.0:3001` (accessible from localhost and network).

## API Endpoints

### Health Check
```
GET /health
```
Checks both Express and Python backend status.

**Response:**
```json
{
  "status": "ok",
  "message": "Backend is running",
  "express": "ok",
  "python": "ok"
}
```

### Save Tile
```
POST /api/saveTile
```
Downloads and saves a Mapbox satellite tile to disk.

**Request Body:**
```json
{
  "imageUrl": "https://api.mapbox.com/...",
  "projectId": "pro_xxxxx",
  "zoom": 18,
  "bbox": { "west": 0, "south": 0, "east": 100, "north": 100 },
  "center": { "x": 50, "y": 50 }
}
```

### List Tiles
```
GET /api/tiles
```
Lists all saved tiles with their metadata.

### Detect Trees
```
POST /api/detect-trees
Content-Type: multipart/form-data
```
Proxies tree detection request to Python backend.

**Form Data:**
- `image`: Image file (PNG/JPEG)
- `hue_min`, `hue_max`: Hue range (0-179)
- `sat_min`, `sat_max`: Saturation range (0-255)
- `val_min`, `val_max`: Value range (0-255)
- `min_diameter`, `max_diameter`: Diameter range in meters
- `cluster_threshold`: Distance threshold for clustering (meters)
- `real_width`, `real_height`: Real-world dimensions (meters)

**Response:**
```json
{
  "individualTrees": [...],
  "treeClusters": [...],
  "summary": {
    "individualTreesCount": 10,
    "treeClustersCount": 5,
    "totalPopulatedTrees": 50
  }
}
```

### Generate 3D Model
```
POST /api/generate-model
Content-Type: application/json
```
Generates OBJ file from tree detection results.

**Request Body:**
Send the complete tree detection JSON from `/api/detect-trees`.

**Response:**
OBJ file content (text/plain) with `Content-Disposition: attachment`.

## Directory Structure

```
backend/
├── index.js           # Main Express server
├── package.json       # Dependencies
├── .env              # Environment variables (not committed)
└── README.md         # This file
```

## Dependencies

- `express`: Web framework
- `cors`: Cross-origin resource sharing
- `axios`: HTTP client
- `multer`: File upload handling
- `form-data`: Multipart form data
- `dotenv`: Environment variable loading

## Development

The server uses `nodemon` for development, which automatically restarts when files change:

```bash
npm run dev
```

## Logs

The server logs all requests to the console:
- 🌳 Tree detection requests
- 🏗️ Model generation requests
- ✅ Success messages
- ❌ Error messages

## Error Handling

All endpoints return structured error responses:

```json
{
  "error": "Error title",
  "message": "Detailed error message",
  "details": { /* additional context */ }
}
```

**Common errors:**
- **503 Service Unavailable**: Python backend not running
- **400 Bad Request**: Missing or invalid parameters
- **500 Internal Server Error**: Unexpected server error

## Troubleshooting

**Python backend unavailable:**
```
Error: Python backend unavailable
Hint: Run: cd python_backend && python main.py
```
→ Start the Python backend on port 5001.

**Port already in use:**
```
Error: listen EADDRINUSE: address already in use :::3001
```
→ Change `PORT` in `.env` or kill the process using port 3001.

**CORS errors:**
→ The server allows all origins by default. Check browser console for details.

## Production Notes

- Update CORS configuration for production (restrict origins)
- Add rate limiting for API endpoints
- Use environment variables for sensitive data
- Consider adding authentication/authorization
- Set up proper logging (e.g., winston, morgan)
