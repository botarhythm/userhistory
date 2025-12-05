import { getDistance } from 'geolib';
import { Store } from '../types/points.js';

export const validateLocation = (
    userLat: number,
    userLng: number,
    store: Store
): { isValid: boolean; distance: number } => {
    if (!store.latitude || !store.longitude) {
        return { isValid: false, distance: -1 };
    }

    const distance = getDistance(
        { latitude: userLat, longitude: userLng },
        { latitude: store.latitude, longitude: store.longitude }
    );

    // Default radius to 50m if not set
    const allowedRadius = store.radius || 50;

    return {
        isValid: distance <= allowedRadius,
        distance
    };
};
