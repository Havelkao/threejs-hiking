import * as THREE from "three";
import "../style.css";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { convertLLtoUTM, mapPixelsToMeshSize, parsePgw, getHeightData } from "./utils";
import { MeshLine, MeshLineMaterial } from "three.meshline";

let renderer, scene, camera, controls;
let terrain, tracks;
let container;
let image;

async function init() {
    scene = new THREE.Scene();
    scene.background = new THREE.Color("#202124");
    camera = new THREE.PerspectiveCamera(10, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(17, 17, 17);

    renderer = new THREE.WebGLRenderer();
    renderer.setSize(window.innerWidth, window.innerHeight);
    container = document.querySelector("#app");
    container.appendChild(renderer.domElement);

    var light = new THREE.AmbientLight("white");
    scene.add(light);

    controls = new OrbitControls(camera, renderer.domElement);

    terrain = await createTerrain();
    terrain.updateMatrixWorld();
    scene.add(terrain);

    tracks = await createTracks();
    tracks.forEach((track) => {
        scene.add(track);
    });
}

async function createTerrain() {
    const loader = new THREE.TextureLoader();
    const map = await loader.loadAsync("/assets/garda.png");
    image = await map.image;
    const texture = await loader.loadAsync("/assets/garda_texture.png");
    const height = getHeightData(image);
    const size = 15;

    const geometry = new THREE.PlaneGeometry(size, size, image.width - 1, image.height - 1);

    const arr = new Array(geometry.attributes.position.count);
    arr.fill(1);
    arr.forEach((_, index) => {
        geometry.attributes.position.setZ(index, height[index] / 400);
    });

    const material = new THREE.MeshStandardMaterial({
        side: THREE.DoubleSide,
        map: texture,
    });

    const terrain = new THREE.Mesh(geometry, material);
    terrain.rotation.x = -Math.PI / 2;
    terrain.geometry.computeBoundingBox();

    return terrain;
}

async function createTracks() {
    const pgwData = await fetch("assets/garda.pgw");
    const pgwText = await pgwData.text();
    const pgw = parsePgw(pgwText);
    const hikesData = await fetch("assets/italy.json");
    const hikes = await hikesData.json();
    const result = hikes.data.map((hike) => createTrack(hike[8]));

    function createTrack(coords) {
        const utm = coords.map((c) => {
            return { ...convertLLtoUTM(c.latitude, c.longitude), elevation: c.elevation };
        });
        const pointMap = utm.map((point) => {
            return { ...mapPixelsToMeshSize(terrain, image, point, pgw), elevation: point.elevation, ll: point };
        });

        const yOffset = 0.02;
        const points = [];
        pointMap.forEach((p) => {
            let v = getYCoordinate(terrain.geometry, new THREE.Vector3(p.x, 0, p.y));
            points.push(new THREE.Vector3(p.x, v.y + yOffset, p.y));
            // v.y = v.y + yOffset;
            // points.push(v);
        });

        const geometry = new THREE.BufferGeometry().setFromPoints(points);
        const material = new MeshLineMaterial({
            lineWidth: 0.04,
            color: "#204D98",
        });
        const line = new MeshLine();
        line.setGeometry(geometry);
        const mesh = new THREE.Mesh(line.geometry, material);

        return mesh;
    }

    return result;
}

function getIndexFrom2DCoordinates(geometry, point) {
    const bbox = geometry.boundingBox;
    const { widthSegments, heightSegments } = geometry.parameters;
    let normalizedX = (point.x - bbox.min.x) / (bbox.max.x - bbox.min.x);
    let normalizedY = (point.z - bbox.min.y) / (bbox.max.y - bbox.min.y);
    const column = parseInt(normalizedX * widthSegments);
    const row = parseInt(normalizedY * heightSegments);
    let index = (widthSegments + 1) * (row - 1) + column;

    return parseInt(index);
}

function getYCoordinate(geometry, point) {
    const index = getIndexFrom2DCoordinates(geometry, point);
    const vector = new THREE.Vector3();
    vector.fromBufferAttribute(geometry.attributes.position, index);
    const axis = new THREE.Vector3(1, 0, 0);
    const angle = -Math.PI / 2;
    vector.applyAxisAngle(axis, angle);

    return vector;
}

window.addEventListener(
    "resize",
    () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    },
    false
);

function animate() {
    requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
}

(async function main() {
    await init();
    animate();
})();
