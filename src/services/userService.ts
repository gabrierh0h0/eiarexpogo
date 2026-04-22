import api from "../config/api";

export type DisplayNamePreference = "firstName" | "middleName";
export type LanguageOption = "es" | "en";

export type PermissionNode = {
  enabled: boolean;
  granted: boolean;
};

export type PermissionSettings = {
  notifications: PermissionNode;
  camera: PermissionNode;
  gallery: PermissionNode;
};

export type UserProfile = {
  uid: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  email: string;
  career: string;
  role: string;
  photoUrl?: string;
  displayNamePreference: DisplayNamePreference;
  language: LanguageOption;
  settings: {
    permissions: PermissionSettings;
  };
};

export async function getMe(): Promise<UserProfile> {
  const res = await api.get("/profile/me");
  return res.data;
}

export async function updateMyProfile(payload: {
  career?: string;
  displayNamePreference?: DisplayNamePreference;
  language?: LanguageOption;
}) {
  const res = await api.patch("/profile", payload);
  return res.data;
}

export async function updateProfilePhoto(photoUrl: string) {
  const res = await api.patch("/profile/photo", { photoUrl });
  return res.data;
}

export async function getPermissionSettings(): Promise<PermissionSettings> {
  const res = await api.get("/profile/permissions");
  return res.data;
}

export async function updatePermissionSettings(payload: {
  notificationsEnabled?: boolean;
  notificationsGranted?: boolean;
  cameraEnabled?: boolean;
  cameraGranted?: boolean;
  galleryEnabled?: boolean;
  galleryGranted?: boolean;
}) {
  const res = await api.patch("/profile/permissions", payload);
  return res.data;
}