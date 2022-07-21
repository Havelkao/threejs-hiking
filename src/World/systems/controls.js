import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

function createControls(camera, canvas, enableDamping = true) {
    const controls = new OrbitControls(camera, canvas);
    controls.maxDistance = 100;
    controls.tick = () => controls.update();

    if (enableDamping) {
        controls.enableDamping = true;
    }

    return controls;
}

export { createControls };
