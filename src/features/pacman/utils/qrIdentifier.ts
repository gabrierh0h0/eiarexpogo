import { PACMAN_QR_CODE } from '../constants/config';

/**
 * Normaliza el contenido escaneado de un QR para comparación.
 * Misma lógica que el qrIdentifier de FoodDrop.
 */
function normalize(raw: string): string {
  return raw
    .trim()
    .replace(/^https?:\/\//i, '')
    .replace(/^www\./i, '')
    .replace(/\/+$/g, '')
    .toUpperCase();
}

/**
 * Determina si el contenido escaneado de un QR corresponde al
 * QR del minijuego Pacman.
 */
export function isPacmanQr(qrData: string | null | undefined): boolean {
  if (!qrData) return false;
  return normalize(qrData) === normalize(PACMAN_QR_CODE);
}
