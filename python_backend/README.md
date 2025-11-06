# Tree Detection API - Python Backend

## Setup Instructions

### 1. Create Virtual Environment

```bash
cd python_backend
python -m venv venv
```

### 2. Activate Virtual Environment

**Windows:**
```bash
venv\Scripts\activate
```

**Mac/Linux:**
```bash
source venv/bin/activate
```

### 3. Install Dependencies

```bash
pip install -r requirements.txt
```

### 4. Run the Server

```bash
python main.py
```

The server will start on **http://localhost:5001**

## Testing

### Health Check
Open browser: http://localhost:5001/health

Expected response:
```json
{
  "status": "ok",
  "service": "tree-detection",
  "message": "Python FastAPI backend is running"
}
```

### API Documentation
FastAPI provides automatic interactive docs:
- **Swagger UI:** http://localhost:5001/docs
- **ReDoc:** http://localhost:5001/redoc

You can test the `/detect-trees` endpoint directly from the Swagger UI!

## Development

### Check Python Version
```bash
python --version
```
Requires Python 3.8 or higher.

### View Logs
The server logs all requests and errors to console.

### Stop Server
Press `Ctrl+C` in the terminal.

## Troubleshooting

### "python: command not found"
- Install Python 3.8+ from https://www.python.org/downloads/
- Or use `python3` instead of `python`

### Port 5001 already in use
Change port in `main.py`:
```python
uvicorn.run(app, host="0.0.0.0", port=5002)
```

### OpenCV errors
Reinstall OpenCV:
```bash
pip uninstall opencv-python
pip install opencv-python==4.8.1.78
```
