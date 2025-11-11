import { put } from "@vercel/blob";

// Configure Vercel Blob with your token
const BLOB_READ_WRITE_TOKEN = "vercel_blob_rw_vyXU8mVP8lfBTV7Y_sil5JmFhDcXwlXaj68KcOSBxHyGuut";

export async function uploadFile(file, filename, expiresAt) {
  try {
    const options = { 
      access: 'public',
      token: BLOB_READ_WRITE_TOKEN
    };
    if (expiresAt) {
      options.addOptions = { expiresAt }; // ISO string
    }
    const { url } = await put(`uploads/${filename}`, file, options);
    return url;
  } catch (error) {
    console.error('Error uploading to Vercel Blob:', error);
    throw error;
  }
} 