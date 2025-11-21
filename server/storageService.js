const path = require('path');
const { getSupabaseClient } = require('./supabaseClient');

/**
 * Download a remote file into a Buffer.
 */
async function fetchBuffer(remoteUrl) {
  const response = await fetch(remoteUrl);
  if (!response.ok) {
    throw new Error(`Failed to fetch ${remoteUrl}: ${response.status}`);
  }
  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

function buildStoragePath({ userId, kitId, projectId, filename }) {
  const owner = userId;
  const scope = kitId || projectId || 'unassigned';
  return [owner, scope, filename].join('/');
}

async function uploadBufferToSupabase({ bucket, storagePath, buffer, contentType }) {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(storagePath, buffer, {
      contentType,
      cacheControl: '3600',
      upsert: true,
    });

  if (error) {
    throw new Error(`Supabase upload failed for ${storagePath}: ${error.message}`);
  }

  const { data: signed, error: signedError } = await supabase.storage
    .from(bucket)
    .createSignedUrl(storagePath, 60 * 60); // 1 hour

  if (signedError) {
    throw new Error(`Supabase signed URL failed for ${storagePath}: ${signedError.message}`);
  }

  return { path: data.path, signedUrl: signed.signedUrl };
}

async function insertKitAsset({ supabase, ownerId, kitId, projectId, storagePath, assetType, sizeBytes }) {
  const { data, error } = await supabase
    .from('kit_assets')
    .insert({
      owner_id: ownerId,
      kit_id: kitId || null,
      project_id: projectId || null,
      asset_type: assetType,
      storage_path: storagePath,
      size_bytes: sizeBytes || null,
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to insert kit_assets for ${storagePath}: ${error.message}`);
  }

  return data;
}

/**
 * Upload Lalal.ai stem/back tracks into Supabase storage and optionally create kit_assets rows.
 */
async function uploadLalalResultsToSupabase({
  userId,
  projectId,
  kitId,
  stemTrackUrl,
  backTrackUrl,
  originalFilename = 'stem.wav',
}) {
  if (!userId) {
    throw new Error('userId is required to upload to Supabase storage');
  }

  const supabase = getSupabaseClient();
  const bucket = 'stems';

  const uploads = [];

  const targets = [
    { url: stemTrackUrl, label: 'stem' },
    { url: backTrackUrl, label: 'back' },
  ].filter((t) => t.url);

  for (const target of targets) {
    const ext = path.extname(originalFilename) || '.wav';
    const filename = `${target.label}-${Date.now()}${ext}`;
    const storagePath = buildStoragePath({ userId, kitId, projectId, filename });

    const buffer = await fetchBuffer(target.url);
    const upload = await uploadBufferToSupabase({
      bucket,
      storagePath,
      buffer,
      contentType: 'audio/wav',
    });

    let assetRow = null;
    try {
      assetRow = await insertKitAsset({
        supabase,
        ownerId: userId,
        kitId,
        projectId,
        storagePath,
        assetType: 'stem',
        sizeBytes: buffer.length,
      });
    } catch (err) {
      // Non-fatal: log and continue
      console.warn(err.message);
    }

    uploads.push({ label: target.label, ...upload, asset: assetRow });
  }

  return uploads;
}

module.exports = {
  uploadLalalResultsToSupabase,
};
