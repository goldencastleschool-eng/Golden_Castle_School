export const ACADEMIC_TERMS = [
  "First Term",
  "Second Term",
  "Third Term",
];

export const FIRST_IMPLEMENTED_SESSION = "2025/2026";

export const getVisibleTermsForSession = (session = "") =>
  session === FIRST_IMPLEMENTED_SESSION
    ? ACADEMIC_TERMS.filter((term) => term !== "First Term")
    : ACADEMIC_TERMS;

export const normalizeTermForSession = (term = "", session = "") =>
  getVisibleTermsForSession(session).includes(term) ? term : "";
