import { PerspectiveCamera } from "three";

function createCamera() {
    const camera = new PerspectiveCamera(35, window.innerWidth / window.innerHeight, 0.01, 1000);
    camera.position.set(10, 10, 10);

    return camera;
}

export { createCamera };
