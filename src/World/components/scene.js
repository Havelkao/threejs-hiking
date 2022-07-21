import { Scene, Color } from "three";

function createScene() {
    const scene = new Scene();
    scene.background = new Color("#202124");

    return scene;
}

export { createScene };
