export type DimensionKey =
    | "RELATIONSHIP_INTENT"
    | "VALUES"
    | "AGE_LIFE_STAGE"
    | "FAMILY_ROOTS"
    | "COMMUNICATION"
    | "LIFESTYLE"
    | "INTERESTS"
    | "EDUCATION_AMBITION"
    | "LOCATION";

export interface SignalResult {
    key: string;
    title: string;
    dimension: DimensionKey;
    score: number;
    userValue: string | null;
    targetValue: string | null;
    matched: boolean;
    source: "STATIC" | "DYNAMIC";
    sharedValues?: string[];
}

export const calculateAge = (
    birthDate?: Date | string | null
): number | null => {
    if (!birthDate) return null;

    const birth = new Date(birthDate);
    const today = new Date();

    let age = today.getFullYear() - birth.getFullYear();

    const monthDifference =
        today.getMonth() - birth.getMonth();

    if (
        monthDifference < 0 ||
        (monthDifference === 0 &&
            today.getDate() < birth.getDate())
    ) {
        age--;
    }

    return age;
};

export const calculateDistanceKm = (
    lat1?: any,
    lon1?: any,
    lat2?: any,
    lon2?: any
): number | null => {
    if (
        lat1 === null ||
        lat1 === undefined ||
        lon1 === null ||
        lon1 === undefined ||
        lat2 === null ||
        lat2 === undefined ||
        lon2 === null ||
        lon2 === undefined
    ) {
        return null;
    }

    const latitude1 = Number(lat1);
    const longitude1 = Number(lon1);
    const latitude2 = Number(lat2);
    const longitude2 = Number(lon2);

    if (
        !Number.isFinite(latitude1) ||
        !Number.isFinite(longitude1) ||
        !Number.isFinite(latitude2) ||
        !Number.isFinite(longitude2)
    ) {
        return null;
    }

    const earthRadius = 6371;

    const dLat =
        ((latitude2 - latitude1) * Math.PI) / 180;

    const dLon =
        ((longitude2 - longitude1) * Math.PI) / 180;

    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos((latitude1 * Math.PI) / 180) *
        Math.cos((latitude2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);

    const c =
        2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return Math.round(earthRadius * c * 10) / 10;
};

export const normalize = (value: any): string | null => {
    if (value === null || value === undefined) {
        return null;
    }

    const result = String(value).trim();

    return result.length ? result : null;
};

export const exactMatchScore = (
    valueA: any,
    valueB: any
): number | null => {
    const a = normalize(valueA);
    const b = normalize(valueB);

    if (!a || !b) {
        return null;
    }

    return a.toLowerCase() === b.toLowerCase()
        ? 100
        : 0;
};

export const ageCompatibilityScore = (
    ageA: number | null,
    ageB: number | null
): number | null => {
    if (ageA === null || ageB === null) {
        return null;
    }

    const difference = Math.abs(ageA - ageB);

    if (difference <= 2) return 100;
    if (difference <= 4) return 95;
    if (difference <= 6) return 85;
    if (difference <= 8) return 70;
    if (difference <= 10) return 55;

    return 40;
};

export const distanceCompatibilityScore = (
    distance: number | null
): number | null => {
    if (distance === null) {
        return null;
    }

    if (distance <= 5) return 100;
    if (distance <= 10) return 95;
    if (distance <= 25) return 85;
    if (distance <= 50) return 70;
    if (distance <= 100) return 55;
    if (distance <= 250) return 40;

    return 25;
};

export const screenToDimension = (
    screen: string
): DimensionKey | null => {
    switch (screen) {
        case "LIFESTYLE":
        case "HEALTH_WELLNESS":
            return "LIFESTYLE";

        case "REAL_U_MATTERS":
        case "DREAM_PLAN":
            return "VALUES";

        case "THINGS_U_LOVE":
            return "INTERESTS";
        case "INTEREST_HOBBY":
            return "INTERESTS";

        case "NETWORKING_INTENT":
            return "RELATIONSHIP_INTENT";

        default:
            return null;
    }
};

export const average = (
    scores: number[]
): number | null => {
    if (!scores.length) {
        return null;
    }

    return Math.round(
        scores.reduce((sum, score) => sum + score, 0) /
        scores.length
    );
};