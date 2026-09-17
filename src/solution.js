import { Rectangle, Vec2d } from "./geometry.js";
/** @import { Grid, GridEntry } from "./grid.js" */
import { bfs, BFSVisitResult, flatten } from "./grid.js";

/**
 * @template Cell
 * @param {Grid<Cell>} grid
 * @param {{
 *  rectangle?: Rectangle,
 *  distanceFormula: (from: Vec2d, to: Vec2d) => number,
 *  targetPredicate: (entry: GridEntry<Cell>) => boolean,
 *  N: number,
 * }} options
 */
export function* countGridCellNeighborhoods(grid, options) {
  yield* flatten(grid, options.rectangle).filter((entry) => {
    const res = bfs(grid, entry.pos, (bfsEntry) => {
      const dist = options.distanceFormula(entry.pos, bfsEntry.pos);
      if (dist > options.N) {
        return BFSVisitResult.PRUNE;
      }
      if (bfsEntry !== undefined && options.targetPredicate(bfsEntry)) {
        return BFSVisitResult.FOUND;
      }
      return BFSVisitResult.CONTINUE;
    });
    return res;
  });
}
