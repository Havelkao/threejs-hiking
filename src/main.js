import * as THREE from "three";
import "../style.css";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { convertLLtoUTM } from "./utils";
import { Line2, LineGeometry, LineMaterial } from "three-fatline";

let renderer, scene, camera, controls, raycaster, pointer;
let mountain, sphere;
let container;
let image;
let isDragging = false;

async function init() {
    scene = new THREE.Scene();
    scene.background = new THREE.Color("#202124");
    camera = new THREE.PerspectiveCamera(10, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(17, 17, 17);

    renderer = new THREE.WebGLRenderer();
    renderer.setSize(window.innerWidth, window.innerHeight);
    container = document.querySelector("#app");
    container.appendChild(renderer.domElement);

    var light = new THREE.AmbientLight(0x404040);
    scene.add(light);

    controls = new OrbitControls(camera, renderer.domElement);

    mountain = await createMountain();
    mountain.updateMatrixWorld();
    scene.add(mountain);

    const track = await createTrack();
    scene.add(track);

    sphere = createSphere();
    scene.add(sphere);

    raycaster = new THREE.Raycaster();
    pointer = new THREE.Vector2();
    container.addEventListener("pointermove", onPointerMove, false);

    controls.target.copy(mountain.position);
    controls.target.y += 1;
}

const createMountain = async () => {
    const loader = new THREE.TextureLoader();
    const map = await loader.loadAsync("/assets/pichea.png");
    image = await map.image;
    const height = getHeightData(image);
    const size = 5;

    const geometry = new THREE.PlaneGeometry(size, size, image.width - 1, image.height - 1);

    const arr = new Array(geometry.attributes.position.count);
    arr.fill(1);
    arr.forEach((_, index) => {
        geometry.attributes.position.setZ(index, height[index] / 400);
    });

    const material = new THREE.MeshStandardMaterial({
        side: THREE.DoubleSide,
        map: map,
    });

    const mountain = new THREE.Mesh(geometry, material);
    mountain.rotation.x = -Math.PI / 2;
    mountain.position.set(size / 2, -2, size / 2);

    return mountain;
};

async function createTrack() {
    const coordsData = await fetch("assets/pichea.json");
    const coords = await coordsData.json();
    const pgwData = await fetch("assets/pichea.pgw");
    const pgwText = await pgwData.text();
    const pgw = parsePgw(pgwText);

    const utm = coords.map((c) => convertLLtoUTM(c.latitude, c.longitude));
    const pointMap = utm.map((point) => mapPixelsToMeshSize(mountain, image, point, pgw));

    const r = new THREE.Raycaster();
    const points = [];
    pointMap.forEach((p) => {
        r.set(new THREE.Vector3(p.x, -3, p.y), new THREE.Vector3(0, 1, 0));

        const intersects = r.intersectObject(mountain);
        if (intersects.length > 0) {
            points.push(new THREE.Vector3(p.x, intersects[0].point.y, p.y));
        }
    });
    // const ps = points.map((p) => [p.x, p.y, p.z]).flat();

    // const geometry = new LineGeometry();
    // geometry.setPositions(ps); // [ x1, y1, z1,  x2, y2, z2, ... ] format
    // const material = new LineMaterial({
    //     color: "#204D98",
    //     linewidth: 3, // px
    //     resolution: new THREE.Vector2(window.innerWidth, window.innerHeight), // resolution of the viewport
    // });

    // const line = new Line2(geometry, material);

    const material = new THREE.LineBasicMaterial({
        color: "#204D98",
        linewidth: 3,
    });

    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    const line = new THREE.Line(geometry, material);

    return line;
}

function mapPixelsToMeshSize(mesh, image, point, pgw) {
    const originPixelDelta = {
        x: Math.abs((pgw.xpos - point.easting) / pgw.xscale),
        y: Math.abs((pgw.ypos - point.northing) / pgw.yscale),
    };

    return {
        x: (originPixelDelta.x / image.width) * mesh.geometry.parameters.width,
        y: (originPixelDelta.y / image.height) * mesh.geometry.parameters.height,
    };
}

function parsePgw(text) {
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

function getHeightData(img) {
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

function createSphere() {
    const geometry = new THREE.SphereGeometry(0.006, 16, 8);
    const material = new THREE.MeshBasicMaterial({ color: 0xffff00, wireframe: true });
    const sphere = new THREE.Mesh(geometry, material);
    return sphere;
}

function onPointerMove(event) {
    pointer.x = (event.clientX / renderer.domElement.clientWidth) * 2 - 1;
    pointer.y = -(event.clientY / renderer.domElement.clientHeight) * 2 + 1;
    raycaster.setFromCamera(pointer, camera);
    const intersects = raycaster.intersectObject(mountain);

    if (intersects.length > 0 && !isDragging) {
        sphere.position.copy(intersects[0].point);
    }
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

window.addEventListener("pointerdown", () => {
    isDragging = true;
});

window.addEventListener("pointerup", () => {
    isDragging = false;
});

function animate() {
    requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
}

(async function main() {
    await init();
    animate();
})();
