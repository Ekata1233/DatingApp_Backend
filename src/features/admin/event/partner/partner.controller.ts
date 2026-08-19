import { Request, Response } from "express";
import { BusinessType } from "@prisma/client";

import { getAllPartnersService, registerPartnerService } from "./partner.service";
import imagekit from "../../../../utils/imagekit";

export const registerPartnerController = async (
  req: Request,
  res: Response
) => {
  try {
    console.log("========================================");
    console.log("PARTNER REGISTRATION");
    console.log("========================================");

    // =====================================================
    // 1. GET TEXT DATA FROM FORM-DATA
    // =====================================================

    const {
      businessName,
      legalEntity,
      businessType,
      contactPerson,
      email,
      phone,
      gstNumber,
      panNumber,
      experienceYears,
      description,
      monthlyEventsMin,
      monthlyEventsMax,
      teamSize,
      address,
      areaName,
      city,
      state,
      country,
      pincode,
      website,
    } = req.body;

    console.log("📦 Request body:");
    console.log(req.body);

    // =====================================================
    // 2. BASIC VALIDATION
    // =====================================================

    const errors: Array<{
      field: string;
      message: string;
      received?: any;
    }> = [];

    if (!businessName || businessName.trim() === "") {
      errors.push({
        field: "businessName",
        message: "Business name is required",
        received: businessName,
      });
    }

    if (!legalEntity || legalEntity.trim() === "") {
      errors.push({
        field: "legalEntity",
        message: "Legal entity is required",
        received: legalEntity,
      });
    }

    if (!businessType) {
      errors.push({
        field: "businessType",
        message: "Business type is required",
        received: businessType,
      });
    } else {
      const validBusinessTypes = Object.values(BusinessType);

      if (!validBusinessTypes.includes(businessType as BusinessType)) {
        errors.push({
          field: "businessType",
          message: `Invalid business type. Must be one of: ${validBusinessTypes.join(
            ", "
          )}`,
          received: businessType,
        });
      }
    }

    if (!contactPerson || contactPerson.trim() === "") {
      errors.push({
        field: "contactPerson",
        message: "Contact person is required",
        received: contactPerson,
      });
    }

    if (!email || email.trim() === "") {
      errors.push({
        field: "email",
        message: "Email is required",
        received: email,
      });
    }

    if (!phone || phone.trim() === "") {
      errors.push({
        field: "phone",
        message: "Phone is required",
        received: phone,
      });
    }

    // =====================================================
    // 3. EMAIL VALIDATION
    // =====================================================

    if (email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

      if (!emailRegex.test(email)) {
        errors.push({
          field: "email",
          message: "Invalid email address",
          received: email,
        });
      }
    }

    // =====================================================
    // 4. PHONE VALIDATION
    // =====================================================

    if (phone) {
      const cleanPhone = String(phone).replace(/\s+/g, "");

      if (!/^[0-9+]{10,15}$/.test(cleanPhone)) {
        errors.push({
          field: "phone",
          message: "Phone number must contain 10 to 15 digits",
          received: phone,
        });
      }
    }

    // =====================================================
    // 5. NUMBER VALIDATION
    // =====================================================

    const numericFields = [
      {
        field: "experienceYears",
        value: experienceYears,
      },
      {
        field: "monthlyEventsMin",
        value: monthlyEventsMin,
      },
      {
        field: "monthlyEventsMax",
        value: monthlyEventsMax,
      },
      {
        field: "teamSize",
        value: teamSize,
      },
    ];

    for (const item of numericFields) {
      if (
        item.value !== undefined &&
        item.value !== null &&
        item.value !== ""
      ) {
        const numberValue = Number(item.value);

        if (Number.isNaN(numberValue) || numberValue < 0) {
          errors.push({
            field: item.field,
            message: `${item.field} must be a valid non-negative number`,
            received: item.value,
          });
        }
      }
    }

    // =====================================================
    // 6. MONTHLY EVENT RANGE VALIDATION
    // =====================================================

    if (
      monthlyEventsMin !== undefined &&
      monthlyEventsMin !== "" &&
      monthlyEventsMax !== undefined &&
      monthlyEventsMax !== ""
    ) {
      if (
        Number(monthlyEventsMin) > Number(monthlyEventsMax)
      ) {
        errors.push({
          field: "monthlyEventsMin",
          message:
            "monthlyEventsMin cannot be greater than monthlyEventsMax",
          received: monthlyEventsMin,
        });
      }
    }

    // =====================================================
    // 7. PINCODE VALIDATION
    // =====================================================

    if (pincode) {
      if (!/^[0-9]{4,10}$/.test(String(pincode))) {
        errors.push({
          field: "pincode",
          message: "Invalid pincode",
          received: pincode,
        });
      }
    }

    // =====================================================
    // RETURN VALIDATION ERRORS
    // =====================================================

    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors,
      });
    }

    // =====================================================
    // 8. GET FILES
    // =====================================================

   const files = req.files as any;

console.log("====================================");
console.log("📁 PARTNER FILE DEBUG");
console.log("req.files:", files);
console.log(
  "req.files keys:",
  files ? Object.keys(files) : "NO FILES"
);
console.log("====================================");

    // =====================================================
    // 9. FILE VALIDATION
    // =====================================================

    const fileErrors: Array<{
      field: string;
      message: string;
      fileName: string;
    }> = [];

    const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
    const MAX_DOCUMENT_SIZE = 10 * 1024 * 1024;

    const allowedLogoTypes = [
      "image/jpeg",
      "image/png",
      "image/webp",
      "image/jpg",
    ];

    const allowedDocumentTypes = [
      "application/pdf",
      "image/jpeg",
      "image/png",
      "image/jpg",
      "image/webp",
    ];

    // =====================================================
    // LOGO VALIDATION
    // =====================================================

   const logoFile = files?.logo;

    if (logoFile) {
      if (logoFile.size > MAX_IMAGE_SIZE) {
        fileErrors.push({
          field: "logo",
          message: "Logo must not exceed 5MB",
          fileName: logoFile.name,
        });
      }

      if (!allowedLogoTypes.includes(logoFile.mimetype)) {
        fileErrors.push({
          field: "logo",
          message:
            "Logo must be JPG, JPEG, PNG or WEBP",
          fileName: logoFile.name,
        });
      }

      if (!logoFile.data) {
        fileErrors.push({
          field: "logo",
          message: "Logo file is empty or invalid",
          fileName: logoFile.name,
        });
      }
    }

    // =====================================================
    // GST CERTIFICATE VALIDATION
    // =====================================================

   const gstFile = files?.gstCertificate;

    if (gstFile) {
      if (gstFile.size > MAX_DOCUMENT_SIZE) {
        fileErrors.push({
          field: "gstCertificate",
          message: "GST certificate must not exceed 10MB",
          fileName: gstFile.name,
        });
      }

      if (!allowedDocumentTypes.includes(gstFile.mimetype)) {
        fileErrors.push({
          field: "gstCertificate",
          message:
            "GST certificate must be PDF, JPG, JPEG, PNG or WEBP",
          fileName: gstFile.name,
        });
      }

      if (!gstFile.data) {
        fileErrors.push({
          field: "gstCertificate",
          message:
            "GST certificate file is empty or invalid",
          fileName: gstFile.name,
        });
      }
    }

    // =====================================================
    // BUSINESS PROOF VALIDATION
    // =====================================================
const businessProofFile = files?.businessProof;

    if (businessProofFile) {
      if (businessProofFile.size > MAX_DOCUMENT_SIZE) {
        fileErrors.push({
          field: "businessProof",
          message:
            "Business proof must not exceed 10MB",
          fileName: businessProofFile.name,
        });
      }

      if (!allowedDocumentTypes.includes(businessProofFile.mimetype)) {
        fileErrors.push({
          field: "businessProof",
          message:
            "Business proof must be PDF, JPG, JPEG, PNG or WEBP",
          fileName: businessProofFile.name,
        });
      }

      if (!businessProofFile.data) {
        fileErrors.push({
          field: "businessProof",
          message:
            "Business proof file is empty or invalid",
          fileName: businessProofFile.name,
        });
      }
    }

    if (fileErrors.length > 0) {
      return res.status(400).json({
        success: false,
        message: "File validation failed",
        errors: fileErrors,
      });
    }

    // =====================================================
    // 10. IMAGEKIT UPLOAD
    // =====================================================

   let logoUrl: string | null = null;
let gstCertificateUrl: string | null = null;
let businessProofUrl: string | null = null;

try {
  // ============================================
  // LOGO UPLOAD
  // ============================================

  if (logoFile) {
    console.log(`⬆️ Uploading logo: ${logoFile.name}`);

    const uploadResponse = await imagekit.upload({
      file: logoFile.data,
      fileName: `${Date.now()}-logo-${logoFile.name}`,
      folder: "/event-partners/logo",
    });

    logoUrl = uploadResponse.url;

    console.log("✅ Logo uploaded:");
    console.log(logoUrl);
  }

  // ============================================
  // GST CERTIFICATE UPLOAD
  // ============================================

  if (gstFile) {
    console.log(
      `⬆️ Uploading GST certificate: ${gstFile.name}`
    );

    const uploadResponse = await imagekit.upload({
      file: gstFile.data,
      fileName: `${Date.now()}-gst-${gstFile.name}`,
      folder: "/event-partners/gst",
    });

    gstCertificateUrl = uploadResponse.url;

    console.log("✅ GST certificate uploaded:");
    console.log(gstCertificateUrl);
  }

  // ============================================
  // BUSINESS PROOF UPLOAD
  // ============================================

  if (businessProofFile) {
    console.log(
      `⬆️ Uploading business proof: ${businessProofFile.name}`
    );

    const uploadResponse = await imagekit.upload({
      file: businessProofFile.data,
      fileName: `${Date.now()}-business-proof-${businessProofFile.name}`,
      folder: "/event-partners/business-proof",
    });

    businessProofUrl = uploadResponse.url;

    console.log("✅ Business proof uploaded:");
    console.log(businessProofUrl);
  }

} catch (error: any) {
  console.error("❌ ImageKit upload failed:");
  console.error(error);

  return res.status(500).json({
    success: false,
    message: "Image upload failed",
    error:
      error?.message ||
      "Failed to upload files to ImageKit",
  });
}
console.log("====================================");
console.log("🖼️ IMAGEKIT FINAL URLS");
console.log("====================================");
console.log("Logo URL:", logoUrl);
console.log("GST URL:", gstCertificateUrl);
console.log("Business Proof URL:", businessProofUrl);
console.log("====================================");
    // =====================================================
    // 11. PREPARE DATA FOR SERVICE
    // =====================================================

  const partnerData = {
  businessName: businessName.trim(),
  legalEntity: legalEntity.trim(),
  businessType: businessType as BusinessType,

  contactPerson: contactPerson.trim(),
  email: email.trim().toLowerCase(),
  phone: phone.trim(),

  gstNumber: gstNumber?.trim() || null,
  panNumber: panNumber?.trim() || null,

  experienceYears:
    experienceYears !== undefined &&
    experienceYears !== ""
      ? Number(experienceYears)
      : null,

  description: description?.trim() || null,

  monthlyEventsMin:
    monthlyEventsMin !== undefined &&
    monthlyEventsMin !== ""
      ? Number(monthlyEventsMin)
      : null,

  monthlyEventsMax:
    monthlyEventsMax !== undefined &&
    monthlyEventsMax !== ""
      ? Number(monthlyEventsMax)
      : null,

  teamSize:
    teamSize !== undefined &&
    teamSize !== ""
      ? Number(teamSize)
      : null,

  venueNames: parseStringArray(
    req.body.venueNames
  ),

  address: address?.trim() || null,
  areaName: areaName?.trim() || null,
  city: city?.trim() || null,
  state: state?.trim() || null,
  country: country?.trim() || null,
  pincode: pincode?.trim() || null,

  coverageAreas: parseStringArray(
    req.body.coverageAreas
  ),

  references: parseStringArray(
    req.body.references
  ),

  website: website?.trim() || null,

  // ⭐ IMPORTANT
  logo: logoUrl,
  gstCertificate: gstCertificateUrl,
  businessProof: businessProofUrl,
};

    // =====================================================
    // 12. CREATE PARTNER
    // =====================================================

    const partner =
      await registerPartnerService(partnerData);

    // =====================================================
    // 13. RESPONSE
    // =====================================================

    return res.status(201).json({
      success: true,
      message:
        "Event partner registered successfully",
      data: partner,
    });
  } catch (error: any) {
    console.error(
      "❌ Partner registration error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Something went wrong",
    });
  }
};

// =====================================================
// HELPER: STRING ARRAY PARSER
// =====================================================

const parseStringArray = (
  value: any
): string[] => {
  if (!value) {
    return [];
  }

  // If already array
  if (Array.isArray(value)) {
    return value
      .map((item) => String(item).trim())
      .filter(Boolean);
  }

  // JSON array string
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);

      if (Array.isArray(parsed)) {
        return parsed
          .map((item) => String(item).trim())
          .filter(Boolean);
      }
    } catch {
      // Continue below
    }

    // Comma separated
    return value
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return [];
};

export const getAllPartnersController = async (
  req: Request,
  res: Response
) => {
  try {
    const partners = await getAllPartnersService();

    return res.status(200).json({
      success: true,
      message: "Event partners fetched successfully",
      data: partners,
    });
  } catch (error: any) {
    console.error("❌ Get partners error:", error);

    return res.status(500).json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Something went wrong",
    });
  }
};