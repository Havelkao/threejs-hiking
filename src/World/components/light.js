import { AmbientLight } from "three";

function createLight() {
    const ambientLight = new AmbientLight("white");

    return ambientLight;
}

export { createLight };
