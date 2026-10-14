/**
 * ZenTents - Core Game Logic & Constraint Solver Engine
 *
 * Rules:
 * 1. An N x N grid contains pre-placed trees (🌲).
 * 2. Every tree must have exactly one tent (⛺) orthogonally adjacent to it.
 * 3. Every tent must be adjacent to at least one tree, and there must exist
 *    a 1-to-1 matching (bijection) between trees and tents.
 * 4. No two tents may touch horizontally, vertically, or diagonally (King's move).
 * 5. Each row and column must contain the exact number of tents specified by its quota.
 */

const CELL_EMPTY = 0;
const CELL_GRASS = 1;
const CELL_TENT = 2;
const CELL_TREE = 3;

class TentEngine {
  constructor(level) {
    this.level = level;
    this.size = level.size;
    this.trees = level.trees.map(([r, c]) => ({ r, c }));
    this.rowQuotas = [...level.rowQuotas];
    this.colQuotas = [...level.colQuotas];

    // Initialize grid
    this.grid = Array.from({ length: this.size }, () =>
      Array(this.size).fill(CELL_EMPTY)
    );

    // Place trees
    for (const tree of this.trees) {
      this.grid[tree.r][tree.c] = CELL_TREE;
    }

    this.history = [];
  }

  isTree(r, c) {
    return this.grid[r][c] === CELL_TREE;
  }

  isInside(r, c) {
    return r >= 0 && r < this.size && c >= 0 && c < this.size;
  }

  getCell(r, c) {
    if (!this.isInside(r, c)) return null;
    return this.grid[r][c];
  }

  setCell(r, c, type, recordHistory = true) {
    if (!this.isInside(r, c) || this.isTree(r, c)) return false;
    if (this.grid[r][c] === type) return false;

    if (recordHistory) {
      this.history.push({
        r,
        c,
        prev: this.grid[r][c],
        next: type
      });
    }

    this.grid[r][c] = type;
    return true;
  }

  toggleCell(r, c, autoGrass = false) {
    if (!this.isInside(r, c) || this.isTree(r, c)) return false;

    const current = this.grid[r][c];
    let next;
    if (current === CELL_EMPTY) {
      next = CELL_GRASS;
    } else if (current === CELL_GRASS) {
      next = CELL_TENT;
    } else {
      next = CELL_EMPTY;
    }

    this.history.push({
      r,
      c,
      prev: current,
      next
    });

    this.grid[r][c] = next;

    if (next === CELL_TENT && autoGrass) {
      this.autoMarkSurroundingGrass(r, c);
    }

    return true;
  }

  autoMarkSurroundingGrass(tentR, tentC) {
    // 8-neighbor cells around the tent
    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        if (dr === 0 && dc === 0) continue;
        const nr = tentR + dr;
        const nc = tentC + dc;
        if (this.isInside(nr, nc) && this.grid[nr][nc] === CELL_EMPTY) {
          this.setCell(nr, nc, CELL_GRASS, true);
        }
      }
    }
  }

  undo() {
    if (this.history.length === 0) return false;
    const action = this.history.pop();
    this.grid[action.r][action.c] = action.prev;
    return true;
  }

  reset() {
    this.history = [];
    for (let r = 0; r < this.size; r++) {
      for (let c = 0; c < this.size; c++) {
        if (this.grid[r][c] !== CELL_TREE) {
          this.grid[r][c] = CELL_EMPTY;
        }
      }
    }
  }

  getTents() {
    const tents = [];
    for (let r = 0; r < this.size; r++) {
      for (let c = 0; c < this.size; c++) {
        if (this.grid[r][c] === CELL_TENT) {
          tents.push({ r, c });
        }
      }
    }
    return tents;
  }

  getTentCountInRow(r) {
    let count = 0;
    for (let c = 0; c < this.size; c++) {
      if (this.grid[r][c] === CELL_TENT) count++;
    }
    return count;
  }

  getTentCountInCol(c) {
    let count = 0;
    for (let r = 0; r < this.size; r++) {
      if (this.grid[r][c] === CELL_TENT) count++;
    }
    return count;
  }

  isRowSatisfied(r) {
    return this.getTentCountInRow(r) === this.rowQuotas[r];
  }

  isColSatisfied(c) {
    return this.getTentCountInCol(c) === this.colQuotas[c];
  }

  getAdjacentTents(r, c) {
    const list = [];
    const deltas = [
      [-1, -1], [-1, 0], [-1, 1],
      [0, -1],           [0, 1],
      [1, -1],  [1, 0],  [1, 1]
    ];
    for (const [dr, dc] of deltas) {
      const nr = r + dr;
      const nc = c + dc;
      if (this.isInside(nr, nc) && this.grid[nr][nc] === CELL_TENT) {
        list.push({ r: nr, c: nc });
      }
    }
    return list;
  }

  getOrthogonalTrees(r, c) {
    const list = [];
    const deltas = [[-1, 0], [1, 0], [0, -1], [0, 1]];
    for (const [dr, dc] of deltas) {
      const nr = r + dr;
      const nc = c + dc;
      if (this.isInside(nr, nc) && this.grid[nr][nc] === CELL_TREE) {
        list.push({ r: nr, c: nc });
      }
    }
    return list;
  }

  getOrthogonalNeighbors(r, c) {
    const list = [];
    const deltas = [[-1, 0], [1, 0], [0, -1], [0, 1]];
    for (const [dr, dc] of deltas) {
      const nr = r + dr;
      const nc = c + dc;
      if (this.isInside(nr, nc)) {
        list.push({ r: nr, c: nc, cell: this.grid[nr][nc] });
      }
    }
    return list;
  }

  getViolations() {
    const violations = {
      touchingTents: [], // array of { r, c }
      overQuotaRows: [],
      overQuotaCols: [],
      isolatedTents: [] // tents with no adjacent trees
    };

    const tents = this.getTents();
    const tentSet = new Set(tents.map(t => `${t.r},${t.c}`));

    // 1. Check touching tents (8-way adjacency)
    for (const t of tents) {
      const adjacent = this.getAdjacentTents(t.r, t.c);
      if (adjacent.length > 0) {
        violations.touchingTents.push(t);
      }
      // Check if tent has orthogonal tree
      const orthoTrees = this.getOrthogonalTrees(t.r, t.c);
      if (orthoTrees.length === 0) {
        violations.isolatedTents.push(t);
      }
    }

    // 2. Check row quotas
    for (let r = 0; r < this.size; r++) {
      if (this.getTentCountInRow(r) > this.rowQuotas[r]) {
        violations.overQuotaRows.push(r);
      }
    }

    // 3. Check col quotas
    for (let c = 0; c < this.size; c++) {
      if (this.getTentCountInCol(c) > this.colQuotas[c]) {
        violations.overQuotaCols.push(c);
      }
    }

    return violations;
  }

  /**
   * Check if a 1-to-1 matching exists between all trees and all tents using Hopcroft-Karp / augmenting paths.
   */
  hasValidBipartiteMatching() {
    const tents = this.getTents();
    if (tents.length !== this.trees.length) return false;

    // Build bipartite graph: tree index -> array of adjacent tent indices
    const adj = Array.from({ length: this.trees.length }, () => []);
    for (let i = 0; i < this.trees.length; i++) {
      const tree = this.trees[i];
      for (let j = 0; j < tents.length; j++) {
        const tent = tents[j];
        const dist = Math.abs(tree.r - tent.r) + Math.abs(tree.c - tent.c);
        if (dist === 1) {
          adj[i].push(j);
        }
      }
    }

    // Maximum bipartite matching via augmenting paths
    const matchTent = Array(tents.length).fill(-1);

    function dfs(u, visited) {
      for (const v of adj[u]) {
        if (!visited[v]) {
          visited[v] = true;
          if (matchTent[v] < 0 || dfs(matchTent[v], visited)) {
            matchTent[v] = u;
            return true;
          }
        }
      }
      return false;
    }

    let matchCount = 0;
    for (let i = 0; i < this.trees.length; i++) {
      const visited = Array(tents.length).fill(false);
      if (dfs(i, visited)) {
        matchCount++;
      }
    }

    return matchCount === this.trees.length;
  }

  isLevelCompleted() {
    const tents = this.getTents();
    if (tents.length !== this.trees.length) return false;

    // Check all row quotas
    for (let r = 0; r < this.size; r++) {
      if (this.getTentCountInRow(r) !== this.rowQuotas[r]) return false;
    }

    // Check all col quotas
    for (let c = 0; c < this.size; c++) {
      if (this.getTentCountInCol(c) !== this.colQuotas[c]) return false;
    }

    // Check 8-way adjacency violations
    for (const t of tents) {
      if (this.getAdjacentTents(t.r, t.c).length > 0) return false;
    }

    // Verify 1-to-1 matching between trees and tents
    return this.hasValidBipartiteMatching();
  }

  getHint() {
    const violations = this.getViolations();
    if (violations.touchingTents.length > 0) {
      const t = violations.touchingTents[0];
      return {
        type: 'violation',
        message: `Tents at or near (${t.r + 1}, ${t.c + 1}) are touching. Tents cannot touch horizontally, vertically, or diagonally.`,
        cells: [{ r: t.r, c: t.c }]
      };
    }

    if (violations.overQuotaRows.length > 0) {
      const r = violations.overQuotaRows[0];
      return {
        type: 'violation',
        message: `Row ${r + 1} has more tents than its quota of ${this.rowQuotas[r]}.`,
        cells: [{ r, c: 0 }]
      };
    }

    if (violations.overQuotaCols.length > 0) {
      const c = violations.overQuotaCols[0];
      return {
        type: 'violation',
        message: `Column ${c + 1} has more tents than its quota of ${this.colQuotas[c]}.`,
        cells: [{ r: 0, c }]
      };
    }

    // 1. Row/Col with quota 0 having open cells
    for (let r = 0; r < this.size; r++) {
      if (this.rowQuotas[r] === 0) {
        for (let c = 0; c < this.size; c++) {
          if (this.grid[r][c] === CELL_EMPTY) {
            return {
              type: 'deduction',
              action: 'grass',
              message: `Row ${r + 1} has a quota of 0. All cells in this row can safely be marked as grass.`,
              cells: [{ r, c }]
            };
          }
        }
      }
    }

    for (let c = 0; c < this.size; c++) {
      if (this.colQuotas[c] === 0) {
        for (let r = 0; r < this.size; r++) {
          if (this.grid[r][c] === CELL_EMPTY) {
            return {
              type: 'deduction',
              action: 'grass',
              message: `Column ${c + 1} has a quota of 0. All cells in this column can safely be marked as grass.`,
              cells: [{ r, c }]
            };
          }
        }
      }
    }

    // 2. Row/Col quota met -> mark remaining as grass
    for (let r = 0; r < this.size; r++) {
      if (this.getTentCountInRow(r) === this.rowQuotas[r]) {
        for (let c = 0; c < this.size; c++) {
          if (this.grid[r][c] === CELL_EMPTY) {
            return {
              type: 'deduction',
              action: 'grass',
              message: `Row ${r + 1} already has all ${this.rowQuotas[r]} required tents. Remaining cells can be marked as grass.`,
              cells: [{ r, c }]
            };
          }
        }
      }
    }

    for (let c = 0; c < this.size; c++) {
      if (this.getTentCountInCol(c) === this.colQuotas[c]) {
        for (let r = 0; r < this.size; r++) {
          if (this.grid[r][c] === CELL_EMPTY) {
            return {
              type: 'deduction',
              action: 'grass',
              message: `Column ${c + 1} already has all ${this.colQuotas[c]} required tents. Remaining cells can be marked as grass.`,
              cells: [{ r, c }]
            };
          }
        }
      }
    }

    // 3. Row/Col forced tents: available non-grass spots == quota
    for (let r = 0; r < this.size; r++) {
      const placed = this.getTentCountInRow(r);
      const needed = this.rowQuotas[r] - placed;
      if (needed > 0) {
        const empties = [];
        for (let c = 0; c < this.size; c++) {
          if (this.grid[r][c] === CELL_EMPTY) {
            empties.push({ r, c });
          }
        }
        if (empties.length === needed) {
          return {
            type: 'deduction',
            action: 'tent',
            message: `Row ${r + 1} needs ${needed} more tent(s) and only has ${empties.length} available cell(s).`,
            cells: empties
          };
        }
      }
    }

    for (let c = 0; c < this.size; c++) {
      const placed = this.getTentCountInCol(c);
      const needed = this.colQuotas[c] - placed;
      if (needed > 0) {
        const empties = [];
        for (let r = 0; r < this.size; r++) {
          if (this.grid[r][c] === CELL_EMPTY) {
            empties.push({ r, c });
          }
        }
        if (empties.length === needed) {
          return {
            type: 'deduction',
            action: 'tent',
            message: `Column ${c + 1} needs ${needed} more tent(s) and only has ${empties.length} available cell(s).`,
            cells: empties
          };
        }
      }
    }

    // 4. Tree with only one valid neighbor
    for (const tree of this.trees) {
      const neighbors = this.getOrthogonalNeighbors(tree.r, tree.c);
      const hasTent = neighbors.some(n => n.cell === CELL_TENT);
      if (!hasTent) {
        const validSpots = neighbors.filter(n => n.cell === CELL_EMPTY);
        if (validSpots.length === 1) {
          const spot = validSpots[0];
          return {
            type: 'deduction',
            action: 'tent',
            message: `The tree at (${tree.r + 1}, ${tree.c + 1}) only has one available neighbor cell for its tent.`,
            cells: [{ r: spot.r, c: spot.c }]
          };
        }
      }
    }

    // 5. Empty cell with no orthogonal tree cannot be a tent
    for (let r = 0; r < this.size; r++) {
      for (let c = 0; c < this.size; c++) {
        if (this.grid[r][c] === CELL_EMPTY) {
          const trees = this.getOrthogonalTrees(r, c);
          if (trees.length === 0) {
            return {
              type: 'deduction',
              action: 'grass',
              message: `The cell at (${r + 1}, ${c + 1}) is not adjacent to any tree, so it cannot hold a tent.`,
              cells: [{ r, c }]
            };
          }
        }
      }
    }

    return {
      type: 'info',
      message: 'Look closely at rows with high quotas or trees with limited placement options.',
      cells: []
    };
  }
}

/**
 * TentSolver: Exact solver for level validation and generation
 */
class TentSolver {
  constructor(size, trees, rowQuotas, colQuotas) {
    this.size = size;
    this.trees = trees.map(([r, c]) => ({ r, c }));
    this.rowQuotas = [...rowQuotas];
    this.colQuotas = [...colQuotas];
  }

  solve(maxSolutions = 2) {
    const solutions = [];
    const size = this.size;
    const trees = this.trees;
    const rowQuotas = this.rowQuotas;
    const colQuotas = this.colQuotas;

    // Grid: 0 empty, 1 tree, 2 tent
    const isTreeGrid = Array.from({ length: size }, () => Array(size).fill(false));
    for (const t of trees) {
      isTreeGrid[t.r][t.c] = true;
    }

    // Candidate tent cells: must be adjacent to at least one tree
    const candidates = [];
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        if (!isTreeGrid[r][c]) {
          // Check if adjacent to a tree
          let nearTree = false;
          for (const [dr, dc] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) {
            const nr = r + dr;
            const nc = c + dc;
            if (nr >= 0 && nr < size && nc >= 0 && nc < size && isTreeGrid[nr][nc]) {
              nearTree = true;
              break;
            }
          }
          if (nearTree) {
            candidates.push({ r, c });
          }
        }
      }
    }

    const rowCounts = Array(size).fill(0);
    const colCounts = Array(size).fill(0);
    const grid = Array.from({ length: size }, () => Array(size).fill(0));

    function canPlaceTent(r, c) {
      if (rowCounts[r] >= rowQuotas[r]) return false;
      if (colCounts[c] >= colQuotas[c]) return false;

      // 8-neighbor adjacency check
      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          if (dr === 0 && dc === 0) continue;
          const nr = r + dr;
          const nc = c + dc;
          if (nr >= 0 && nr < size && nc >= 0 && nc < size && grid[nr][nc] === 2) {
            return false;
          }
        }
      }
      return true;
    }

    function checkBipartite(tents) {
      if (tents.length !== trees.length) return false;
      const adj = Array.from({ length: trees.length }, () => []);
      for (let i = 0; i < trees.length; i++) {
        const tree = trees[i];
        for (let j = 0; j < tents.length; j++) {
          const tent = tents[j];
          const dist = Math.abs(tree.r - tent.r) + Math.abs(tree.c - tent.c);
          if (dist === 1) {
            adj[i].push(j);
          }
        }
      }
      const matchTent = Array(tents.length).fill(-1);
      function dfs(u, visited) {
        for (const v of adj[u]) {
          if (!visited[v]) {
            visited[v] = true;
            if (matchTent[v] < 0 || dfs(matchTent[v], visited)) {
              matchTent[v] = u;
              return true;
            }
          }
        }
        return false;
      }
      let count = 0;
      for (let i = 0; i < trees.length; i++) {
        const visited = Array(tents.length).fill(false);
        if (dfs(i, visited)) count++;
      }
      return count === trees.length;
    }

    const tentsPlaced = [];

    function search(idx) {
      if (solutions.length >= maxSolutions) return;

      // If we placed all needed tents
      if (tentsPlaced.length === trees.length) {
        // Verify all row and col quotas exactly match
        let valid = true;
        for (let r = 0; r < size; r++) {
          if (rowCounts[r] !== rowQuotas[r]) { valid = false; break; }
        }
        if (valid) {
          for (let c = 0; c < size; c++) {
            if (colCounts[c] !== colQuotas[c]) { valid = false; break; }
          }
        }
        if (valid && checkBipartite(tentsPlaced)) {
          solutions.push(tentsPlaced.map(t => ({ ...t })));
        }
        return;
      }

      const remainingNeeded = trees.length - tentsPlaced.length;
      const remainingCandidates = candidates.length - idx;
      if (remainingCandidates < remainingNeeded) return;

      for (let i = idx; i < candidates.length; i++) {
        if (solutions.length >= maxSolutions) return;
        const { r, c } = candidates[i];

        if (canPlaceTent(r, c)) {
          // Place tent
          grid[r][c] = 2;
          rowCounts[r]++;
          colCounts[c]++;
          tentsPlaced.push({ r, c });

          search(i + 1);

          // Backtrack
          tentsPlaced.pop();
          colCounts[c]--;
          rowCounts[r]--;
          grid[r][c] = 0;
        }
      }
    }

    search(0);
    return solutions;
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    CELL_EMPTY,
    CELL_GRASS,
    CELL_TENT,
    CELL_TREE,
    TentEngine,
    TentSolver
  };
}
