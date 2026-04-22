export type DisplayNamePreference = "firstName" | "middleName";

export function capitalizeWord(value?: string | null) {
  const safe = String(value ?? "").trim();
  if (!safe) return "";
  return safe.charAt(0).toUpperCase() + safe.slice(1).toLowerCase();
}

export function getRoleLabel(role?: string | null) {
  const normalized = String(role ?? "").trim().toLowerCase();

  if (["student", "estudiante"].includes(normalized)) return "Estudiante";
  if (["teacher", "docente", "profesor"].includes(normalized)) return "Docente";
  if (["admin", "administrator", "administrador"].includes(normalized)) return "Administrador";

  return normalized ? capitalizeWord(normalized) : "Usuario";
}

export function getPreferredName(profile?: any) {
  const wantsMiddleName = profile?.displayNamePreference === "middleName";
  const middleName = String(profile?.middleName ?? "").trim();
  const firstName = String(profile?.firstName ?? "").trim();

  const selectedName = wantsMiddleName && middleName ? middleName : firstName;

  return selectedName.split(/\s+/).filter(Boolean)[0] ?? "";
}

export function getFirstLastName(profile?: any) {
  const lastName = String(profile?.lastName ?? "").trim();
  return lastName.split(/\s+/).filter(Boolean)[0] ?? "";
}

export function getDisplayFullName(profile?: any, fallbackEmail?: string | null) {
  const preferredName = capitalizeWord(getPreferredName(profile));
  const firstLastName = capitalizeWord(getFirstLastName(profile));

  const fullName = [preferredName, firstLastName].filter(Boolean).join(" ");
  if (fullName) return fullName;

  const fallback = String(fallbackEmail ?? "").split("@")[0];
  return capitalizeWord(fallback || "Usuario");
}