export type MediaType = "IMAGE" | "VIDEO"| "AUDIO" | "FILE";

export interface UploadMediaResponse {
  url: string;
  fileId: string;
  fileName: string;
  fileType: MediaType;
  mimeType: string;
  size: number;
  thumbnailUrl?: string | null;
}