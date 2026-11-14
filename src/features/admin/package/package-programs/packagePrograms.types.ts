import { PackageType } from "@prisma/client";

export interface PackageProgramDestinationInput {
  id?: string;
  city: string;
  imageIndex?: number;
  sortOrder?: number;
  isActive?: boolean;
}

export interface CreatePackageProgramInput {
  packageType: PackageType;
  title: string;
  tagline?: string | null;
  description?: string | null;
  tags?: string[];
  condition?: string | null;
  destinations?: PackageProgramDestinationInput[];
  isActive?: boolean;
  sortOrder?: number;
}

export interface UpdatePackageProgramInput {
  packageType?: PackageType;
  title?: string;
  tagline?: string | null;
  description?: string | null;
  tags?: string[];
  condition?: string | null;
  destinations?: PackageProgramDestinationInput[];
  isActive?: boolean;
  sortOrder?: number;
}

export interface PackageProgramFilters {
  packageType?: PackageType;
  isActive?: boolean;
}

export interface UploadedPackageProgramImage {
  imageUrl: string;
  imageFileId: string;
}

export interface PackageProgramParams {
  id: string;
}