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
		const max = this.start.maximums(that.start);
		return new Rectangle(
			max,
			this.start.add(this.size).minimums(that.start.add(that.size)).sub(max)
		);
	}
	get tuple(): [number, number, number, number] {
		return [this.start.x, this.start.y, this.size.x, this.size.y];
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
export interface GridOptions<Cell> {
	N: number;
	distanceFormula: (from: Vec2d, to: Vec2d) => number;
	targetPredicate: (entry: GridEntry<Cell>) => boolean;
	accumulator: {
		add: (prev: number, current: Cell) => number;
		subtract: (prev: number, current: Cell) => number;
	};
}
export abstract class Grid<Cell> {
	abstract draw(ctx: CanvasRenderingContext2D): void;
	abstract get(pos: Vec2d): Cell | undefined;
	abstract set(pos: Vec2d, value: number): void;
	abstract readonly score: number;
	abstract readonly size: Vec2d;
	readonly options: GridOptions<Cell>;
	constructor(options: () => GridOptions<Cell>) {
		this.options = $derived(options());
	}
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
	private static BFS_OFFSETS = [
		new Vec2d(-1, 0),
		new Vec2d(1, 0),
		new Vec2d(0, -1),
		new Vec2d(0, 1)
	];
	/** Breadth-First Search
	 * @param grid target, conceptually the edges in the graph between adjacent cell (not at an angle)
	 * @param visit called with each cell in the traversal, returning `BFSVisitResult.PRUNE` will prune a branch
	 * @returns true if a call to a visit returned `BFSVisitResult.FOUND`, false otherwise
	 */
	bfs(startPos: Vec2d, visit: (entry: GridEntry<Cell>) => BFSVisitResult): boolean {
		// eslint-disable-next-line svelte/prefer-svelte-reactivity
		const visited = new Set<string>(startPos.key());
		const queue = [startPos];
		while (queue.length) {
			const pos = queue.shift()!; //TODO: shift is O(N). Find something faster.
			const value = this.get(pos);
			if (value === undefined) {
				continue;
			}
			switch (visit({ pos, value })) {
				case BFSVisitResult.CONTINUE:
					Grid.BFS_OFFSETS.forEach((offset) => {
						const newPos = pos.add(offset);
						if (newPos.bounded(this.size) && !visited.has(newPos.key())) {
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
	}
	protected *update(rectangle: Rectangle) {
		yield* this.flatten(rectangle?.clamp(rectangle)).filter((entry) => {
			const res = this.bfs(entry.pos, (bfsEntry) => {
				const dist = this.options.distanceFormula(entry.pos, bfsEntry.pos);
				if (dist > this.options.N) {
					return BFSVisitResult.PRUNE;
				}
				if (bfsEntry !== undefined && this.options.targetPredicate(bfsEntry)) {
					return BFSVisitResult.FOUND;
				}
				return BFSVisitResult.CONTINUE;
			});
			return res;
		});
	}
}
