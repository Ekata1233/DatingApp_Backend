// src/types/express-fileupload.d.ts
import * as express from 'express';

declare global {
  namespace Express {
    interface Request {
      files?: fileUpload.FileArray;
    }
  }
}

declare module 'express-fileupload' {
  import * as express from 'express';

  export interface UploadedFile {
    name: string;
    data: Buffer;
    size: number;
    encoding: string;
    mimetype: string;
    tempFilePath: string;
    truncated: boolean;
    md5: string;
    mv: (path: string, callback: (err: any) => void) => void;
  }

  export interface FileArray {
    [fieldname: string]: UploadedFile | UploadedFile[];
  }

  export interface Options {
    // Add options if needed
  }

  function fileUpload(options?: Options): express.RequestHandler;
  export default fileUpload;
}