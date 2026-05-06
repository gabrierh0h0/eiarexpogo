import api from "../config/api";

export type MyProgressResponse = {
    totalPoints: number;
    completedMissions: string[];
    unlockedLogros: string[];
    completedMissionsCount: number;
    unlockedLogrosCount: number;
    pendingMissionsCount: number;
    totalMissions: number;
    totalLogros: number;
    completedItems: number;
    totalItems: number;
    progressPercentage: number;
};

export async function completeMission(missionId: string) {
    try {
        const res = await api.post("/progress/complete-mission", { missionId });
        return res.data;
    } catch (error) {
        console.error("Error completando misión:", error);
        throw error;
    }
}

export async function getMyProgress(): Promise<MyProgressResponse> {
    const res = await api.get("/progress/me");
    return res.data;
}

/**
 * Devuelve true si el usuario ya completó la misión indicada.
 * Usa el endpoint existente `/progress/me` y revisa la lista
 * `completedMissions`. Si falla la red, devuelve false (mejor permitir
 * jugar y que el backend rechace en caliente que bloquear por error de red).
 */
export async function isMissionCompleted(missionId: string): Promise<boolean> {
    try {
        const progress = await getMyProgress();
        return Array.isArray(progress.completedMissions)
            && progress.completedMissions.includes(missionId);
    } catch (e) {
        console.warn("No se pudo consultar progreso, asumiendo no completada:", e);
        return false;
    }
}

