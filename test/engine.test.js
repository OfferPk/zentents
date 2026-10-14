/**
 * Unit tests for ZenTents Core Logic Engine & Level Suite
 */

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const {
  CELL_EMPTY,
  CELL_GRASS,
  CELL_TENT,
  CELL_TREE,
  TentEngine,
  TentSolver
} = require('../src/tent-engine');
const { LEVELS } = require('../src/levels');

describe('ZenTents Core Engine Logic', () => {
  it('Initializes level correctly with trees and empty cells', () => {
    const level = LEVELS[0];
    const engine = new TentEngine(level);

    assert.equal(engine.size, level.size);
    assert.equal(engine.trees.length, level.trees.length);

    for (const [r, c] of level.trees) {
      assert.equal(engine.getCell(r, c), CELL_TREE);
      assert.equal(engine.isTree(r, c), true);
    }

    assert.equal(engine.isLevelCompleted(), false);
  });

  it('Cycles cell states: EMPTY (0) -> GRASS (1) -> TENT (2) -> EMPTY (0)', () => {
    const level = LEVELS[0];
    const engine = new TentEngine(level);

    // Find non-tree cell
    let target = null;
    for (let r = 0; r < engine.size; r++) {
      for (let c = 0; c < engine.size; c++) {
        if (!engine.isTree(r, c)) {
          target = { r, c };
          break;
        }
      }
      if (target) break;
    }

    assert.equal(engine.getCell(target.r, target.c), CELL_EMPTY);

    engine.toggleCell(target.r, target.c);
    assert.equal(engine.getCell(target.r, target.c), CELL_GRASS);

    engine.toggleCell(target.r, target.c);
    assert.equal(engine.getCell(target.r, target.c), CELL_TENT);

    engine.toggleCell(target.r, target.c);
    assert.equal(engine.getCell(target.r, target.c), CELL_EMPTY);
  });

  it('Undo and reset operations work properly', () => {
    const level = LEVELS[0];
    const engine = new TentEngine(level);

    let emptyCell = null;
    for (let r = 0; r < engine.size; r++) {
      for (let c = 0; c < engine.size; c++) {
        if (!engine.isTree(r, c)) {
          emptyCell = { r, c };
          break;
        }
      }
      if (emptyCell) break;
    }

    engine.toggleCell(emptyCell.r, emptyCell.c);
    assert.equal(engine.getCell(emptyCell.r, emptyCell.c), CELL_GRASS);

    const undid = engine.undo();
    assert.equal(undid, true);
    assert.equal(engine.getCell(emptyCell.r, emptyCell.c), CELL_EMPTY);

    // Reset test
    engine.toggleCell(emptyCell.r, emptyCell.c);
    engine.reset();
    assert.equal(engine.getCell(emptyCell.r, emptyCell.c), CELL_EMPTY);
  });

  it('Detects diagonal and orthogonal adjacency violations between tents', () => {
    // 5x5 dummy level
    const dummy = {
      id: 999,
      size: 5,
      trees: [[0, 0], [4, 4]],
      rowQuotas: [1, 0, 0, 0, 1],
      colQuotas: [1, 0, 0, 0, 1]
    };
    const engine = new TentEngine(dummy);

    // Place two touching tents diagonally
    engine.setCell(1, 1, CELL_TENT);
    engine.setCell(2, 2, CELL_TENT);

    const violations = engine.getViolations();
    assert.equal(violations.touchingTents.length, 2);
  });

  it('Detects row and column over-quota violations', () => {
    const dummy = {
      id: 999,
      size: 5,
      trees: [[0, 0], [0, 4]],
      rowQuotas: [1, 0, 0, 0, 0],
      colQuotas: [1, 1, 0, 0, 0]
    };
    const engine = new TentEngine(dummy);

    // Row 0 has quota 1, place two tents in row 0
    engine.setCell(0, 1, CELL_TENT);
    engine.setCell(0, 3, CELL_TENT);

    const violations = engine.getViolations();
    assert.ok(violations.overQuotaRows.includes(0));
  });

  it('Auto-marks surrounding grass cells when autoGrass flag is enabled', () => {
    const level = LEVELS[0];
    const engine = new TentEngine(level);

    // Find cell with surrounding non-trees
    let target = null;
    for (let r = 1; r < engine.size - 1; r++) {
      for (let c = 1; c < engine.size - 1; c++) {
        if (!engine.isTree(r, c)) {
          target = { r, c };
          break;
        }
      }
      if (target) break;
    }

    // Toggle twice with autoGrass=true to make it a TENT
    engine.toggleCell(target.r, target.c, true); // grass
    engine.toggleCell(target.r, target.c, true); // tent

    // Check surrounding empty cells became grass
    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        if (dr === 0 && dc === 0) continue;
        const nr = target.r + dr;
        const nc = target.c + dc;
        if (!engine.isTree(nr, nc)) {
          assert.equal(engine.getCell(nr, nc), CELL_GRASS);
        }
      }
    }
  });

  it('Provides actionable hints for deduction', () => {
    const level = LEVELS[0];
    const engine = new TentEngine(level);

    const hint = engine.getHint();
    assert.ok(hint);
    assert.ok(hint.message.length > 0);
  });

  it('Verifies and solves all 50 levels to 100% completion with unique solutions', () => {
    assert.equal(LEVELS.length, 50);

    for (const level of LEVELS) {
      const engine = new TentEngine(level);

      // Apply known solution
      for (const tent of level.solution) {
        engine.setCell(tent.r, tent.c, CELL_TENT);
      }

      // Check level is satisfied
      assert.equal(
        engine.isLevelCompleted(),
        true,
        `Level ${level.id} (${level.name}) should be completed with solution`
      );

      // Verify solver also finds exactly 1 solution
      const solver = new TentSolver(level.size, level.trees, level.rowQuotas, level.colQuotas);
      const solutions = solver.solve(2);
      assert.equal(solutions.length, 1, `Level ${level.id} must have a unique solution`);
    }
  });
});
