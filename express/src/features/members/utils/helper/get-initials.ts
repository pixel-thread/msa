// ---------------------------------------------------------------------------
// Utility — Extract up to 2 uppercase initials from a full name
// Business intent: display a fallback avatar letter when no profile picture
//   is available for a member.
// ---------------------------------------------------------------------------
export const getInitials = (name: string) => {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
};
