import api from "../config/api";

export async function completeMission(missionId: string) {
    try {
        const res = await api.post("/progress/complete-mission", { missionId });
        return res.data;
    } catch (error) {
        console.error("Error completando misión:", error);
        throw error;
    }
}

export async function getMyProgress() {
    const res = await api.get("/progress/me");
    return res.data;
}
