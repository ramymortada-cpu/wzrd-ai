/**
 * File Upload Handler — manages file uploads via S3.
 * Supports portal uploads (client files) and internal uploads.
 * 
 * Includes validation for file types and sizes.
 */

import { logger } from './logger';

/** Allowed file types by context */
const ALLOWED_TYPES: Record<string, string[]> = {
  portal: ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
  internal: ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/vnd.openxmlformats-officedocument.presentationml.presentation', 'text/csv', 'application/json'],
};

/** Max file sizes by context (bytes) */
const MAX_FILE_SIZE: Record<string, number> = {
  portal: 10 * 1024 * 1024,   // 10MB
  internal: 50 * 1024 * 1024,  // 50MB
};

export interface UploadResult {
  fileKey: string;
  fileUrl: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  mimeType: string;
}

/**
 * Validates a file before upload.
 */
export function validateFile(file: { name: string; size: number; type: string }, context: 'portal' | 'internal'): { valid: boolean; error?: string } {
  const allowedTypes = ALLOWED_TYPES[context] || ALLOWED_TYPES.internal;
  const maxSize = MAX_FILE_SIZE[context] || MAX_FILE_SIZE.internal;

  if (!file.name || file.name.length > 500) {
    return { valid: false, error: 'Invalid file name' };
  }

  if (file.size <= 0) {
    return { valid: false, error: 'File is empty' };
  }

  if (file.size > maxSize) {
    return { valid: false, error: `File too large. Maximum size is ${Math.round(maxSize / 1024 / 1024)}MB` };
  }

  if (!allowedTypes.includes(file.type)) {
    return { valid: false, error: `File type not allowed: ${file.type}` };
  }

  // Check for dangerous extensions
  const dangerousExtensions = ['.exe', '.bat', '.cmd', '.sh', '.ps1', '.js', '.vbs', '.wsf'];
  const ext = '.' + file.name.split('.').pop()?.toLowerCase();
  if (dangerousExtensions.includes(ext)) {
    return { valid: false, error: 'File type not allowed for security reasons' };
  }

  return { valid: true };
}

/**
 * Generates a unique S3 key for uploaded files.
 */
export function generateFileKey(context: string, projectId: number | null, fileName: string): string {
  const timestamp = Date.now();
  const sanitizedName = fileName
    .replace(/[^a-zA-Z0-9.-]/g, '_')
    .substring(0, 100);
  
  const prefix = projectId ? `projects/${projectId}` : 'general';
  return `uploads/${prefix}/${context}/${timestamp}_${sanitizedName}`;
}

/**
 * Get a presigned URL for client-side upload (direct to S3).
 * Returns the URL and key that the client will use.
 */
export async function getPresignedUploadUrl(
  fileKey: string,
  contentType: string,
  expiresIn: number = 300 // 5 minutes
): Promise<{ uploadUrl: string; fileUrl: string } | null> {
  try {
    // Dynamic import to avoid errors if AWS SDK is not configured
    const { S3Client, PutObjectCommand } = await import('@aws-sdk/client-s3');
    const { getSignedUrl } = await import('@aws-sdk/s3-request-presigner');

    const s3 = new S3Client({});
    const bucket = process.env.AWS_S3_BUCKET;
    if (!bucket) {
      logger.warn('AWS_S3_BUCKET not configured');
      return null;
    }

    const command = new PutObjectCommand({
      Bucket: bucket,
      Key: fileKey,
      ContentType: contentType,
    });

    const uploadUrl = await getSignedUrl(s3, command, { expiresIn });
    const fileUrl = `https://${bucket}.s3.amazonaws.com/${fileKey}`;

    return { uploadUrl, fileUrl };
  } catch (err) {
    logger.error({ err }, 'Failed to generate presigned URL');
    return null;
  }
}
