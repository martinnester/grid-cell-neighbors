import type { Grid, GridPos } from "./types";

export const reduceCells = <Result, Cell>(
	data: Grid<Cell>,
	callbackfn: (previousValue: Result, currentValue: Cell, currentIndex: GridPos) => Result,
	initialValue: Result
): Result =>
	data.reduce(
		(accRows, row, i) => row.reduce((accCols, col, j) => callbackfn(accCols, col, [i, j]), accRows),
		initialValue
	);

export type CountGridCellNeighborhoodsOptions<Cell, Acc> = {
	distanceFormula: (from: GridPos, to: GridPos) => number;
	accumulator: (prev: Acc, pos: GridPos, value: Cell) => Acc;
	targetPredicate: (pos: GridPos, value: Cell) => boolean;
	initialAccumulation: Acc;
};
export type CountGridCellNeighborhoodsResult<Acc> = { effected: GridPos[]; accumulation: Acc };
export const countGridCellNeighborhoods = <Cell, Acc>(
	grid: Grid<Cell>,
	N: number,
	options: CountGridCellNeighborhoodsOptions<Cell, Acc>
): CountGridCellNeighborhoodsResult<Acc> => {
	const targets: [number, number][] = reduceCells(
		grid,
		(prev, cell, [i, j]) =>
			options.targetPredicate([i, j], cell) ? ([...prev, [i, j]] as const) : prev,
		<[number, number][]>[]
	);
	return reduceCells(
		grid,
		({ accumulation, effected }, cell, [i1, j1]) =>
			targets.find(([i2, j2]) => options.distanceFormula([i1, j1], [i2, j2]) <= N)
				? {
						accumulation: options.accumulator(accumulation, [i1, j1], cell),
						effected: [...effected, [i1, j1] as const]
					}
				: { accumulation, effected },
		<CountGridCellNeighborhoodsResult<Acc>>{
			effected: [],
			accumulation: options.initialAccumulation
		}
	);
};
