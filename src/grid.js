import { Rectangle, Vec2d } from "./geometry.js";

/**
 * @template Cell
 * @typedef {{
 *  get(pos: Vec2d): Cell,
 *  readonly rectangle: Rectangle,
 * }} Grid
 */

/**
 * @template Cell
 * @typedef {{
 *  readonly pos: Vec2d,
 *  readonly value: Cell,
 * }} GridEntry
 */

/**
 * @template Cell
 * @param {Grid<Cell>} grid
 * @param {Rectangle} area
 * @returns {Generator<GridEntry<Cell>>}
 */
export function* flatten(grid, area = grid.rectangle) {
  for (let X = area.position.x; X < area.position.x + area.size.x; X++) {
    for (let Y = area.position.y; Y < area.position.y + area.size.y; Y++) {
      const pos = new Vec2d(X, Y);
      const value = grid.get(pos);
      yield { pos, value };
    }
  }
}

export const BFSVisitResult = Object.freeze({
  FOUND: 0,
  CONTINUE: 1,
  PRUNE: 2,
});

const BFS_OFFSETS = [
  new Vec2d(-1, 0),
  new Vec2d(1, 0),
  new Vec2d(0, -1),
  new Vec2d(0, 1),
];

/** Breadth-First Search
 * @template Cell
 * @param {Grid<Cell>} grid
 * @param {Vec2d} startPos
 * @param {(entry: GridEntry<Cell>) => number} visit called with each cell in the traversal, returning `BFSVisitResult.PRUNE` will prune a branch
 * @returns {boolean} true if a call to a visit returned `BFSVisitResult.FOUND`, false otherwise
 */
export function bfs(grid, startPos, visit) {
  const visited = new Set([startPos.mod(grid.rectangle.size).key()]);
  const queue = [startPos];
  while (queue.length) {
    const pos = /** @type {Vec2d} */ (queue.shift()); //TODO: shift is O(N). Find something faster.
    const value = grid.get(pos);
    if (value === undefined) {
      continue;
    }
    switch (visit({ pos, value })) {
      case BFSVisitResult.CONTINUE:
        BFS_OFFSETS.forEach((offset) => {
          const newPos = pos.add(offset);
          if (!visited.has(newPos.mod(grid.rectangle.size).key())) {
            visited.add(newPos.mod(grid.rectangle.size).key());
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
