/**
 * Haversine formula to calculate distance between two GPS points in meters
 */
export declare function haversineDistance(lat1: number, lng1: number, lat2: number, lng2: number): number;
export declare function isWithinGeofence(rebalancerLat: number, rebalancerLng: number, agentLat: number, agentLng: number, radiusM?: number): {
    within: boolean;
    distanceM: number;
};
//# sourceMappingURL=haversine.d.ts.map