import type {
	CountGridCellNeighborhoodsOptions,
	CountGridCellNeighborhoodsResult,
	Grid
} from './algorithms';

export type NGrid = Grid<number>;
export type NCGCNOptions = CountGridCellNeighborhoodsOptions<number, number>;
export type NCGCNResult = CountGridCellNeighborhoodsResult<number>;

export const accumulators = {
	'Add Value': (acc, _, cell) => acc + cell,
	'Add One': (acc) => acc + 1
} as const satisfies Record<string, NCGCNOptions['accumulator']>;

export const genRandomGrid = (size: number) => ({
	data: Array.from({ length: size }).map(() =>
		Array.from({ length: size }).map(() => (Math.random() > 0.9 ? 50 : 0))
	),
	N: 1
});

export const gridPresets: Record<string, { data: NGrid; N: number }> = {
	'Example 1': {
		data: [
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
		],
		N: 3
	},
	'Example 2': {
		data: [
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
		],
		N: 3
	},
	'Example 3': {
		data: [
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
		],
		N: 2
	},
	'Example 4': {
		data: [
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
		],
		N: 2
	},
	'100x100': genRandomGrid(100),
	'200x200': genRandomGrid(200),
	'400x400': genRandomGrid(400),
	'1000x1000': genRandomGrid(1000)
};

export const targetPredicates = {
	'> 0': (_, cell) => cell > 0
} as const satisfies Record<string, NCGCNOptions['targetPredicate']>;

export const distanceFormulas = {
	Manhattan: ([i1, j1], [i2, j2]) => Math.abs(i1 - i2) + Math.abs(j1 - j2),
	Euclidean: ([i1, j1], [i2, j2]) => Math.sqrt(Math.pow(i1 - i2, 2) + Math.pow(j1 - j2, 2)),
	Chebyshev: ([i1, j1], [i2, j2]) => Math.max(Math.abs(i1 - i2), Math.abs(j1 - j2))
} as const satisfies Record<string, NCGCNOptions['distanceFormula']>;
