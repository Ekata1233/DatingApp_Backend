const normalizeName = (
  name: string
) => {
  return name
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
};

const parseAadhaarDob = (
  value: string
) => {
  const parts =
    value.split(/[\/-]/);

  if (parts.length !== 3) {
    return null;
  }

  const [
    day,
    month,
    year,
  ] = parts.map(Number);

  const date =
    new Date(
      year,
      month - 1,
      day
    );

  return isNaN(
    date.getTime()
  )
    ? null
    : date;
};

const isSameDate = (
  first: Date,
  second: Date
) => {
  return (
    first.getFullYear() ===
      second.getFullYear() &&
    first.getMonth() ===
      second.getMonth() &&
    first.getDate() ===
      second.getDate()
  );
};

const calculateAge = (
  dob: Date
) => {
  const today = new Date();

  let age =
    today.getFullYear() -
    dob.getFullYear();

  const month =
    today.getMonth() -
    dob.getMonth();

  if (
    month < 0 ||
    (month === 0 &&
      today.getDate() <
        dob.getDate())
  ) {
    age--;
  }

  return age;
};