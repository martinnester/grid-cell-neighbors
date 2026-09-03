import { Vec2d, type GridCellNeighborhoodsOptions, type Grid } from './algorithms';

export type NGCNOptions = GridCellNeighborhoodsOptions<number>;

class NGrid implements Grid<number> {
	readonly data: number[][];
	readonly size: Vec2d;
	constructor(data: typeof this.data) {
		this.data = data;
		this.size = new Vec2d(this.data.length, this.data[0].length);
	}
	get(pos: Vec2d): number | undefined {
		return this.data[pos.x]?.[pos.y];
	}
	set(pos: Vec2d, value: number) {
		this.data[pos.x][pos.y] = value;
	}
	*rows(): Generator<{ columns(): Generator<number> }> {
		for (const row of this.data) {
			function* columns() {
				for (const col of row) {
					yield col;
				}
			}
			yield { columns };
		}
	}
}

export const genRandomGrid = (size: number) => ({
	data: new NGrid(
		Array.from({ length: size }).map(() =>
			Array.from({ length: size }).map(() => (Math.random() > 0.9 ? 50 : 0))
		)
	),
	N: 1
});

export const gridPresets: Record<string, { data: NGrid; N: number }> = {
	'Example 1': {
		data: new NGrid([
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
		data: new NGrid([
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
		data: new NGrid([
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
		data: new NGrid([
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
