import proj4 from "proj4";

// http://rcn.montana.edu/resources/Converter.aspx

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

export function mapPixelsToMeshSize(mesh, image, point, pgw) {
    const bbox = mesh.geometry?.boundingBox || 0;
    const originPixelDelta = {
        x: Math.abs((pgw.xpos - point.easting) / pgw.xscale),
        y: Math.abs((pgw.ypos - point.northing) / pgw.yscale),
    };

    return {
        x: (originPixelDelta.x / image.width) * mesh.geometry.parameters.width + bbox.min.x,
        y: (originPixelDelta.y / image.height) * mesh.geometry.parameters.height + bbox.min.y,
    };
}

export function parsePgw(text) {
    const result = text.split("\r\n");
    return {
        xscale: result[0],
        yskew: result[1],
        xskew: result[2],
        yscale: result[3],
        xpos: result[4],
        ypos: result[5],
    };
}

export function getHeightData(img) {
    var canvas = document.createElement("canvas");
    canvas.width = img.width;
    canvas.height = img.height;
    var context = canvas.getContext("2d");

    var size = img.width * img.height;
    const data = new Float32Array(size);
    data.fill(0);

    context.drawImage(img, 0, 0);
    var imgd = context.getImageData(0, 0, img.width, img.height);
    var pix = imgd.data;

    var j = 0;
    for (var i = 0, n = pix.length; i < n; i += 4) {
        var all = pix[i] + pix[i + 1] + pix[i + 2];
        data[j++] = all;
    }

    return data;
}
