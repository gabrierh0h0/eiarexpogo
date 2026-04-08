import api from "../config/api";

export type ScanResult = {
  success: boolean;
  data?: string;
  error?: string;
};

export async function validateQRData(data: string): Promise<ScanResult> {
  try {
    const res = await api.post("/qr/validate", { data });
    return res.data;
  } catch (error) {
    return { success: false, error: "Error de conexión o validación." };
  }
}
