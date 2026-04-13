/**
 * Calculates the angle between three points (p1, p2, p3) where p2 is the vertex.
 * @param {object} p1 - First point {x, y}
 * @param {object} p2 - Second point (vertex) {x, y}
 * @param {object} p3 - Third point {x, y}
 * @returns {number} - Angle in degrees
 */
export const findAngle = (p1, p2, p3) => {
    if (!p1 || !p2 || !p3) return 0;
    
    const radians = Math.atan2(p3.y - p2.y, p3.x - p2.x) - Math.atan2(p1.y - p2.y, p1.x - p2.x);
    let angle = Math.abs(radians * 180.0 / Math.PI);
    
    if (angle > 180.0) {
        angle = 360 - angle;
    }
    
    return angle;
};

/**
 * Calculates distance between two points.
 * @param {object} p1 
 * @param {object} p2 
 * @returns {number}
 */
export const calculateDistance = (p1, p2) => {
    if (!p1 || !p2) return 0;
    return Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
};
