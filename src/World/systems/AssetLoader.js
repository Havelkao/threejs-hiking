import { TextureLoader } from "three";

class AssetLoader {
    constructor() {
        if (AssetLoader._instance) {
            return AssetLoader._instance;
        }
        AssetLoader._instance = this;

        this.imagesLoaded = false;
        this.terrainDataLoaded = false;
    }

    async init() {
        if (this.imagesLoaded && this.terrainDataLoaded) return;

        await this.loadImages();
        await this.loadTerrainData();
    }

    async loadImages() {
        const loader = new TextureLoader();
        this.texture = await loader.loadAsync("/assets/garda_texture.png");
        const DEM = await loader.loadAsync("/assets/garda.png");
        this.DEMImage = await DEM.image;

        this.imagesLoaded = true;
    }

    async loadTerrainData() {
        const pgwData = await fetch("assets/garda.pgw");
        const pgwText = await pgwData.text();
        this.pgw = parsePgw(pgwText);
        const hikesData = await fetch("assets/italy.json");
        this.hikes = await hikesData.json();

        this.terrainDataLoaded = true;
    }
}

function parsePgw(text) {
    const result = text.split("\r\n");
    return {
        xscale: result[0],
        yskew: result[1],
        xskew: result[2],
        yscale: result[3],
        xpos: result[4],
        ypos: result[5],
    };
}

async function getAssets() {
    const assets = new AssetLoader();
    await assets.init();
    return assets;
}

export { getAssets };
