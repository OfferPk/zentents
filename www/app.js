/**
 * ZenTents - Main Game Application Controller
 */

(() => {
  // State
  let currentLevelIndex = 0;
  let engine = null;
  let completedLevels = new Set();
  let autoGrass = true;
  let isDragging = false;
  let dragMode = null; // 'grass' or null
  let hintCells = [];

  // DOM Elements
  const packNameEl = document.getElementById('pack-name');
  const levelNameEl = document.getElementById('level-name');
  const btnPrevLevel = document.getElementById('btn-prev-level');
  const btnNextLevel = document.getElementById('btn-next-level');
  const btnSound = document.getElementById('btn-sound');
  const btnLevels = document.getElementById('btn-levels');
  const btnUndo = document.getElementById('btn-undo');
  const btnReset = document.getElementById('btn-reset');
  const btnHint = document.getElementById('btn-hint');
  const btnAutoGrass = document.getElementById('btn-autograss');
  const hintBanner = document.getElementById('hint-banner');
  const hintText = document.getElementById('hint-text');
  const btnCloseHint = document.getElementById('btn-close-hint');
  const modalLevels = document.getElementById('modal-levels');
  const btnCloseLevels = document.getElementById('btn-close-levels');
  const packContainer = document.getElementById('pack-container');
  const modalVictory = document.getElementById('modal-victory');
  const btnNextVictory = document.getElementById('btn-next-victory');
  const colQuotasEl = document.getElementById('col-quotas');
  const rowQuotasEl = document.getElementById('row-quotas');
  const gridBoardEl = document.getElementById('grid-board');

  // Load progress from localStorage
  function loadProgress() {
    try {
      const saved = localStorage.getItem('zentents_completed');
      if (saved) {
        completedLevels = new Set(JSON.parse(saved));
      }
      const lastLevel = localStorage.getItem('zentents_level');
      if (lastLevel !== null) {
        const idx = parseInt(lastLevel, 10);
        if (!isNaN(idx) && idx >= 0 && idx < LEVELS.length) {
          currentLevelIndex = idx;
        }
      }
      const savedAutoGrass = localStorage.getItem('zentents_autograss');
      if (savedAutoGrass !== null) {
        autoGrass = savedAutoGrass === 'true';
      }
    } catch (e) {}
  }

  function saveProgress() {
    try {
      localStorage.setItem('zentents_completed', JSON.stringify([...completedLevels]));
      localStorage.setItem('zentents_level', String(currentLevelIndex));
      localStorage.setItem('zentents_autograss', String(autoGrass));
    } catch (e) {}
  }

  function init() {
    loadProgress();
    updateSoundBtn();
    updateAutoGrassBtn();
    loadLevel(currentLevelIndex);
    attachEvents();
  }

  function updateSoundBtn() {
    btnSound.textContent = sounds.enabled ? '🔊' : '🔇';
  }

  function updateAutoGrassBtn() {
    if (autoGrass) {
      btnAutoGrass.classList.add('active');
    } else {
      btnAutoGrass.classList.remove('active');
    }
  }

  function loadLevel(index) {
    if (index < 0 || index >= LEVELS.length) return;
    currentLevelIndex = index;
    saveProgress();

    const level = LEVELS[index];
    engine = new TentEngine(level);
    hintCells = [];
    hideHint();

    packNameEl.textContent = level.packName;
    levelNameEl.textContent = `Level ${level.id} (${level.size}×${level.size})`;

    btnPrevLevel.disabled = index === 0;
    btnNextLevel.disabled = index === LEVELS.length - 1;

    renderBoard();
  }

  function renderBoard() {
    const size = engine.size;
    const violations = engine.getViolations();
    const touchingSet = new Set(violations.touchingTents.map(t => `${t.r},${t.c}`));

    // 1. Column quotas
    colQuotasEl.style.gridTemplateColumns = `repeat(${size}, 1fr)`;
    colQuotasEl.innerHTML = '';
    for (let c = 0; c < size; c++) {
      const div = document.createElement('div');
      div.className = 'quota-num';
      div.textContent = engine.colQuotas[c];
      const count = engine.getTentCountInCol(c);
      if (count === engine.colQuotas[c]) {
        div.classList.add('satisfied');
      } else if (count > engine.colQuotas[c]) {
        div.classList.add('overquota');
      }
      colQuotasEl.appendChild(div);
    }

    // 2. Row quotas
    rowQuotasEl.style.gridTemplateRows = `repeat(${size}, 1fr)`;
    rowQuotasEl.innerHTML = '';
    for (let r = 0; r < size; r++) {
      const div = document.createElement('div');
      div.className = 'quota-num';
      div.textContent = engine.rowQuotas[r];
      const count = engine.getTentCountInRow(r);
      if (count === engine.rowQuotas[r]) {
        div.classList.add('satisfied');
      } else if (count > engine.rowQuotas[r]) {
        div.classList.add('overquota');
      }
      rowQuotasEl.appendChild(div);
    }

    // 3. Grid board
    gridBoardEl.style.gridTemplateColumns = `repeat(${size}, 1fr)`;
    gridBoardEl.style.gridTemplateRows = `repeat(${size}, 1fr)`;
    gridBoardEl.innerHTML = '';

    const hintSet = new Set(hintCells.map(c => `${c.r},${c.c}`));

    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        const cell = document.createElement('div');
        cell.className = 'cell';
        cell.dataset.r = r;
        cell.dataset.c = c;

        const val = engine.getCell(r, c);

        if (val === CELL_TREE) {
          cell.classList.add('tree');
          cell.textContent = '🌲';
        } else if (val === CELL_TENT) {
          cell.classList.add('tent');
          cell.textContent = '⛺';
          if (touchingSet.has(`${r},${c}`)) {
            cell.classList.add('conflict');
          }
        } else if (val === CELL_GRASS) {
          cell.classList.add('grass');
        }

        if (hintSet.has(`${r},${c}`)) {
          cell.classList.add('hint-highlight');
        }

        gridBoardEl.appendChild(cell);
      }
    }
  }

  function handleCellClick(r, c) {
    if (engine.isTree(r, c)) return;

    const prevRowSat = engine.isRowSatisfied(r);
    const prevColSat = engine.isColSatisfied(c);

    engine.toggleCell(r, c, autoGrass);
    const newVal = engine.getCell(r, c);

    if (newVal === CELL_TENT) {
      sounds.playTent();
    } else if (newVal === CELL_GRASS) {
      sounds.playGrass();
    } else {
      sounds.playClear();
    }

    // Check if new row/col quota reached
    if ((!prevRowSat && engine.isRowSatisfied(r)) || (!prevColSat && engine.isColSatisfied(c))) {
      sounds.playQuotaChime();
    }

    hintCells = [];
    renderBoard();
    checkVictory();
  }

  function handleCellDragGrass(r, c) {
    if (engine.isTree(r, c)) return;
    if (engine.getCell(r, c) === CELL_EMPTY) {
      engine.setCell(r, c, CELL_GRASS, true);
      sounds.playGrass();
      renderBoard();
    }
  }

  function checkVictory() {
    if (engine.isLevelCompleted()) {
      sounds.playVictory();
      completedLevels.add(LEVELS[currentLevelIndex].id);
      saveProgress();

      setTimeout(() => {
        showVictoryModal();
      }, 350);
    }
  }

  function showVictoryModal() {
    modalVictory.classList.remove('hidden');
  }

  function hideVictoryModal() {
    modalVictory.classList.add('hidden');
  }

  function showHint() {
    const hint = engine.getHint();
    if (!hint) return;
    hintText.textContent = hint.message;
    hintCells = hint.cells || [];
    hintBanner.classList.remove('hidden');
    renderBoard();
    sounds.playTap();
  }

  function hideHint() {
    hintBanner.classList.add('hidden');
    hintCells = [];
    renderBoard();
  }

  function renderLevelSelector() {
    packContainer.innerHTML = '';

    // Group levels by pack
    const packs = {};
    for (let i = 0; i < LEVELS.length; i++) {
      const level = LEVELS[i];
      if (!packs[level.packId]) {
        packs[level.packId] = {
          id: level.packId,
          name: level.packName,
          size: level.size,
          levels: []
        };
      }
      packs[level.packId].levels.push({ index: i, level });
    }

    for (const packKey in packs) {
      const pack = packs[packKey];
      const section = document.createElement('div');
      section.className = 'pack-section';

      const title = document.createElement('div');
      title.className = 'pack-title';
      title.innerHTML = `<span>${pack.name} (${pack.size}×${pack.size})</span>`;
      section.appendChild(title);

      const grid = document.createElement('div');
      grid.className = 'level-grid';

      for (const item of pack.levels) {
        const btn = document.createElement('button');
        btn.className = 'level-select-btn';
        btn.textContent = item.level.id;

        if (item.index === currentLevelIndex) {
          btn.classList.add('current');
        }
        if (completedLevels.has(item.level.id)) {
          btn.classList.add('completed');
        }

        btn.addEventListener('click', () => {
          modalLevels.classList.add('hidden');
          loadLevel(item.index);
          sounds.playTap();
        });

        grid.appendChild(btn);
      }

      section.appendChild(grid);
      packContainer.appendChild(section);
    }
  }

  function attachEvents() {
    // Sound toggle
    btnSound.addEventListener('click', () => {
      sounds.toggleSound();
      updateSoundBtn();
    });

    // Level navigation
    btnPrevLevel.addEventListener('click', () => {
      if (currentLevelIndex > 0) {
        loadLevel(currentLevelIndex - 1);
        sounds.playTap();
      }
    });

    btnNextLevel.addEventListener('click', () => {
      if (currentLevelIndex < LEVELS.length - 1) {
        loadLevel(currentLevelIndex + 1);
        sounds.playTap();
      }
    });

    // Action buttons
    btnUndo.addEventListener('click', () => {
      if (engine.undo()) {
        sounds.playClear();
        hintCells = [];
        renderBoard();
      }
    });

    btnReset.addEventListener('click', () => {
      engine.reset();
      sounds.playClear();
      hintCells = [];
      hideHint();
      renderBoard();
    });

    btnHint.addEventListener('click', () => {
      showHint();
    });

    btnCloseHint.addEventListener('click', () => {
      hideHint();
    });

    btnAutoGrass.addEventListener('click', () => {
      autoGrass = !autoGrass;
      saveProgress();
      updateAutoGrassBtn();
      sounds.playTap();
    });

    // Level selector modal
    btnLevels.addEventListener('click', () => {
      renderLevelSelector();
      modalLevels.classList.remove('hidden');
      sounds.playTap();
    });

    btnCloseLevels.addEventListener('click', () => {
      modalLevels.classList.add('hidden');
    });

    modalLevels.addEventListener('click', (e) => {
      if (e.target === modalLevels) {
        modalLevels.classList.add('hidden');
      }
    });

    // Victory modal
    btnNextVictory.addEventListener('click', () => {
      hideVictoryModal();
      if (currentLevelIndex < LEVELS.length - 1) {
        loadLevel(currentLevelIndex + 1);
      } else {
        renderLevelSelector();
        modalLevels.classList.remove('hidden');
      }
    });

    modalVictory.addEventListener('click', (e) => {
      if (e.target === modalVictory) {
        hideVictoryModal();
      }
    });

    // Touch & Pointer Drag to Paint Grass
    gridBoardEl.addEventListener('pointerdown', (e) => {
      const cellEl = e.target.closest('.cell');
      if (!cellEl) return;
      const r = parseInt(cellEl.dataset.r, 10);
      const c = parseInt(cellEl.dataset.c, 10);
      if (isNaN(r) || isNaN(c)) return;

      isDragging = true;
      handleCellClick(r, c);
    });

    gridBoardEl.addEventListener('pointermove', (e) => {
      if (!isDragging) return;
      // Get element under touch pointer
      const target = document.elementFromPoint(e.clientX, e.clientY);
      if (!target) return;
      const cellEl = target.closest('.cell');
      if (!cellEl) return;
      const r = parseInt(cellEl.dataset.r, 10);
      const c = parseInt(cellEl.dataset.c, 10);
      if (isNaN(r) || isNaN(c)) return;

      handleCellDragGrass(r, c);
    });

    window.addEventListener('pointerup', () => {
      isDragging = false;
    });

    window.addEventListener('pointercancel', () => {
      isDragging = false;
    });

    // Keyboard controls
    window.addEventListener('keydown', (e) => {
      if (e.key === 'z' || e.key === 'Z') {
        if (engine.undo()) {
          sounds.playClear();
          renderBoard();
        }
      } else if (e.key === 'r' || e.key === 'R') {
        engine.reset();
        sounds.playClear();
        renderBoard();
      } else if (e.key === 'h' || e.key === 'H') {
        showHint();
      } else if (e.key === 'ArrowRight') {
        if (currentLevelIndex < LEVELS.length - 1) {
          loadLevel(currentLevelIndex + 1);
        }
      } else if (e.key === 'ArrowLeft') {
        if (currentLevelIndex > 0) {
          loadLevel(currentLevelIndex - 1);
        }
      }
    });
  }

  // Initialize on load
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
