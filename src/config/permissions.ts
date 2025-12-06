export const ALLOWED_USER_IDS = [
    'Ue62b450adbd58fca10963f1c243322dd', // Admin / Developer
];

export const isAccessAllowed = (userId?: string | null): boolean => {
    if (!userId) return false;
    return ALLOWED_USER_IDS.includes(userId);
};
