export function makeNormalizer(range, scalar = 1) {
    const rangeMin = Math.min(...range);
    const rangeMax = Math.max(...range);

    function normalize(value) {
        return ((value - rangeMin) / (rangeMax - rangeMin)) * scalar;
    }

    return normalize;
}

export function smoothArray(arr, windowSize, getter = (value) => value, setter) {
    const get = getter;
    const result = [];

    for (let i = 0; i < arr.length; i += 1) {
        const leftOffset = i - windowSize;
        const from = leftOffset >= 0 ? leftOffset : 0;
        const to = i + windowSize + 1;

        let count = 0;
        let sum = 0;
        for (let j = from; j < to && j < arr.length; j += 1) {
            sum += get(arr[j]);
            count += 1;
        }

        result[i] = setter ? setter(arr[i], sum / count) : sum / count;
    }

    return result;
}

export function proxify(obj, callback) {
    return new Proxy(obj, {
        set: (obj, prop, value) => {
            obj[prop] = value;
            callback();
            return true;
        },
    });
}
