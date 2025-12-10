// Legends & Misfits: tactics prototype with healing spots
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

const GRID_SIZE = 10;
const TILE = canvas.width / GRID_SIZE;

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
    { x: 7, y: 7, hp: 4, ranged: 1, range: 3 },
    { x: 1, y: 6, hp: 3, ranged: 1, range: 3 }
  ],
  healingSpots: [
    { x: 0, y: 5, heal: 3 },
    { x: 9, y: 4, heal: 3 }
  ]
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
      ctx.strokeRect(x * TILE, y * TILE, TILE, TILE);
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
  const r = TILE * 0.35;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();
}

function drawHP(enemy) {
  ctx.fillStyle = '#fff';
  ctx.font = '14px Segoe UI';
  ctx.fillText(`HP:${enemy.hp}`, enemy.x * TILE + 5, enemy.y * TILE + 15);
}

function drawHeroHP() {
  ctx.fillStyle = '#ffcc4d';
  ctx.font = '16px Segoe UI';
  ctx.fillText(`Hero HP:${state.hero.hp}/${state.hero.maxHp}`, 10, 40);
}

function drawHUD() {
  const text = `Turn ${state.turn} • Moves: ${state.hero.moves}`;
  ctx.fillStyle = '#e6e9ff';
  ctx.font = '16px Segoe UI';
  ctx.fillText(text, 10, 20);
}

function getMoveColor() {
  return state.hero.moves > 0 ? '#58e0ff' : '#ff6b6b';
}

function drawMoveRange() {
  const { x, y, moves } = state.hero;
  ctx.strokeStyle = 'rgba(120,170,255,0.4)';
  ctx.lineWidth = 2;
  ctx.strokeRect((x - moves) * TILE, (y - moves) * TILE, (moves * 2 + 1) * TILE, (moves * 2 + 1) * TILE);
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
    checkHealingSpot();
    drawGrid();
  }
}

// Healing spot check
function checkHealingSpot() {
  const { x, y } = state.hero;
  state.healingSpots.forEach((h, i) => {
    if (h.x === x && h.y === y) {
      state.hero.hp = Math.min(state.hero.maxHp, state.hero.hp + h.heal);
      state.healingSpots.splice(i, 1); // remove after use
    }
  });
}

// Melee attack
function attack() {
  const { x, y, attack } = state.hero;
  state.enemies.forEach((e, i) => {
    const dist = Math.abs(e.x - x) + Math.abs(e.y - y);
    if (dist === 1) {
      e.hp -= attack;
      if (e.hp <= 0) state.enemies.splice(i, 1);
    }
  });
  drawGrid();
}

// Ranged attack
function rangedAttack() {
  if (state.hero.moves <= 0) return;
  const { x, y, ranged, range } = state.hero;
  state.enemies.forEach((e, i) => {
    const dx = e.x - x;
    const dy = e.y - y;
    const dist = Math.abs(dx) + Math.abs(dy);

    if (dist <= range && hasLineOfSight(x, y, e.x, e.y)) {
      e.hp -= ranged;
      state.hero.moves -= 1;
      if (e.hp <= 0) state.enemies.splice(i, 1);
    }
  });
  drawGrid();
}

// Line-of-sight check
function hasLineOfSight(x1, y1, x2, y2) {
  if (x1 === x2) {
    const step = y2 > y1 ? 1 : -1;
    for (let y = y1 + step; y !== y2; y += step) {
      if (isBlocked(x1, y)) return false;
    }
  } else if (y1 === y2) {
    const step = x2 > x1 ? 1 : -1;
    for (let x = x1 + step; x !== x2; x += step) {
      if (isBlocked(x, y1)) return false;
    }
  }
  return true;
}

// Enemy AI
function enemyTurn() {
  state.enemies.forEach((e, i) => {
    const dx = state.hero.x - e.x;
    const dy = state.hero.y - e.y;
    const dist = Math.abs(dx) + Math.abs(dy);

    if (dist <= e.range && hasLineOfSight(e.x, e.y, state.hero.x, state.hero.y)) {
      state.hero.hp -= e.ranged;
      if (state.hero.hp <= 0) {
        alert("Game Over! The hero has fallen.");
        state.hero.hp = 0;
      }
    } else {
      const mx = Math.sign(dx);
      const my = Math.sign(dy);
      const nx = e.x + mx;
      const ny = e.y + my;
      if (!isBlocked(nx, ny)) {
        e.x = nx;
        e.y = ny;
      }
    }
  });
}

// Enemy spawning
function spawnEnemies() {
  const spawnChance = 0.3;
  if (Math.random() < spawnChance) {
    const spawnPoints = [
      { x: 0, y: 0 }, { x: 9, y: 0 },
      { x: 
