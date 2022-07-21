// http://rcn.montana.edu/resources/Converter.aspx

import proj4 from "proj4";

const ellipsoid = "WGS84";

export function convertUTMtoLL(easting, northing, utmZone, isSouthern = false) {
    const south = isSouthern ? "+south +no_defs" : "+no_defs";
    const from = `+proj=utm +zone=${utmZone} +units=m +ellps=${ellipsoid} ${south}`;
    const to = `+proj=longlat +ellps=${ellipsoid} +units=m +no_defs`;

    const proj = proj4(from, to);
    const point = proj4.toPoint([easting, northing]);
    const result = proj.forward(point);

    return { lon: result.x, lat: result.y };
}

export function convertLLtoUTM(lat, lon) {
    const from = `+proj=longlat +ellps=${ellipsoid} +units=m +no_defs`;
    const zone = getUTMzone(lat, lon);
    const isSouthern = lat < 0;
    const south = isSouthern ? "+south +no_defs" : "+no_defs";
    const to = `+proj=utm +zone=${zone} +ellps=${ellipsoid} ${south}`;

    const proj = proj4(from, to);
    const point = proj4.toPoint([lon, lat]);
    const result = proj.forward(point);

    return { easting: Math.round(result.x), northing: Math.round(result.y), zone: zone, isSouthern: isSouthern };
}

function getUTMzone(lat, lng) {
    // exceptions around Norway & Svalbard
    if (lat >= 56 && lat < 64 && lng >= 3 && lng < 12) return 32;

    if (lat >= 72 && lat < 84) {
        if (lng >= 0 && lng < 9) return 31;
        if (lng >= 9 && lng < 21) return 33;
        if (lng >= 21 && lng < 33) return 35;
        if (lng >= 33 && lng < 42) return 37;
    }

    return Math.floor((lng + 180) / 6) + 1;
}
