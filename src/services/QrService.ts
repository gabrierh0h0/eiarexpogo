export type ScanResult = {
  success: boolean;
  data?: string;
  error?: string;
};

export async function validateQRData(data: string): Promise<ScanResult> {
  
  if (!data) {
    return { success: false, error: "Código vacío o ilegible." };
  }

  //Si el código contiene "EIA", lo consideramos válido
  if (data.includes("EIA")) {
    return { success: true, data };
  }

  return { success: false, error: "Código no reconocido." };
}
