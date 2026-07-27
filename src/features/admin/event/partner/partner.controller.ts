import { Request, Response } from "express";

import { registerPartner } from "./partner.service";
import imagekit from "../../../../utils/imagekit";

export const registerPartnerController = async (
  req: Request,
  res: Response
) => {
  try {
    const body = req.body;
    const files = req.files as any;

    // Logo
    if (files?.logo) {
      const logo = Array.isArray(files.logo) ? files.logo[0] : files.logo;

      const upload = await imagekit.upload({
        file: logo.data,
        fileName: `${Date.now()}-${logo.name}`,
        folder: "/partners/logo",
      });

      body.logo = upload.url;
    }

    // GST Certificate
    if (files?.gstCertificate) {
      const gst = Array.isArray(files.gstCertificate)
        ? files.gstCertificate[0]
        : files.gstCertificate;

      const upload = await imagekit.upload({
        file: gst.data,
        fileName: `${Date.now()}-${gst.name}`,
        folder: "/partners/gst",
      });

      body.gstCertificate = upload.url;
    }

    // Business Proof
    if (files?.businessProof) {
      const proof = Array.isArray(files.businessProof)
        ? files.businessProof[0]
        : files.businessProof;

      const upload = await imagekit.upload({
        file: proof.data,
        fileName: `${Date.now()}-${proof.name}`,
        folder: "/partners/business-proof",
      });

      body.businessProof = upload.url;
    }

    const partner = await registerPartner(body);

    return res.status(201).json({
      success: true,
      message: "Partner registered successfully.",
      data: partner,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};