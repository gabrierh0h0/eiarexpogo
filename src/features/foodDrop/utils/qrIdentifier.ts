import { FOOD_DROP_QR_CODE } from '../constants/config';

/**
 * Normaliza el contenido escaneado de un QR para comparación.
 *
 * Muchos generadores de QR online fuerzan que el contenido sea una URL
 * (anteponiendo `https://` o `http://`). Otros agregan `/` al final.
 * Esta función limpia esos artefactos y deja solo la "carga útil"
 * comparable contra `FOOD_DROP_QR_CODE`.
 */
function normalize(raw: string): string {
  return raw
    .trim()
    .replace(/^https?:\/\//i, '') // quitar protocolo http(s)://
    .replace(/^www\./i, '') // quitar www. si lo agregaron
    .replace(/\/+$/g, '') // quitar barras finales
    .toUpperCase();
}

/**
 * Determina si el contenido escaneado de un QR corresponde al QR de la
 * Tienda de la Confianza que lanza el minijuego.
 *
 * Acepta cualquiera de estas variantes:
 *   - "EIA-MISSION-FOOD-DROP-V1"
 *   - "https://EIA-MISSION-FOOD-DROP-V1"
 *   - "http://eia-mission-food-drop-v1/"
 *   - "https://www.EIA-MISSION-FOOD-DROP-V1"
 *
 * Esto es necesario porque los generadores online suelen forzar
 * el contenido a formato URL.
 */
export function isFoodDropQr(qrData: string | null | undefined): boolean {
  if (!qrData) return false;
  return normalize(qrData) === normalize(FOOD_DROP_QR_CODE);
}
