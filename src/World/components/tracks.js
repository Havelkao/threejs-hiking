import { MeshLine, MeshLineMaterial } from "three.meshline";
import { BufferGeometry, Mesh, Vector3, Vector2 } from "three";
import { convertLLtoUTM } from "../../utils/gis.js";
import { makeNormalizer } from "../../utils";

function createTracks(terrain, assets, model) {
    const result = model.data.map((hike) => {
        let mesh = createTrack(hike.coordinates);
        hike.mesh = mesh;
        return mesh;
    });

    function createTrack(coords) {
        const utm = coords.map((c) => {
            return { ...convertLLtoUTM(c.latitude, c.longitude), elevation: c.elevation };
        });
        const pointMap = utm.map((point) => {
            return {
                ...mapPixelsToMeshSize(terrain, assets.DEMImage, point, assets.pgw),
                elevation: point.elevation,
                ll: point,
            };
        });

        const Y_OFFSET = 0.02;
        const points = [];
        pointMap.forEach((p) => {
            let v = getYCoordinate(terrain.geometry, new Vector3(p.x, 0, p.y));
            points.push(new Vector3((p.x + v.x) / 2, v.y + Y_OFFSET, (p.y + v.z) / 2));
            // v.y = v.y + Y_OFFSET;
            // points.push(v);
        });

        const geometry = new BufferGeometry().setFromPoints(points);
        const material = new MeshLineMaterial({
            lineWidth: 0.01,
            color: "#204D98",
            resolution: new Vector2(window.innerWidth, window.innerHeight),
        });
        const line = new MeshLine();
        line.setGeometry(geometry);
        const mesh = new Mesh(line.geometry, material);

        return mesh;
    }

    return result;
}

function getIndexFrom2DCoordinates(geometry, point) {
    const bbox = geometry.boundingBox;
    const { widthSegments, heightSegments } = geometry.parameters;
    const yNormalizer = makeNormalizer([bbox.min.y, bbox.max.y]);
    const xNormalizer = makeNormalizer([bbox.min.x, bbox.max.x]);
    let xNormalized = xNormalizer(point.x);
    let yNormalized = yNormalizer(point.z);
    const column = parseInt(xNormalized * widthSegments);
    const row = parseInt(yNormalized * heightSegments);
    let index = (widthSegments + 1) * row + column;

    return parseInt(index);
}

function getYCoordinate(geometry, point) {
    const index = getIndexFrom2DCoordinates(geometry, point);
    const vector = new Vector3();
    vector.fromBufferAttribute(geometry.attributes.position, index);
    const axis = new Vector3(1, 0, 0);
    const angle = -Math.PI / 2;
    vector.applyAxisAngle(axis, angle);

    return vector;
}

function mapPixelsToMeshSize(mesh, image, point, pgw) {
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

export { createTracks };
