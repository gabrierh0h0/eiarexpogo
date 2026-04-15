import api from "../config/api";
import { saveSession } from "./authStorage";

export const authService = {
  async login(email: string, password: string) {
    const res = await api.post("/auth/login", { email, password });
    const { token, user } = res.data;
    await saveSession(token, user);
    return res.data;
  },

  async register(payload: {
    firstName: string;
    middleName?: string;
    lastName: string;
    email: string;
    password: string;
    confirmPassword: string;
    career: string;
  }) {
    const res = await api.post("/auth/register", payload);

    // Si tu backend devuelve token/user (ideal), lo guardas igual que login
    if (res.data?.token && res.data?.user) {
      await saveSession(res.data.token, res.data.user);
    }

    return res.data;
  },
};