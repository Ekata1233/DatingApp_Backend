export const formatLastSeen = (date?: Date | null) => {
  if (!date) return "Inactive";

  const now = new Date();
  const diff = (now.getTime() - date.getTime()) / 1000;

  if (diff < 10) return "Online now";
  if (diff < 60) return "Active just now";
  if (diff < 3600) return `Active ${Math.floor(diff / 60)} minutes ago`;
  if (diff < 86400) return `Active ${Math.floor(diff / 3600)} hours ago`;

  if (diff < 604800) {
    return date.toLocaleDateString("en-US", { weekday: "long" });
  }

  return date.toLocaleDateString();
};
