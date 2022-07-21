import { PlaneGeometry, MeshStandardMaterial, Mesh, DoubleSide } from "three";
import { makeNormalizer } from "../../utils";
import { getAssets } from "../systems/AssetLoader";

async function createTerrain(width, height) {
    const assets = await getAssets();
    const elevation = getElevationFromDEM(assets.DEMImage);

    const geometry = new PlaneGeometry(width, height, assets.DEMImage.width - 1, assets.DEMImage.height - 1);
    const zNormalizer = makeNormalizer([0, 255 * 3], 2);
    for (let i = 0; i < geometry.attributes.position.count; i++) {
        geometry.attributes.position.setZ(i, zNormalizer(elevation[i]));
    }

    const material = new MeshStandardMaterial({
        side: DoubleSide,
        map: assets.texture,
    });

    const terrain = new Mesh(geometry, material);
    terrain.rotation.x = -Math.PI / 2;
    terrain.geometry.computeBoundingBox();

    return terrain;
}

function getElevationFromDEM(image) {
    const canvas = document.createElement("canvas");
    canvas.width = image.width;
    canvas.height = image.height;
    const result = new Float32Array(image.width * image.height);

    const context = canvas.getContext("2d");
    context.drawImage(image, 0, 0);
    const imageData = context.getImageData(0, 0, image.width, image.height).data;

    const STEP = 4;
    let rgbSum;
    for (let i = 0; i < imageData.length; i += STEP) {
        rgbSum = imageData[i] + imageData[i + 1] + imageData[i + 2];
        result[i / STEP] = rgbSum;
    }

    return result;
}

export { createTerrain };
