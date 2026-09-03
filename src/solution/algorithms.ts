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

export abstract class Grid<Cell> {
	abstract get(pos: Vec2d): Cell | undefined;
	abstract size: Vec2d;
	*flatten(start: Vec2d = new Vec2d(0, 0), size: Vec2d = this.size): Generator<GridEntry<Cell>> {
		for (let X = start.x; X < size.x; X++) {
			for (let Y = start.y; Y < size.y; Y++) {
				const pos = new Vec2d(X, Y);
				const value = this.get(pos)!;
				yield { pos, value };
			}
		}
	}
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
		const pos = queue.shift()!; //TODO: shift is O(N). Find something faster.
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
	yield* grid.flatten().filter((entry) =>
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
