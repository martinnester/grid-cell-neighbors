export class Vec2d {
	readonly x: number;
	readonly y: number;
	constructor(x: number, y: number) {
		this.x = x;
		this.y = y;
	}
	add(that: Vec2d) {
		return new Vec2d(this.x + that.x, this.y + that.y);
	}
	scale(amount: number) {
		return new Vec2d(this.x * amount, this.y * amount);
	}
	sub(that: Vec2d) {
		return new Vec2d(this.x - that.x, this.y - that.y);
	}
	key() {
		return `${this.x},${this.y}`;
	}
	bounded(size: Vec2d) {
		return this.x >= 0 && this.y >= 0 && this.x < size.x && this.y < size.y;
	}
}

export interface Grid<Cell> {
	get(pos: Vec2d): Cell | undefined;
	size: Vec2d;
	rows(): Generator<{
		columns(): Generator<Cell>;
	}>;
}

export type GridEntry<Cell> = {
	pos: Vec2d;
	value: Cell;
};

enum BFSVisitResult {
	FOUND,
	CONTINUE,
	PRUNE
}

const OFFSETS = [new Vec2d(-1, 0), new Vec2d(1, 0), new Vec2d(0, -1), new Vec2d(0, 1)];
/** Breadth-First Search
 * @param grid target, conceptually the edges in the graph between adjacent cell (not at an angle)
 * @param visit called with each cell in the traversal, returning `BFSVisitResult.PRUNE` will prune a branch
 * @returns true if a call to a visit returned `BFSVisitResult.FOUND`, false otherwise
 */
const bfs = <Cell>(
	grid: Grid<Cell>,
	startPos: Vec2d,
	visit: (entry: GridEntry<Cell>) => BFSVisitResult
): boolean => {
	const visited = new Set<string>(startPos.key());
	const queue = [startPos];
	while (queue.length) {
		const pos = queue.shift()!;
		const value = grid.get(pos)!;
		switch (visit({ pos, value })) {
			case BFSVisitResult.CONTINUE:
				OFFSETS.forEach((offset) => {
					const newPos = pos.add(offset);
					if (newPos.bounded(grid.size) && !visited.has(newPos.key())) {
						visited.add(newPos.key());
						queue.push(newPos);
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

export function* flattenGrid<Cell>(data: Grid<Cell>) {
	yield* data.rows().flatMap(function* (row, i) {
		yield* row.columns().map((col, j) => ({ pos: new Vec2d(i, j), value: col }));
	});
}

export type GridCellNeighborhoodsOptions<Cell> = {
	grid: Grid<Cell>;
	N: number;
	distanceFormula: (from: Vec2d, to: Vec2d) => number;
	targetPredicate: (entry: GridEntry<Cell>) => boolean;
};
export function* gridCellNeighborhoods<Cell>({
	grid,
	N,
	distanceFormula,
	targetPredicate
}: GridCellNeighborhoodsOptions<Cell>) {
	yield* flattenGrid(grid).filter((entry) =>
		bfs(grid, entry.pos, (bfsEntry) => {
			const dist = distanceFormula(entry.pos, bfsEntry.pos);
			if (dist > N) {
				return BFSVisitResult.PRUNE;
			}
			if (targetPredicate(bfsEntry)) {
				return BFSVisitResult.FOUND;
			}
			return BFSVisitResult.CONTINUE;
		})
	);
}
