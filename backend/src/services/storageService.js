const fs = require('fs');
const path = require('path');
const { S3Client, PutObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');
const cloudinary = require('cloudinary').v2;
const {
  sanitizeAdmissionNumber,
  sanitizeSchoolCode,
  savePhotoBuffer,
  findPhotoPath,
} = require('../utils/photoStorageHelper');

/**
 * Check if Cloudinary is configured
 */
const isCloudinaryConfigured = () => {
  const provider = (process.env.STORAGE_PROVIDER || '').toLowerCase();
  const hasCloudinaryCreds = Boolean(
    process.env.CLOUDINARY_URL ||
    (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET)
  );

  return provider === 'cloudinary' || (hasCloudinaryCreds && provider !== 'cloudflare_r2');
};

/**
 * Check if Cloudflare R2 / S3 storage is configured
 */
const isCloudflareR2Configured = () => {
  const provider = (process.env.STORAGE_PROVIDER || '').toLowerCase();
  const hasR2Creds = Boolean(
    process.env.R2_ACCOUNT_ID &&
    process.env.R2_ACCESS_KEY_ID &&
    process.env.R2_SECRET_ACCESS_KEY &&
    process.env.R2_BUCKET_NAME
  );

  return provider === 'cloudflare_r2' || (hasR2Creds && provider !== 'cloudinary');
};

/**
 * Initialize Cloudinary
 */
let cloudinaryInitialized = false;
const initCloudinary = () => {
  if (!cloudinaryInitialized && isCloudinaryConfigured()) {
    if (process.env.CLOUDINARY_URL) {
      cloudinary.config();
    } else {
      cloudinary.config({
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        api_key: process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_API_SECRET,
        secure: true,
      });
    }
    cloudinaryInitialized = true;
  }
};

/**
 * Initialize S3 Client for Cloudflare R2
 */
let r2Client = null;
const getR2Client = () => {
  if (!r2Client && isCloudflareR2Configured()) {
    const accountId = process.env.R2_ACCOUNT_ID;
    r2Client = new S3Client({
      region: 'auto',
      endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID,
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
      },
    });
  }
  return r2Client;
};

/**
 * Map extensions to MIME content types
 */
const getContentType = (ext) => {
  const cleanExt = (ext || '').replace(/^\./, '').toLowerCase();
  switch (cleanExt) {
    case 'png':
      return 'image/png';
    case 'webp':
      return 'image/webp';
    case 'gif':
      return 'image/gif';
    case 'svg':
      return 'image/svg+xml';
    case 'jpg':
    case 'jpeg':
    default:
      return 'image/jpeg';
  }
};

/**
 * Upload student photo to Cloudinary
 */
const uploadToCloudinary = async ({ buffer, cleanAdm, cleanCode, cleanExt }) => {
  initCloudinary();

  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: `schools/${cleanCode}/photos`,
        public_id: cleanAdm,
        overwrite: true,
        resource_type: 'image',
        format: cleanExt === 'jpg' || cleanExt === 'jpeg' ? 'jpg' : cleanExt,
      },
      (error, result) => {
        if (error) return reject(error);
        resolve({
          success: true,
          photoUrl: result.secure_url || result.url,
          fileName: `${cleanAdm}.${result.format || cleanExt}`,
          key: result.public_id,
          schoolCode: cleanCode,
          admissionNumber: cleanAdm,
          isCloud: true,
          provider: 'cloudinary',
        });
      }
    );

    uploadStream.end(buffer);
  });
};

/**
 * Upload student photo to Cloudflare R2
 */
const uploadToR2 = async ({ buffer, cleanAdm, cleanCode, cleanExt }) => {
  const client = getR2Client();
  const bucketName = process.env.R2_BUCKET_NAME;
  const fileName = `${cleanAdm}.${cleanExt}`;
  const key = `schools/${cleanCode}/photos/${fileName}`;
  const contentType = getContentType(cleanExt);

  const command = new PutObjectCommand({
    Bucket: bucketName,
    Key: key,
    Body: buffer,
    ContentType: contentType,
  });

  await client.send(command);

  const publicBase = (process.env.R2_PUBLIC_URL || '').replace(/\/$/, '');
  const photoUrl = publicBase
    ? `${publicBase}/${key}`
    : `https://${bucketName}.${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com/${key}`;

  return {
    success: true,
    photoUrl,
    fileName,
    key,
    schoolCode: cleanCode,
    admissionNumber: cleanAdm,
    isCloud: true,
    provider: 'cloudflare_r2',
  };
};

/**
 * Upload student photo (Cloudinary -> Cloudflare R2 -> Local Fallback)
 *
 * @param {Object} params
 * @param {Buffer} params.buffer - Image binary buffer
 * @param {String} params.ext - File extension ('jpg', 'png', etc.)
 * @param {String} params.admissionNumber - Student Admission Number
 * @param {String} params.schoolCode - School Code
 * @param {Object} [params.req] - Express request for constructing URLs if local
 * @returns {Promise<Object>}
 */
const uploadPhoto = async ({ buffer, ext = 'jpg', admissionNumber, schoolCode = 'DEFAULT', req }) => {
  const cleanAdm = sanitizeAdmissionNumber(admissionNumber);
  const cleanCode = sanitizeSchoolCode(schoolCode);
  const cleanExt = (ext || 'jpg').replace(/^\./, '').toLowerCase() || 'jpg';
  const fileName = `${cleanAdm}.${cleanExt}`;

  // 1. Cloudinary Upload
  if (isCloudinaryConfigured()) {
    try {
      return await uploadToCloudinary({ buffer, cleanAdm, cleanCode, cleanExt });
    } catch (error) {
      console.error('[Cloudinary] Upload failed, trying next provider or local fallback:', error.message);
    }
  }

  // 2. Cloudflare R2 Upload
  if (isCloudflareR2Configured()) {
    try {
      return await uploadToR2({ buffer, cleanAdm, cleanCode, cleanExt });
    } catch (error) {
      console.error('[Cloudflare R2] Upload failed, falling back to local storage:', error.message);
    }
  }

  // 3. Local Storage Fallback
  const saved = savePhotoBuffer({
    buffer,
    ext: cleanExt,
    admissionNumber: cleanAdm,
    schoolCode: cleanCode,
  });

  const protocol = (req && req.protocol) || 'http';
  const host = (req && req.get && req.get('host')) || 'localhost:5050';
  const photoUrl = `${protocol}://${host}${saved.relativeSchoolUrl}`;

  return {
    success: true,
    photoUrl,
    fileName: saved.fileName,
    key: `schools/${cleanCode}/photos/${saved.fileName}`,
    schoolCode: cleanCode,
    admissionNumber: cleanAdm,
    isCloud: false,
    provider: 'local',
    relativeUrl: saved.relativeSchoolUrl,
  };
};

/**
 * Fetch photo buffer (from Cloudinary, Cloudflare R2, CDN URL, or local disk)
 *
 * @param {String} photoUrl - Photo URL or file path
 * @param {String} admissionNumber - Student Admission Number
 * @param {String} schoolCode - School Code
 * @returns {Promise<Buffer|null>}
 */
const fetchPhotoBuffer = async (photoUrl, admissionNumber, schoolCode = 'DEFAULT') => {
  try {
    // 1. If it's a remote URL (Cloudinary / Cloudflare R2 / CDN / HTTP)
    if (photoUrl && photoUrl.startsWith('http')) {
      const res = await fetch(photoUrl, { signal: AbortSignal.timeout(8000) });
      if (res.ok) {
        const arrayBuf = await res.arrayBuffer();
        return Buffer.from(arrayBuf);
      }
    }

    // 2. If it's a Base64 data URI
    if (photoUrl && photoUrl.startsWith('data:image/')) {
      const matches = photoUrl.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
      if (matches && matches.length === 3) {
        return Buffer.from(matches[2], 'base64');
      }
    }

    // 3. If local file exists
    const localPath = findPhotoPath(admissionNumber, schoolCode);
    if (localPath && fs.existsSync(localPath)) {
      return fs.readFileSync(localPath);
    }
  } catch (error) {
    console.error(`[StorageService] Error fetching photo for ${admissionNumber}:`, error.message);
  }
  return null;
};

/**
 * Delete photo from Cloudinary, Cloudflare R2, or local disk
 */
const deletePhoto = async (keyOrUrl, admissionNumber, schoolCode = 'DEFAULT') => {
  if (isCloudinaryConfigured() && keyOrUrl) {
    try {
      initCloudinary();
      await cloudinary.uploader.destroy(keyOrUrl);
      return true;
    } catch (err) {
      console.error('[Cloudinary] Delete failed:', err.message);
    }
  }

  if (isCloudflareR2Configured() && keyOrUrl) {
    try {
      const client = getR2Client();
      const bucketName = process.env.R2_BUCKET_NAME;
      let key = keyOrUrl;
      if (keyOrUrl.startsWith('http')) {
        const urlObj = new URL(keyOrUrl);
        key = urlObj.pathname.replace(/^\//, '');
      }

      await client.send(new DeleteObjectCommand({ Bucket: bucketName, Key: key }));
      return true;
    } catch (err) {
      console.error('[Cloudflare R2] Delete failed:', err.message);
    }
  }
  return false;
};

module.exports = {
  isCloudinaryConfigured,
  isCloudflareR2Configured,
  uploadPhoto,
  fetchPhotoBuffer,
  deletePhoto,
  getContentType,
};
