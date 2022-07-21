export function makeNormalizer(range, scalar = 1) {
    const rangeMin = Math.min(...range);
    const rangeMax = Math.max(...range);

    function normalize(value) {
        return ((value - rangeMin) / (rangeMax - rangeMin)) * scalar;
    }

    return normalize;
}
