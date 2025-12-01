const axios = require('axios');

const LALAL_API_BASE = 'https://www.lalal.ai/api';
const DEFAULT_SPLITTER = process.env.LALAL_SPLITTER || 'phoenix';
const ENHANCED_PROCESSING_ENABLED = process.env.LALAL_ENHANCED_PROCESSING !== 'false';

/**
 * Uploads an audio file to Lalal.ai
 * @param {Buffer} fileBuffer - The audio file as a buffer
 * @param {string} filename - The name of the file (e.g., "recording.wav")
 * @returns {Promise<{id: string, duration: number, size: number, expires: number}>}
 * @throws {Error} If upload fails or API returns an error
 */
async function uploadToLalal(fileBuffer, filename) {
  const licenseKey = process.env.LALAL_LICENSE_KEY || process.env.LALAL_AI_LICENSE_KEY;

  if (!licenseKey) {
    throw new Error('LALAL_LICENSE_KEY or LALAL_AI_LICENSE_KEY environment variable is not set');
  }

  try {
    const response = await axios.post(`${LALAL_API_BASE}/upload/`, fileBuffer, {
      headers: {
        'Content-Disposition': `attachment; filename=${filename}`,
        'Authorization': `license ${licenseKey}`,
      },
    });

    const data = response.data;

    if (data.status === 'error') {
      throw new Error(`Lalal.ai upload error: ${data.error}`);
    }

    return {
      id: data.id,
      duration: data.duration,
      size: data.size,
      expires: data.expires,
    };
  } catch (error) {
    if (error.response) {
      throw new Error(
        `Lalal.ai API error: ${error.response.status} - ${JSON.stringify(error.response.data)}`
      );
    }
    throw error;
  }
}

/**
 * Initiates the split process for a file using the Perseus splitter
 * and extracting drums
 * @param {string} fileId - The file ID obtained from uploadToLalal
 * @returns {Promise<Object>} The raw API response
 * @throws {Error} If split request fails
 */
async function splitWithLalal(fileId) {
  const licenseKey = process.env.LALAL_LICENSE_KEY || process.env.LALAL_AI_LICENSE_KEY;

  if (!licenseKey) {
    throw new Error('LALAL_LICENSE_KEY or LALAL_AI_LICENSE_KEY environment variable is not set');
  }

  // Prepare the params as a JSON string
  const params = JSON.stringify([
    {
      id: fileId,
      splitter: DEFAULT_SPLITTER,
      stem: 'drum',
      enhanced_processing_enabled: ENHANCED_PROCESSING_ENABLED,
    },
  ]);

  try {
    // Create URL-encoded form data
    const formData = new URLSearchParams();
    formData.append('params', params);

    const response = await axios.post(`${LALAL_API_BASE}/split/`, formData.toString(), {
      headers: {
        'Authorization': `license ${licenseKey}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });

    const data = response.data;

    if (data.status === 'error') {
      throw new Error(`Lalal.ai split error: ${data.error || 'Unknown error'}`);
    }

    return data;
  } catch (error) {
    if (error.response) {
      throw new Error(
        `Lalal.ai API error: ${error.response.status} - ${JSON.stringify(error.response.data)}`
      );
    }
    throw error;
  }
}

/**
 * Checks the status of a split task
 * @param {string} fileId - The file ID to check
 * @returns {Promise<Object>} The split task result for the specified file ID
 * @throws {Error} If check request fails
 */
async function checkLalal(fileId) {
  const licenseKey = process.env.LALAL_LICENSE_KEY || process.env.LALAL_AI_LICENSE_KEY;

  if (!licenseKey) {
    throw new Error('LALAL_LICENSE_KEY or LALAL_AI_LICENSE_KEY environment variable is not set');
  }

  try {
    // Create URL-encoded form data with the file id
    const formData = new URLSearchParams();
    formData.append('id', fileId);

    const response = await axios.post(`${LALAL_API_BASE}/check/`, formData.toString(), {
      headers: {
        'Authorization': `license ${licenseKey}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });

    const data = response.data;

    if (data.status === 'error') {
      throw new Error(`Lalal.ai check error: ${data.error || 'Unknown error'}`);
    }

    // Return the result for this specific file ID
    if (!data.result || !data.result[fileId]) {
      throw new Error(`No result found for file ID: ${fileId}`);
    }

    return data.result[fileId];
  } catch (error) {
    if (error.response) {
      throw new Error(
        `Lalal.ai API error: ${error.response.status} - ${JSON.stringify(error.response.data)}`
      );
    }
    throw error;
  }
}

/**
 * Polls the Lalal.ai API until the split task is complete
 * @param {string} fileId - The file ID to wait for
 * @param {number} pollInterval - Time in milliseconds between checks (default: 2000)
 * @param {number} maxAttempts - Maximum number of polling attempts (default: 150, ~5 minutes)
 * @returns {Promise<Object>} The split object containing stem_track, back_track, duration, etc.
 * @throws {Error} If the task fails, is cancelled, or times out
 */
async function waitForSplit(fileId, pollInterval = 2000, maxAttempts = 150) {
  let attempts = 0;

  while (attempts < maxAttempts) {
    attempts++;

    const result = await checkLalal(fileId);

    // Check task state
    if (result.task) {
      const { state, error, progress } = result.task;

      if (state === 'error') {
        throw new Error(`Lalal.ai split failed: ${error || 'Unknown error'}`);
      }

      if (state === 'cancelled') {
        throw new Error('Lalal.ai split task was cancelled');
      }

      if (state === 'success' && result.split) {
        // Successfully completed with split data
        return result.split;
      }

      if (state === 'progress') {
        console.log(`Split in progress: ${progress}%`);
      }
    }

    // Wait before checking again
    await new Promise((resolve) => setTimeout(resolve, pollInterval));
  }

  throw new Error(`Timeout waiting for split to complete after ${maxAttempts} attempts`);
}

module.exports = {
  uploadToLalal,
  splitWithLalal,
  checkLalal,
  waitForSplit,
};
