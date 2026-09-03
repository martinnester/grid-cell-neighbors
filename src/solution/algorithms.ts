import type { Grid, GridPos } from './types';

enum BFSVisitResult {
	FOUND,
	CONTINUE,
	PRUNE
}

const OFFSETS = [
	[-1, 0],
	[1, 0],
	[0, -1],
	[0, 1]
];
/** Breadth-First Search
 * @param grid target, conceptually the edges in the graph between adjacent cell (not at an angle)
 * @param visit called with each cell in the traversal, returning `BFSVisitResult.PRUNE` will prune a branch
 * @returns true if a call to a visit returned `BFSVisitResult.FOUND`, false otherwise
 */
const bfs = <Cell>(
	grid: Grid<Cell>,
	startPos: GridPos,
	visit: (pos: GridPos, value: Cell) => BFSVisitResult
): boolean => {
	const visited = new Set<string>(`${startPos[0]},${startPos[1]}`);
	const queue = [startPos];
	while (queue.length) {
		const current = queue.shift()!;
		const value = grid[current[0]][current[1]];
		switch (visit(current, value)) {
			case BFSVisitResult.CONTINUE:
				OFFSETS.forEach((offset) => {
					const i = current[0] + offset[0];
					const j = current[1] + offset[1];
					const key = `${i},${j}`;
					if (i >= 0 && j >= 0 && i < grid.length && j < grid[i].length && !visited.has(key)) {
						visited.add(key);
						queue.push([i, j]);
					}
				});
				break;
			case BFSVisitResult.FOUND:
				return true;
			case BFSVisitResult.PRUNE:
				continue;
		}
	}
	return false;
};

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
	return reduceCells(
		grid,
		({ accumulation, effected }, cell, startPos) =>
			bfs(grid, startPos, (currPos, value) => {
				const dist = options.distanceFormula(startPos, currPos);
				if (dist > N) {
					return BFSVisitResult.PRUNE;
				}
				if (options.targetPredicate(currPos, value)) {
					return BFSVisitResult.FOUND;
				}
				return BFSVisitResult.CONTINUE;
			})
				? {
						accumulation: options.accumulator(accumulation, startPos, cell),
						effected: [...effected, startPos]
					}
				: { accumulation, effected },
		<CountGridCellNeighborhoodsResult<Acc>>{
			effected: [],
			accumulation: options.initialAccumulation
		}
	);
};
