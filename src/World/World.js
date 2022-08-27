import { createCamera } from "./components/camera.js";
import { createScene } from "./components/scene.js";
import { createLight } from "./components/light.js";
import { createRenderer } from "./systems/renderer.js";
import { Resizer } from "./systems/Resizer.js";
import { Loop } from "./systems/Loop.js";
import { createControls } from "./systems/controls.js";
import { createTerrain } from "./components/terrain.js";
import { createTracks } from "./components/tracks.js";
import { getAsync } from "./systems/assets.js";

let renderer;
let scene;
let loop;

class World {
    constructor(container) {
        this.container = container;
        this.camera = createCamera();
        scene = createScene();
        renderer = createRenderer();

        loop = new Loop(this.camera, scene, renderer);
        container.append(renderer.domElement);

        this.controls = createControls(this.camera, renderer.domElement, false);
        // loop.updatables.push(this.controls);
        this.controls.addEventListener("change", () => {
            this.render();
        });

        const light = createLight();
        scene.add(light);

        new Resizer(this.container, this.camera, renderer);
    }
    render() {
        renderer.render(scene, this.camera);
    }

    start() {
        loop.start();
    }

    stop() {
        loop.stop();
    }

    async init() {
        const assets = await getAsync("assets");
        this.model = await getAsync("model");

        const terrain = createTerrain(15, 15, assets);
        scene.add(terrain);

        const tracks = createTracks(terrain, assets, this.model);
        tracks.forEach((track) => {
            scene.add(track);
        });
    }
}

export { World };
