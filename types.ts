export enum UploadStatus {
  IDLE = 'IDLE',
  UPLOADING = 'UPLOADING',
  SUCCESS = 'SUCCESS',
  ERROR = 'ERROR',
}

export interface FileUploadItem {
  id: string;
  file: File;
  progress: number;
  status: UploadStatus;
  publicUrl?: string;
  errorMessage?: string;
}

export interface N8nResponse {
  url?: string; // Adjust based on your actual n8n output
  publicUrl?: string;
  link?: string;
  data?: {
    url?: string;
  }
}