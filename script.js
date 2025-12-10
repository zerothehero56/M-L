// Legends & Misfits: tiny tactics grid prototype
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

const GRID_SIZE = 10;        // 10x10 grid
const TILE = canvas.width / GRID_SIZE;

const state = {
  turn: 1,
  hero: { x: 2, y: 2, moves: 3 },
  walls: [
    { x: 5, y: 5 }, { x: 5, y: 6 }, { x: 6, y: 5 },
    { x: 3, y: 7 }, { x: 4, y: 7 },
  ],
  enemies: [{ x: 7, y: 7 }],
};

function drawGrid() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Grid
  for (let y = 0; y < GRID_SIZE; y++) {
    for (let x = 0; x < GRID_SIZE; x++) {
      const odd = (x + y) % 2 === 1;
      ctx.fillStyle = odd ? '#0e1330' : '#0c122b';
      ctx.fillRect(x * TILE, y * TILE, TILE, TILE);
      ctx.strokeStyle = '#2a305e';
      ctx.lineWidth = 1;
      ctx.strokeRect(x * TILE, y * TILE, TILE, TILE);
    }
  }

  // Walls
  state.walls.forEach(w => {
    drawTile(w.x, w.y, '#2a305e');
  });

  // Enemies
  state.enemies.forEach(e => {
    drawCircle(e.x, e.y, '#ff6b6b');
  });

  // Hero + move hints
  drawCircle(state.hero.x, state.hero.y, getMoveColor());
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
  const r = TILE * 0.35;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.shadowColor = color;
  ctx.shadowBlur = 16;
  ctx.fill();
  ctx.shadowBlur = 0;
}

function drawHUD() {
  const pad = 10;
  const text = `Turn ${state.turn} • Moves: ${state.hero.moves}`;
  ctx.fillStyle = 'rgba(26,31,61,0.8)';
  ctx.fillRect(pad, pad, ctx.measureText(text).width + 20, 32);
  ctx.fillStyle = '#e6e9ff';
  ctx.font = '16px Segoe UI';
  ctx.fillText(text, pad + 10, pad + 22);
}

function getMoveColor() {
  const m = state.hero.moves;
  if (m >= 3) return '#58e0ff';
  if (m === 2) return '#79ffa7';
  if (m === 1) return '#ffcc4d';
  return '#ff6b6b';
}

function drawMoveRange() {
  const { x, y, moves } = state.hero;
  ctx.strokeStyle = 'rgba(120,170,255,0.4)';
  ctx.lineWidth = 3;
  ctx.setLineDash([6, 6]);
  ctx.strokeRect((x - moves) * TILE, (y - moves) * TILE, (moves * 2 + 1) * TILE, (moves * 2 + 1) * TILE);
  ctx.setLineDash([]);
}

function isBlocked(nx, ny) {
  if (nx < 0 || ny < 0 || nx >= GRID_SIZE || ny >= GRID_SIZE) return true;
  return state.walls.some(w => w.x === nx && w.y === ny);
}

function tryMove(dx, dy) {
  if (state.hero.moves <= 0) return;
  const nx = state.hero.x + dx;
  const ny = state.hero.y + dy;
  if (!isBlocked(nx, ny)) {
    state.hero.x = nx;
    state.hero.y = ny;
    state.hero.moves -= 1;
    drawGrid();
  }
}

function endTurn() {
  state.turn += 1;
  state.hero.moves = 3; // reset moves
  // Simple enemy "AI": step closer if not blocked
  state.enemies = state.enemies.map(e => {
    const dx = Math.sign(state.hero.x - e.x);
    const dy = Math.sign(state.hero.y - e.y);
    const nx = e.x + dx;
    const ny = e.y + dy;
    return isBlocked(nx, ny) ? e : { x: nx, y: ny };
  });
  drawGrid();
}

window.addEventListener('keydown', (e) => {
  switch (e.key) {
    case 'ArrowUp':    tryMove(0, -1); break;
    case 'ArrowDown':  tryMove(0,  1); break;
    case 'ArrowLeft':  tryMove(-1, 0); break;
    case 'ArrowRight': tryMove( 1, 0); break;
    case ' ':          endTurn(); break; // Space
  }
});

drawGrid();
