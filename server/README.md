# Lalal.ai Backend Server

A simple Node.js Express backend for integrating with the Lalal.ai API to extract drum stems from audio files.

## Files

- **server/lalalService.js** - Helper functions for Lalal.ai API calls
- **server/index.js** - Express server with API endpoints

## Setup

1. **Add your Lalal.ai license key** to `.env.local`:
   ```
   LALAL_AI_LICENSE_KEY=your_actual_license_key_here
   ```

2. **Install dependencies** (already done):
   ```bash
   npm install
   ```

3. **Start the backend server**:
   ```bash
   npm run server
   ```

   The server will run on `http://localhost:3001`

## API Endpoint

### POST /api/lalal/split-drums

Uploads an audio file, splits it to extract drums using Lalal.ai Perseus splitter.

**Request:**
- Method: `POST`
- Content-Type: `multipart/form-data`
- Field name: `file`
- File: Any audio file (WAV, MP3, etc.)

**Example using fetch from React:**
```javascript
const formData = new FormData();
formData.append('file', audioBlob, 'recording.wav');

const response = await fetch('http://localhost:3001/api/lalal/split-drums', {
  method: 'POST',
  body: formData,
});

const result = await response.json();
```

**Response (success):**
```json
{
  "success": true,
  "stemTrackUrl": "https://...",
  "backTrackUrl": "https://...",
  "duration": 123.45,
  "stemTrackSize": 1234567,
  "backTrackSize": 2345678,
  "stem": "drum"
}
```

**Response (error):**
```json
{
  "success": false,
  "error": "Error message"
}
```

## How It Works

1. **Upload** - File is uploaded to Lalal.ai via `uploadToLalal()`
2. **Split** - Drum extraction is requested via `splitWithLalal()`
3. **Poll** - Status is checked every 2 seconds via `waitForSplit()`
4. **Return** - URLs to download the drum stem and backing track are returned

## Environment Variables

- `LALAL_LICENSE_KEY` or `LALAL_AI_LICENSE_KEY` - Your Lalal.ai license key (required)
- `PORT` - Server port (default: 3001)
- `FRONTEND_URL` - Frontend URL for CORS (default: http://localhost:3000)
