
export interface ColorOption {
  id: string;
  name: string;
  hex: string;
  description: string;
}

export interface GeneratedVersion {
  id: string;
  originalImage: string;
  editedImage: string;
  colorName: string;
  timestamp: number;
}

export enum AppStatus {
  IDLE = 'IDLE',
  UPLOADING = 'UPLOADING',
  PROCESSING = 'PROCESSING',
  SUCCESS = 'SUCCESS',
  ERROR = 'ERROR'
}
