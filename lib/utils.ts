import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { File, FileText, FileImage, FileVideo, FileAudio, LucideIcon } from "lucide-react"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getBaseUrl() {
  if (typeof window !== 'undefined') {
    return window.location.origin
  }
  // Fallback for server-side
  return process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
}

export function generateDownloadUrl(shareCode: string) {
  return `${getBaseUrl()}/link/${shareCode}`
}

export function formatBytes(bytes: number, decimals = 2) {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

export function getFileIcon(fileType: string) {
  if (fileType.startsWith('image/')) return FileImage;
  if (fileType.startsWith('video/')) return FileVideo;
  if (fileType.startsWith('audio/')) return FileAudio;
  if (fileType.startsWith('text/')) return FileText;
  return File;
}
