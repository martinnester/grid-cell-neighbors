import { watch } from 'runed';
import { Vec2d, Grid, Rectangle, type GridEntry } from './algorithms.svelte';

export type NumberGridCell = { value: number; effected: boolean };
export class NumberGrid extends Grid<NumberGridCell> {
	A: keyof typeof accumulators;
	T: keyof typeof targetPredicates;
	D: keyof typeof distanceFormulas;
	N: number;
	initialized: boolean = $state(false);
	protected distanceFormula: (from: Vec2d, to: Vec2d) => number;
	protected targetPredicate: (entry: GridEntry<NumberGridCell>) => boolean;
	private accumulator: {
		add: (prev: number, current: NumberGridCell) => number;
		subtract: (prev: number, current: NumberGridCell) => number;
	};
	private _score: number = $state(0);
	private readonly data: { value: number; effected: boolean }[][];
	private readonly canvas: OffscreenCanvas;
	private readonly effectsCanvas: OffscreenCanvas;
	readonly size: Vec2d;
	private getColor: (cell: number) => string;
	get score() {
		return this._score;
	}
	constructor(
		data: number[][],
		getColor: (cell: number) => string,
		A: keyof typeof accumulators,
		T: keyof typeof targetPredicates,
		D: keyof typeof distanceFormulas,
		N: number
	) {
		super();
		this.A = $state(A);
		this.T = $state(T);
		this.D = $state(D);
		this.N = $state(N);
		this.distanceFormula = $derived(distanceFormulas[this.D]);
		this.targetPredicate = $derived(targetPredicates[this.T]);
		this.accumulator = $derived(accumulators[this.A]);
		this.data = data.map((x) => x.map((y) => ({ value: y, effected: false })));
		this.getColor = getColor;
		this.size = new Vec2d(this.data[0].length, this.data.length);
		this.canvas = new OffscreenCanvas(this.size.x, this.size.y);
		this.effectsCanvas = new OffscreenCanvas(this.size.x, this.size.y);
		watch(
			[
				() => this.initialized,
				() => this.A,
				() => this.T,
				() => this.D,
				() => this.N,
				() => getColor(0)
			],
			() => {
				if (!this.initialized) {
					return;
				}
				this._score = 0;
				(() => {
					const ctx = this.canvas.getContext('2d');
					if (ctx) {
						ctx.clearRect(...this.rectangle.tuple);
						this.flatten().forEach(({ pos, value: { value } }) => {
							ctx.fillStyle = this.getColor(value);
							ctx.fillRect(pos.x, pos.y, 1, 1);
						});
					}
				})();

				(() => {
					const ctx = this.effectsCanvas.getContext('2d');
					if (ctx) {
						ctx.fillStyle = '#ffffff4f';
						ctx.clearRect(...this.rectangle.tuple);
						this.update(this.rectangle).forEach(({ pos, value }) => {
							ctx.fillRect(pos.x, pos.y, 1, 1);
							this.data[pos.x][pos.y].effected = true;
							this._score = this.accumulator.add(this._score, value);
						});
					}
				})();
			}
		);
	}
	get(pos: Vec2d) {
		return this.data[pos.x]?.[pos.y];
	}
	set(pos: Vec2d, value: number) {
		(() => {
			const ctx = this.canvas.getContext('2d');
			if (ctx) {
				ctx.fillStyle = this.getColor(value);
				ctx.fillRect(pos.x, pos.y, 1, 1);
			}
		})();
		(() => {
			const ctx = this.effectsCanvas.getContext('2d');
			if (ctx) {
				ctx.fillStyle = '#ffffff4f';
				const rectangle = new Rectangle(
					pos.sub(Vec2d.ONE.scale(this.N)),
					Vec2d.ONE.scale(this.N * 2 + 1)
				);
				console.log('before revert', this._score);
				this.flatten(rectangle.clamp(new Rectangle(Vec2d.ZERO, this.size))).forEach(
					({ pos, value }) => {
						console.log(JSON.stringify({ pos, value }));
						if (value.effected) {
							this._score = this.accumulator.subtract(this.score, value);
						}
						this.data[pos.x][pos.y].effected = false;
					}
				);
				console.log('after revert, before add', this._score);
				this.data[pos.x][pos.y].value = value;
				ctx.clearRect(...rectangle.tuple);
				this.update(rectangle).forEach(({ pos, value }) => {
					console.log(JSON.stringify({ pos, value }));
					this.data[pos.x][pos.y].effected = true;
					ctx.fillRect(pos.x, pos.y, 1, 1);
					this._score = this.accumulator.add(this.score, value);
				});
				console.log('after add', this._score);
			}
		})();
	}
	draw(ctx: CanvasRenderingContext2D, dimEffected: boolean): void {
		const smoothingEnabledSave = ctx.imageSmoothingEnabled;
		ctx.imageSmoothingEnabled = false;
		ctx.drawImage(this.canvas, 0, 0);
		if (dimEffected) {
			ctx.drawImage(this.effectsCanvas, 0, 0);
		}
		ctx.imageSmoothingEnabled = smoothingEnabledSave;
	}
}

export const genRandomGrid = (size: number) =>
	Array.from({ length: size }).map(() =>
		Array.from({ length: size }).map(() => (Math.random() > 0.9 ? 50 : 0))
	);

export const targetPredicates = {
	'> 0': ({ value: { value } }) => value > 0
} as const satisfies Record<string, NumberGrid['targetPredicate']>;

export const distanceFormulas = {
	Manhattan: (a, b) => Math.abs(a.x - b.x) + Math.abs(a.y - b.y),
	Euclidean: (a, b) => Math.sqrt(Math.pow(a.x - b.x, 2) + Math.pow(a.y - b.y, 2)),
	Chebyshev: (a, b) => Math.max(Math.abs(a.x - b.x), Math.abs(a.y - b.y))
} as const satisfies Record<string, NumberGrid['distanceFormula']>;

export const accumulators = {
	'Add One': {
		add: (prev) => prev + 1,
		subtract: (prev) => prev - 1
	},
	'Add Value': {
		add: (prev, { value }) => prev + value,
		subtract: (prev, { value }) => prev - value
	}
} as const satisfies Record<string, NumberGrid['accumulator']>;
