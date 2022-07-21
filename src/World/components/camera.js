import { PerspectiveCamera } from "three";

function createCamera() {
    const camera = new PerspectiveCamera(10, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(40, 30, 30);

    return camera;
}

export { createCamera };
