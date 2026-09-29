export interface EducationFile {
  name?: string;
  originalname?: string;
  mimetype?: string;
  size?: number;
  buffer?: Buffer;
  data?: Buffer;
}

export interface EducationFiles {
  certificate?: EducationFile;
  marksheet?: EducationFile;
}