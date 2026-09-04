export class Vec2d {
	static ZERO = new Vec2d(0, 0);
	static ONE = new Vec2d(1, 1);
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
	maximums(that: Vec2d) {
		return new Vec2d(Math.max(this.x, that.x), Math.max(this.y, that.y));
	}
	minimums(that: Vec2d) {
		return new Vec2d(Math.min(this.x, that.x), Math.min(this.y, that.y));
	}
}

export class Rectangle {
	readonly start: Vec2d;
	readonly size: Vec2d;
	constructor(start: typeof this.start, size: typeof this.size) {
		this.start = start;
		this.size = size;
	}
	contains(pos: Vec2d): boolean {
		return (
			pos.x >= this.start.x &&
			pos.y >= this.start.y &&
			pos.x < this.start.x + this.size.x &&
			pos.y < this.start.y + this.size.y
		);
	}
	clamp(that: Rectangle): Rectangle {
		console.log({ thiss: this, that });
		const max = this.start.maximums(that.start);
		return new Rectangle(
			max,
			this.start.add(this.size).minimums(that.start.add(that.size)).sub(max)
		);
	}
}

export abstract class Grid<Cell> {
	abstract draw(
		ctx: CanvasRenderingContext2D,
		getColor: (value: Cell) => string,
		size: number
	): void;
	abstract get(pos: Vec2d): Cell | undefined;
	abstract set(pos: Vec2d, value: number): void;
	abstract readonly size: Vec2d;
	get rectangle(): Rectangle {
		return new Rectangle(Vec2d.ZERO, this.size);
	}
	*flatten(
		{ start, size }: Rectangle = new Rectangle(new Vec2d(0, 0), this.size)
	): Generator<GridEntry<Cell>> {
		for (let X = start.x; X < start.x + size.x; X++) {
			for (let Y = start.y; Y < start.y + size.y; Y++) {
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
	rectangle?: Rectangle;
};
export function* gridCellNeighborhoods<Cell>({
	grid,
	N,
	distanceFormula,
	targetPredicate,
	rectangle
}: GridCellNeighborhoodsOptions<Cell>) {
	yield* grid
		.flatten(rectangle?.clamp(grid.rectangle))
		.map((x) => {
			if (rectangle) {
				console.log(x);
			}
			return x;
		})
		.filter((entry) =>
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
