import { createCamera } from "./components/camera.js";
import { createScene } from "./components/scene.js";
import { createLight } from "./components/light.js";
import { createRenderer } from "./systems/renderer.js";
import { Resizer } from "./systems/Resizer.js";
import { Loop } from "./systems/Loop.js";
import { createControls } from "./systems/controls.js";
import { createTerrain } from "./components/terrain.js";
import { createTracks } from "./components/tracks.js";

let camera;
let renderer;
let scene;
let loop;

class World {
    constructor(container) {
        camera = createCamera();
        scene = createScene();
        renderer = createRenderer();

        loop = new Loop(camera, scene, renderer);
        container.append(renderer.domElement);

        const controls = createControls(camera, renderer.domElement, false);
        // loop.updatables.push(controls);
        controls.addEventListener("change", () => {
            this.render();
        });

        const light = createLight();
        scene.add(light);

        new Resizer(container, camera, renderer);
    }
    render() {
        renderer.render(scene, camera);
    }

    start() {
        loop.start();
    }

    stop() {
        loop.stop();
    }

    async init() {
        const terrain = await createTerrain(15, 15);
        scene.add(terrain);

        const tracks = await createTracks(terrain);
        tracks.forEach((track) => {
            scene.add(track);
        });
    }
}

export { World };
