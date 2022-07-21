import "./styles/style.css";
import { World } from "./World/World.js";

async function main() {
    const container = document.querySelector("#app");
    const world = new World(container);
    await world.init();
    world.render();
}

main();
