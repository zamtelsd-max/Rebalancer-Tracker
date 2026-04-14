"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.haversineDistance = haversineDistance;
exports.isWithinGeofence = isWithinGeofence;
/**
 * Haversine formula to calculate distance between two GPS points in meters
 */
function haversineDistance(lat1, lng1, lat2, lng2) {
    const R = 6371000; // Earth radius in meters
    const toRad = (deg) => (deg * Math.PI) / 180;
    const dLat = toRad(lat2 - lat1);
    const dLng = toRad(lng2 - lng1);
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
            Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}
function isWithinGeofence(rebalancerLat, rebalancerLng, agentLat, agentLng, radiusM = 100) {
    const distanceM = haversineDistance(rebalancerLat, rebalancerLng, agentLat, agentLng);
    return { within: distanceM <= radiusM, distanceM };
}
//# sourceMappingURL=haversine.js.map