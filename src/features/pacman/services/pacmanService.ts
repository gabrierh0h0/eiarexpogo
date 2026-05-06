import api from '../../../config/api';

/**
 * Service del minijuego Pacman. Misma estructura que foodDropService.
 * Encapsula las llamadas al endpoint
 * `POST /progress/complete-mission-with-score` con reintentos exponenciales.
 */

export interface CompletePacmanResult {
  success?: boolean;
  scoreEarned?: number;
  newTotalPoints?: number;
  newAchievements?: string[];
  alreadyCompleted: boolean;
  totalPoints?: number;
  message?: string;
}

const RETRY_DELAYS_MS = [500, 1500, 4000];

function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Llama al endpoint de completar misión con score variable.
 * Reintenta hasta 3 veces con backoff exponencial corto si la red falla.
 */
export async function completePacmanMission(
  missionId: string,
  score: number,
): Promise<CompletePacmanResult> {
  let lastError: any = null;

  for (let attempt = 0; attempt <= RETRY_DELAYS_MS.length; attempt++) {
    try {
      const res = await api.post('/progress/complete-mission-with-score', {
        missionId,
        score,
      });
      return res.data as CompletePacmanResult;
    } catch (error: any) {
      lastError = error;
      const status: number | undefined = error?.response?.status;

      // No reintentar si el backend respondió con 4xx
      const isClientError =
        typeof status === 'number' && status >= 400 && status < 500;
      const noMoreRetries = attempt === RETRY_DELAYS_MS.length;

      if (isClientError || noMoreRetries) {
        break;
      }
      await delay(RETRY_DELAYS_MS[attempt]);
    }
  }

  throw lastError;
}
