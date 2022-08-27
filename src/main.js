import "./styles/style.css";
import "@fortawesome/fontawesome-free/css/solid.css";
import "@fortawesome/fontawesome-free/css/fontawesome.css";
import "@fortawesome/fontawesome-free/css/brands.css";
import { UserInterface } from "./components/ui";
import { World } from "./World/World.js";

async function main() {
    const app = document.querySelector("#app");
    const world = new World(app);
    await world.init();
    world.start();

    const ui = new UserInterface(world);
    ui.render();
}

main();
