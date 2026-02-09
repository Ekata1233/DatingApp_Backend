// import { UploadedFile } from "express-fileupload";

// declare global {
//   namespace Express {
//     interface Request {
//       files?: {
//         [fieldname: string]: UploadedFile | UploadedFile[];
//       };
//     }
//   }
// }
// src/types/express-fileupload.d.ts

declare module "express-fileupload" {
  import { RequestHandler } from "express";

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

  function fileUpload(options?: any): RequestHandler;
  export default fileUpload;
}

// Extend Express.Request globally
declare global {
  namespace Express {
    interface Request {
      files?: import("express-fileupload").FileArray;
    }
  }
}
