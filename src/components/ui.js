import { html, svg, render } from "uhtml";
import gsap from "gsap";
import * as d3 from "d3";
import { smoothArray, proxify } from "../utils";

export class UserInterface {
    constructor(world) {
        this.world = world;
        this.container = undefined;
        this.updatables = undefined;
        this.components = {
            selector: Selector(this),
            details: Details(),
            profile: HeightProfile(),
        };
        this.state = proxify({ selected: undefined }, this.update.bind(this));

        window.addEventListener("keydown", (e) => {
            if (e.key.startsWith("Arrow")) {
                this.components.selector.focus();
            }
        });
    }

    animateTo(x, y, z) {
        gsap.to(this.world.controls.target, {
            duration: 2,
            x,
            y,
            z,
            onUpdate: () => {
                this.world.controls.update();
            },
        });
    }

    update() {
        const hike = this.state.selected;
        const model = this.world.model;
        model.data.forEach((track) => {
            track.mesh.material.color.setHex(model.color.default);
        });

        render(this.updatables, html`${Details(hike)} ${HeightProfile(hike)}`);

        if (!hike) {
            this.updatables.style.display = "none";
            this.animateTo(0, 0, 0);
            return;
        }

        this.updatables.style.display = "grid";

        let [x, y, z] = hike.mesh.geometry.points;
        this.animateTo(x, y, z);

        hike.mesh.material.color.setHex(model.color.highlight);
    }

    render() {
        const { selector, details, profile } = this.components;

        this.world.container.appendChild(html.node`
            <div id="ui-wrapper">              
                ${selector}
                <div id="updatables" style="display: none">                    
                    ${details}
                    ${profile}
                </div>
            </div>`);

        this.container = document.querySelector("#ui-wrapper");
        this.updatables = document.querySelector("#updatables");
    }
}

function Selector(ui) {
    const model = ui.world.model.data;
    const handleChange = (e) => {
        const id = e.currentTarget.value;
        const selectedItem = model.find((item) => item.id == id);
        ui.state.selected = selectedItem;
    };

    return html.node`
        <select id="selector" onchange=${handleChange} autofocus>
            <option value="" selected hidden}>--select a hike--</option>
            ${model.map((hike) => html`<option value=${hike.id}>${hike.name}</option>`)}
        </select>`;
}

function HeightProfile(hike) {
    const height = 80;
    const width = 170;
    const margin = { top: 2 };

    function chart(hike) {
        const xMax = hike.coordinates.length;
        const xScale = d3.scaleLinear().domain([0, xMax]).range([0, width]);

        const yDomain = d3.extent(hike.coordinates, (d) => +d.elevation);
        const yScale = d3.scaleLinear().domain(yDomain).range([height, margin.top]);

        // get avg/stdev instead 50?
        const smooth = smoothArray(hike.coordinates, 50, (hike) => hike.elevation);

        const line = d3
            .line()
            .x((_, i) => xScale(i))
            .y((d) => yScale(d))(smooth);

        return svg`
            <svg width=${width.toString()} height=${height.toString()}>
                <path d=${line} stroke="white" fill="transparent" />
            </svg>
        `;
    }

    return html.node`
        <div id="profile">
            ${hike ? chart(hike) : ``}
        </div>`;
}

function Details(hike) {
    const model = [
        { value: "distance", label: "Distance", unit: "km", icon: "fa-solid fa-ruler-horizontal" },
        {
            value: "total_elevation_gain",
            label: "Elevation gain",
            unit: "m",
            icon: "fa-solid fa-mountain",
        },
        { value: "average_speed", label: "Average speed", unit: "km/h", icon: "fa-solid fa-gauge-simple-high" },
        { value: "pace", label: "Pace", unit: "min/km", icon: "fa-solid fa-person-running" },
        { value: "moving_time", label: "Moving time", unit: "h", icon: "fa-solid fa-stopwatch" },
        { value: "elapsed_time", label: "Elapsed time", unit: "h", icon: "fa-solid fa-clock" },
    ];

    const DetailItem = (field) => html`
        <tr id=${field.value} title=${field.label}>
            <td>
                <i class=${field.icon}></i>
            </td>
            <td>
                <span class="details-value">${hike[field.value].toFixed(2)}</span>
                ${field.unit}
            </td>
        </tr>
    `;

    return html` <table id="details">
        ${hike ? model.map((field) => DetailItem(field)) : html``}
    </table>`;
}
