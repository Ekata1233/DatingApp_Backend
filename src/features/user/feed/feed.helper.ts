export const maskName = (
  name?: string | null,
): string => {
  if (!name?.trim()) {
    return "•••••";
  }

  const first =
    name.trim().charAt(0).toUpperCase();

  return `${first}••••`;
};

export const maskAge = (
  age?: number | null,
): string | null => {
  if (!age) {
    return null;
  }

  const ageString =
    String(age);

  return `${ageString.charAt(0)}•`;
};

