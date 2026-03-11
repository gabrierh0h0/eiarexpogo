import api from "../config/api";

export type RegisterForm = {
  firstName: string;
  middleName?: string;
  lastName: string;
  email: string;
  password: string;
  confirm: string;
  program: string;
};

export async function registerUser(form: RegisterForm) {
  // Validaciones UI
  if (!form.firstName.trim()) throw new Error("Ingresa tu primer nombre.");
  if (!form.lastName.trim()) throw new Error("Ingresa tus apellidos.");

  const email = form.email.trim().toLowerCase();
  if (!email.endsWith("@eia.edu.co"))
    throw new Error("Usa tu correo institucional @eia.edu.co.");

  if (form.password.length < 6)
    throw new Error("La contraseña debe tener al menos 6 caracteres.");

  if (form.password !== form.confirm)
    throw new Error("Las contraseñas no coinciden.");

  if (!form.program.trim())
    throw new Error("Selecciona tu carrera.");

  // Request al backend usando api (baseURL centralizada)
  const response = await api.post("/auth/register", {
    firstName: form.firstName.trim(),
    middleName: form.middleName?.trim() || undefined,
    lastName: form.lastName.trim(),
    email,
    password: form.password,
    confirmPassword: form.confirm,
    career: form.program.trim(),
  });

  return response.data;
}