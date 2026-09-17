/** @import {Grid} from "./grid.js" */
import { flatten } from "./grid.js";
import { Rectangle, Vec2d } from "./geometry.js";
/** @import {ViewElement, ViewControl, Mouse} from "./view.js" */
import { View, ViewOutput, ViewIntControl, ViewSelectControl } from "./view.js";
import { countGridCellNeighborhoods } from "./solution.js";

/**
 * @typedef {{affinity: number, effected: boolean}} AffinityCell
 */

/**
 * @param {AffinityCell} cell
 * @returns
 */
function getAffinityCellColor(cell) {
  const min = -50;
  const max = 50;
  const percentGreen = ((cell.affinity - min) / (max - min)) * 100;
  const redGreenMix = `color-mix(in lch, #ff0000 ${100 - percentGreen}%, #00ff00 ${percentGreen}%)`;
  if (cell.effected) {
    return `color-mix(in lch, #ffffff 50%, ${redGreenMix})`;
  }
  return redGreenMix;
}

/** @type {Record<string,(args:{value: AffinityCell})=>boolean>} */
export const targetPredicates = {
  "> 0": ({ value: { affinity } }) => affinity > 0,
};
/** @type {Record<string,(a: Vec2d, b: Vec2d)=>number>} */
export const distanceFormulas = {
  Manhattan: (a, b) => Math.abs(a.x - b.x) + Math.abs(a.y - b.y),
  Euclidean: (a, b) =>
    Math.sqrt(Math.pow(a.x - b.x, 2) + Math.pow(a.y - b.y, 2)),
  Chebyshev: (a, b) => Math.max(Math.abs(a.x - b.x), Math.abs(a.y - b.y)),
};

/**
 * @typedef {{
 *		add: (prev: number, current: AffinityCell) => number;
 *		subtract: (prev: number, current: AffinityCell) => number;
 *	}} Accumulator
 */

/** @type {Record<string,Accumulator>} */
export const accumulators = {
  "Add One": {
    add: (prev) => prev + 1,
    subtract: (prev) => prev - 1,
  },
  "Add Value": {
    add: (prev, { affinity }) => prev + affinity,
    subtract: (prev, { affinity }) => prev - affinity,
  },
};

/**
 * @implements {Grid<AffinityCell>}
 * @implements {ViewElement}
 */
export class AffinityGrid {
  static #CELL_SIZE = 20;
  /** @readonly */ #N;
  /** @readonly */ #targetPredicate = new ViewSelectControl(
    "Target",
    Object.keys(targetPredicates),
  );
  /** @readonly */ #distanceFormula = new ViewSelectControl(
    "Distance",
    Object.keys(distanceFormulas),
  );
  /** @readonly */ #accumulator = new ViewSelectControl(
    "Accumulator",
    Object.keys(accumulators),
  );
  /** @readonly */ #newAffinity = new ViewIntControl("New", 50, -50, 50);
  #count = new ViewOutput("count", 0);
  /** @readonly @type {ViewControl<any>[]} */ controls;
  /** @readonly @type {string} */ name;
  /** @readonly @type {OffscreenCanvas} */ #offscreenCanvas;
  /** @readonly @type {AffinityCell[][]} */ #data;
  /** @readonly @type {Rectangle} */ rectangle;

  /**
   * @param {string} name
   * @param {number[][]} affinities
   * @param {number} N
   */
  constructor(name, affinities, N) {
    this.name = name;
    this.#N = new ViewIntControl("N", N, 0);
    this.controls = [
      this.#N,
      this.#targetPredicate,
      this.#distanceFormula,
      this.#accumulator,
      this.#newAffinity,
      this.#count,
    ];
    this.rectangle = new Rectangle(
      new Vec2d(0, 0),
      new Vec2d(affinities[0].length, affinities.length),
    );
    this.#offscreenCanvas = new OffscreenCanvas(...this.rectangle.size.tuple);
    this.#data = affinities.map((row) =>
      row.map(
        (affinity) =>
          /** @type {AffinityCell} */ ({ affinity, effected: false }),
      ),
    );
    this.#renderOffscreen();

    [
      this.#N,
      this.#accumulator,
      this.#targetPredicate,
      this.#distanceFormula,
    ].forEach((control) => {
      control.element.addEventListener("input", () => {
        this.#clear();
        this.#renderOffscreen();
      });
    });
  }
  #clear(rectangle = this.rectangle) {
    const accumulator = accumulators[this.#accumulator.value];

    flatten(this, rectangle).forEach(({ pos, value }) => {
      if (value.effected) {
        this.#count.value = accumulator.subtract(this.#count.value, value);
      }
      this.#set(pos, { ...value, effected: false });
    });
    if (rectangle == this.rectangle) {
      this.#count.value = 0;
    }
  }
  /**
   *
   * @param {Rectangle} [rectangle]
   */
  #renderOffscreen(rectangle = this.rectangle) {
    const accumulator = accumulators[this.#accumulator.value];
    countGridCellNeighborhoods(this, {
      distanceFormula: distanceFormulas[this.#distanceFormula.value],
      targetPredicate: targetPredicates[this.#targetPredicate.value],
      N: this.#N.value,
      rectangle: rectangle,
    }).forEach(({ value: cell, pos }) => {
      this.#count.value = accumulator.add(this.#count.value, cell);
      this.#set(pos, { ...cell, effected: true });
    });
    const ctx = this.#offscreenCanvas.getContext("2d");
    if (!ctx) {
      throw new Error("No rendering context available.");
    }
    ctx.clearRect(...rectangle.tuple);
    flatten(this, rectangle).forEach(({ pos, value: cell }) => {
      ctx.fillStyle = getAffinityCellColor(cell);
      ctx.fillRect(pos.x, pos.y, 1, 1);
    });
  }

  /**
   * @param {CanvasRenderingContext2D} ctx
   * @param {Mouse} mouse
   */
  render(ctx, mouse) {
    ctx.save();
    ctx.scale(AffinityGrid.#CELL_SIZE, AffinityGrid.#CELL_SIZE);
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(this.#offscreenCanvas, 0, 0);
    ctx.restore();
    ctx.strokeStyle = "black";
    /** @param {number} value */
    const mousePosOnGrid = mouse.scale(1 / AffinityGrid.#CELL_SIZE).floor();
    if (mouse.down) {
      this.#set(mousePosOnGrid, { affinity: this.#newAffinity.value });
    }
    ctx.strokeRect(
      ...mousePosOnGrid.scale(AffinityGrid.#CELL_SIZE).tuple,
      AffinityGrid.#CELL_SIZE,
      AffinityGrid.#CELL_SIZE,
    );
  }
  /**
   * @param {Vec2d} pos
   * @returns {AffinityCell}
   */
  get(pos) {
    return this.#data[pos.y][pos.x];
  }
  /**
   * @param {Vec2d} pos
   * @param {Partial<AffinityCell>} newCell
   */
  #set(pos, newCell) {
    if (!(pos.y in this.#data && pos.x in this.#data[pos.y])) {
      return;
    }

    const newAffinity = newCell.affinity !== this.get(pos).affinity;
    const rectangle = new Rectangle(
      pos.sub(new Vec2d(1, 1).scale(this.#N.value)),
      new Vec2d(1, 1).scale(this.#N.value * 2 + 1),
    );
    if (newAffinity) {
      this.#clear(rectangle);
    }
    Object.assign(this.#data[pos.y][pos.x], newCell);
    if (newAffinity) {
      this.#renderOffscreen(rectangle);
    }
  }
  /**
   * @return {Rectangle}
   */
  get boundingRectangle() {
    return new Rectangle(
      this.rectangle.position,
      this.rectangle.size.scale(AffinityGrid.#CELL_SIZE),
    );
  }
}
