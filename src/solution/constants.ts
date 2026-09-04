import { Vec2d, type GridCellNeighborhoodsOptions, Grid } from './algorithms';

export type NGCNOptions = GridCellNeighborhoodsOptions<number>;

class NumberGrid extends Grid<number> {
	private readonly data: number[][];
	readonly size: Vec2d;
	constructor(data: number[][]) {
		super();
		this.data = data;
		this.size = new Vec2d(this.data[0].length, this.data.length);
	}
	get(pos: Vec2d): number | undefined {
		return this.data[pos.x]?.[pos.y];
	}
	set(pos: Vec2d, value: number) {
		this.data[pos.x][pos.y] = value;
	}
	draw(ctx: CanvasRenderingContext2D, getColor: (value: number) => string, size: number): void {
		this.flatten().forEach(({ pos, value }) => {
			ctx.fillStyle = getColor(value);
			ctx.fillRect(pos.x * size, pos.y * size, size, size);
		});
	}
}

export const genRandomGrid = (size: number) => ({
	data: new NumberGrid(
		Array.from({ length: size }).map(() =>
			Array.from({ length: size }).map(() => (Math.random() > 0.9 ? 50 : 0))
		)
	),
	N: 1
});

export const gridPresets: Record<string, { data: NumberGrid; N: number }> = {
	'Example 1': {
		data: new NumberGrid([
			[0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
			[0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
			[0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
			[0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
			[0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
			[0, 0, 0, 0, 0, 50, 0, 0, 0, 0, 0],
			[0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
			[0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
			[0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
			[0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
			[0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
		]),
		N: 3
	},
	'Example 2': {
		data: new NumberGrid([
			[0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
			[0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
			[0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
			[0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
			[0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
			[0, 50, 0, 0, 0, 0, 0, 0, 0, 0, 0],
			[0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
			[0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
			[0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
			[0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
			[0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
		]),
		N: 3
	},
	'Example 3': {
		data: new NumberGrid([
			[0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
			[0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
			[0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
			[0, 0, 0, 0, 0, 0, 0, 50, 0, 0, 0],
			[0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
			[0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
			[0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
			[0, 0, 0, 50, 0, 0, 0, 0, 0, 0, 0],
			[0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
			[0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
			[0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
		]),
		N: 2
	},
	'Example 4': {
		data: new NumberGrid([
			[0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
			[0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
			[0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
			[0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
			[0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
			[0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
			[0, 0, 0, 0, 0, 50, 0, 0, 0, 0, 0],
			[0, 0, 0, 50, 0, 0, 0, 0, 0, 0, 0],
			[0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
			[0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
			[0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
		]),
		N: 2
	},
	'100x100': genRandomGrid(100),
	'200x200': genRandomGrid(200),
	'400x400': genRandomGrid(400),
	'1000x1000': genRandomGrid(1000)
};

export const targetPredicates = {
	'> 0': ({ value }) => value > 0
} as const satisfies Record<string, NGCNOptions['targetPredicate']>;

export const distanceFormulas = {
	Manhattan: (a, b) => Math.abs(a.x - b.x) + Math.abs(a.y - b.y),
	Euclidean: (a, b) => Math.sqrt(Math.pow(a.x - b.x, 2) + Math.pow(a.y - b.y, 2)),
	Chebyshev: (a, b) => Math.max(Math.abs(a.x - b.x), Math.abs(a.y - b.y))
} as const satisfies Record<string, NGCNOptions['distanceFormula']>;
