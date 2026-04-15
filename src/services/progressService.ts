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

