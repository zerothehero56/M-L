// Legends & Misfits: tactics prototype with healing spots (fixed & hardened)

const canvas = document.getElementById('game');
if (!canvas) {
  console.error('Canvas element with id="game" not found.');
  // If no canvas, nothing to do; stop further execution.
} else {
  const ctx = canvas.getContext('2d');

  const GRID_SIZE = 10;
  let TILE = 0;

  const state = {
    turn: 1,
    hero: { x: 2, y: 2, moves: 3, attack: 2, ranged: 2, range: 3, hp: 10, maxHp: 12 },
    walls: [
      { x: 5, y: 5 }, { x: 5, y: 6 }, { x: 6, y: 5 },
      { x: 3, y: 7 }, { x: 4, y: 7 }, { x: 2, y: 5 },
      { x: 7, y: 2 }, { x: 8, y: 2 }, { x: 1, y: 8 },
      { x: 6, y: 8 }, { x: 7, y: 8 }, { x: 8, y: 8 }
    ],
    enemies: [
      { x: 7, y: 7, hp: 4, maxHp: 4, ranged: 1, range: 3 },
      { x: 1, y: 6, hp: 3, maxHp: 3, ranged: 1, range: 3 }
    ],
    healingSpots: [
      { x: 0, y: 5, heal: 3 },
      { x: 9, y: 4, heal: 3 }
    ]
  };

  function initCanvasSize() {
    // If width/height attributes are not set, set defaults that match CSS size if present.
    // Using clientWidth/clientHeight ensures TILE is integer-friendly.
    const defaultSize = 600;
    if (!canvas.width) canvas.width = canvas.clientWidth || defaultSize;
    if (!canvas.height) canvas.height = canvas.clientHeight || defaultSize;
    TILE = Math.floor(canvas.width / GRID_SIZE);
    // ensure TILE at least 8 px
    TILE = Math.max(TILE, 8);
  }

  function clearCanvas() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }

  function drawGrid() {
    clearCanvas();

    // Grid
    for (let y = 0; y < GRID_SIZE; y++) {
      for (let x = 0; x < GRID_SIZE; x++) {
        const odd = (x + y) % 2 === 1;
        ctx.fillStyle = odd ? '#0e1330' : '#0c122b';
        ctx.fillRect(x * TILE, y * TILE, TILE, TILE);
        ctx.strokeStyle = '#2a305e';
        ctx.strokeRect(x * TILE + 0.5, y * TILE + 0.5, TILE - 1, TILE - 1);
      }
    }

    // Walls
    state.walls.forEach(w => drawTile(w.x, w.y, '#2a305e'));

    // Healing spots
    state.healingSpots.forEach(h => drawTile(h.x, h.y, '#3ba55d'));

    // Enemies
    state.enemies.forEach(e => {
      drawCircle(e.x, e.y, '#ff6b6b');
      drawHP(e);
    });

    // Hero
    drawCircle(state.hero.x, state.hero.y, getMoveColor());
    drawHeroHP();
    drawMoveRange();
    drawHUD();
  }

  function drawTile(x, y, color) {
    ctx.fillStyle = color;
    ctx.fillRect(x * TILE, y * TILE, TILE, TILE);
  }

  function drawCircle(x, y, color) {
    const cx = x * TILE + TILE / 2;
    const cy = y * TILE + TILE / 2;
    const r = Math.max(4, TILE * 0.35);
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.fill();
  }

  function drawHP(entity) {
    // Draw a small health bar above the entity
    const e = entity || {};
    const maxHp = e.maxHp || e.hp || 1;
    const hp = Math.max(0, e.hp || 0);
    const barW = TILE * 0.8;
    const barH = Math.max(4, TILE * 0.12);
    const x = e.x * TILE + (TILE - barW) / 2;
    const y = e.y * TILE + TILE * 0.08;

    // Background
    ctx.fillStyle = '#444';
    ctx.fillRect(x, y, barW, barH);

    // Foreground (hp)
    const pct = Math.max(0, Math.min(1, hp / maxHp));
    ctx.fillStyle = '#ff6b6b';
    ctx.fillRect(x + 1, y + 1, (barW - 2) * pct, barH - 2);

    // Text
    ctx.fillStyle = '#fff';
    ctx.font = `${Math.max(10, Math.floor(barH))}px Segoe UI, Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`${hp}/${maxHp}`, x + barW / 2, y + barH / 2);
  }

  function drawHeroHP() {
    const h = state.hero;
    const barW = TILE * 2.5;
    const barH = Math.max(10, TILE * 0.18);
    const x = 8;
    const y = canvas.height - barH - 8;

    ctx.fillStyle = '#222';
    ctx.fillRect(x, y, barW, barH);

    const pct = Math.max(0, Math.min(1, (h.hp || 0) / (h.maxHp || 1)));
    ctx.fillStyle = '#4dd0e1';
    ctx.fillRect(x + 2, y + 2, (barW - 4) * pct, barH - 4);

    ctx.fillStyle = '#fff';
    ctx.font = `${Math.max(12, Math.floor(barH * 0.7))}px Segoe UI, Arial`;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(`HP: ${h.hp}/${h.maxHp}`, x + 8, y + barH / 2);
  }

  function getMoveColor() {
    // Different color if damaged
    return state.hero.hp < state.hero.maxHp ? '#5ab1ff' : '#00c0a3';
  }

  function inBounds(x, y) {
    return x >= 0 && x < GRID_SIZE && y >= 0 && y < GRID_SIZE;
  }

  function isWall(x, y) {
    return state.walls.some(w => w.x === x && w.y === y);
  }

  function isEnemy(x, y) {
    return state.enemies.some(e => e.x === x && e.y === y);
  }

  function drawMoveRange() {
    // highlight tiles hero can move to (Manhattan distance)
    const m = state.hero.moves || 0;
    const hx = state.hero.x;
    const hy = state.hero.y;
    ctx.globalAlpha = 0.25;
    for (let y = 0; y < GRID_SIZE; y++) {
      for (let x = 0; x < GRID_SIZE; x++) {
        const dist = Math.abs(x - hx) + Math.abs(y - hy);
        if (dist <= m && !isWall(x, y) && !isEnemy(x, y)) {
          ctx.fillStyle = '#00c0a3';
          ctx.fillRect(x * TILE, y * TILE, TILE, TILE);
        }
      }
    }
    ctx.globalAlpha = 1;
  }

  function drawHUD() {
    // Minimal HUD (turn and controls)
    const pad = 8;
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    const w = 160;
    const h = 48;
    ctx.fillRect(canvas.width - w - pad, pad, w, h);

    ctx.fillStyle = '#fff';
    ctx.font = '14px Segoe UI, Arial';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText(`Turn: ${state.turn}`, canvas.width - w + 10 - pad, pad + 8);
    ctx.fillText(`Moves: ${state.hero.moves}`, canvas.width - w + 10 - pad, pad + 26);
  }

  function tileFromPixel(px, py) {
    const rect = canvas.getBoundingClientRect();
    const x = Math.floor((px - rect.left) / TILE);
    const y = Math.floor((py - rect.top) / TILE);
    return { x, y };
  }

  function handleMoveTo(x, y) {
    if (!inBounds(x, y)) return;
    if (isWall(x, y)) return;
    if (isEnemy(x, y)) return;

    const dist = Math.abs(state.hero.x - x) + Math.abs(state.hero.y - y);
    if (dist > state.hero.moves) return;

    state.hero.x = x;
    state.hero.y = y;
    // Apply healing if on healing spot
    state.healingSpots.forEach(h => {
      if (h.x === x && h.y === y) {
        state.hero.hp = Math.min(state.hero.maxHp, state.hero.hp + (h.heal || 0));
      }
    });
    // simple turn increment
    state.turn += 1;
    drawGrid();
  }

  canvas.addEventListener('click', (ev) => {
    const { x, y } = tileFromPixel(ev.clientX, ev.clientY);
    handleMoveTo(x, y);
  });

  // Initialize and start
  function start() {
    initCanvasSize();
    drawGrid();
  }

  // Recompute TILE on window resize (optional)
  window.addEventListener('resize', () => {
    // try to preserve CSS sizing if any
    initCanvasSize();
    drawGrid();
  });

  // Start once DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
  } else {
    start();
  }
}
