require('dotenv').config({ path: '.env.local', override: true });

const express = require('express');
const multer = require('multer');
const cors = require('cors');
const { uploadToLalal, splitWithLalal, waitForSplit } = require('./lalalService');

const app = express();
const PORT = process.env.PORT || 3001;

// Configure multer to store uploaded files in memory
const upload = multer({ storage: multer.memoryStorage() });

// Enable CORS for frontend (adjust origin if needed)
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
}));

// Parse JSON bodies
app.use(express.json());

/**
 * Health check endpoint
 */
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Lalal.ai backend is running' });
});

/**
 * Main endpoint to split drums from an audio file using Lalal.ai
 *
 * POST /api/lalal/split-drums
 *
 * Expects:
 * - multipart/form-data with a 'file' field containing the audio file
 *
 * Returns:
 * - JSON with stemTrackUrl, backTrackUrl, and duration on success
 * - JSON with error message on failure
 */
app.post('/api/lalal/split-drums', upload.single('file'), async (req, res) => {
  try {
    // Validate that a file was uploaded
    if (!req.file) {
      return res.status(400).json({
        error: 'No file uploaded. Please provide a file in the "file" field.'
      });
    }

    const fileBuffer = req.file.buffer;
    const originalFilename = req.file.originalname || 'recording.wav';

    console.log(`Processing file: ${originalFilename} (${fileBuffer.length} bytes)`);

    // Step 1: Upload the file to Lalal.ai
    console.log('Uploading to Lalal.ai...');
    const uploadResult = await uploadToLalal(fileBuffer, originalFilename);
    console.log(`File uploaded successfully. ID: ${uploadResult.id}, Duration: ${uploadResult.duration}s`);

    // Step 2: Request the split (drums extraction)
    console.log('Requesting split...');
    await splitWithLalal(uploadResult.id);
    console.log('Split request submitted');

    // Step 3: Wait for the split to complete
    console.log('Waiting for split to complete...');
    const splitResult = await waitForSplit(uploadResult.id);
    console.log('Split completed successfully');

    // Step 4: Return the results to the frontend
    return res.json({
      success: true,
      stemTrackUrl: splitResult.stem_track,
      backTrackUrl: splitResult.back_track,
      duration: splitResult.duration,
      stemTrackSize: splitResult.stem_track_size,
      backTrackSize: splitResult.back_track_size,
      stem: splitResult.stem,
    });

  } catch (error) {
    console.error('Error processing split-drums request:', error.message);
    return res.status(500).json({
      error: error.message || 'Failed to process audio split',
      success: false,
    });
  }
});

/**
 * Check Lalal.ai license limits (optional utility endpoint)
 */
app.get('/api/lalal/limits', async (req, res) => {
  try {
    const licenseKey = process.env.LALAL_LICENSE_KEY || process.env.LALAL_AI_LICENSE_KEY;
    if (!licenseKey) {
      return res.status(500).json({ error: 'License key not configured' });
    }

    // Note: This endpoint is documented but implementation would require fetching from:
    // GET /billing/get-limits/?key=<license key>
    // For now, we'll just return a placeholder
    res.json({
      message: 'Limits endpoint not yet implemented',
      hint: 'Use GET /billing/get-limits/?key=<license key> directly'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`Lalal.ai backend server running on http://localhost:${PORT}`);
  console.log(`API endpoint: http://localhost:${PORT}/api/lalal/split-drums`);

  if (!process.env.LALAL_LICENSE_KEY && !process.env.LALAL_AI_LICENSE_KEY) {
    console.warn('\n⚠️  WARNING: LALAL_LICENSE_KEY or LALAL_AI_LICENSE_KEY environment variable is not set!');
    console.warn('Please add your Lalal.ai license key to your .env.local file.\n');
  }
});
