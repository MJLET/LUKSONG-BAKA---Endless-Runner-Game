const runner = document.getElementById("runner");
const obstaclesRoot = document.getElementById("obstacles");
const scoreEl = document.getElementById("score");
const gameOverEl = document.getElementById("gameOver");
const finalScoreEl = document.getElementById("finalScore");
const restartBtn = document.getElementById("restart");
const startScreen = document.getElementById("startScreen");
const startBtn = document.getElementById("startBtn");

// Create high score element
const highScoreEl = document.createElement("div");
highScoreEl.id = "highScore";
document.querySelector(".game").appendChild(highScoreEl);

// Load high score from localStorage
let highScore = localStorage.getItem("luksongBakaHighScore") || 0;
highScoreEl.textContent = "High: " + highScore;

let score = 0;
let running = false;

// Physics
const groundY = 40;
const maxY = 180;
let runnerY = groundY;
let velocityY = 0;
const jumpForce = 14;
const gravity = -0.8;
let isOnGround = true;

let obstacles = [];
let speed = 6;
let frame = 0;
let rafId = null;
let nextSpawn = 100;
let lastObstacleX = 800;

function resetGame() {
  score = 0;
  speed = 6;
  obstacles = [];
  frame = 0;
  nextSpawn = 100;
  velocityY = 0;
  runnerY = groundY;
  isOnGround = true;
  runner.style.bottom = runnerY + "px";
  obstaclesRoot.innerHTML = "";
  scoreEl.textContent = score;
  finalScoreEl.textContent = 0;
  lastObstacleX = 800;

  // Reset game container to 400px for start screen
  document.querySelector(".game").style.height = "400px";
}

function startGame() {
  if (running) return;
  resetGame();
  running = true;

  // Shrink game container to 300px for gameplay
  document.querySelector(".game").style.height = "300px";

  startScreen.classList.add("hidden");
  gameOverEl.classList.add("hidden");
  rafId = requestAnimationFrame(update);
}

function gameOver() {
  if (!running) return;
  running = false;
  if (rafId) cancelAnimationFrame(rafId);
  finalScoreEl.textContent = score;
  gameOverEl.classList.remove("hidden");
}

function jump() {
  if (!running) return;
  if (isOnGround) {
    velocityY = jumpForce;
    isOnGround = false;
  }
}

function updatePlayer() {
  velocityY += gravity;
  runnerY += velocityY;

  if (runnerY > maxY) velocityY = 0, runnerY = maxY;
  if (runnerY <= groundY) velocityY = 0, runnerY = groundY, isOnGround = true;

  runner.style.bottom = Math.round(runnerY) + "px";
}

function spawnObstacle() {
  let doubleChance = score >= 10 ? Math.min(0.02 + (score - 10) * 0.003, 0.3) : 0;
  const numCows = Math.random() < doubleChance ? 2 : 1;

  let minSpacing = 200 + speed * 10;
  let startX = Math.max(lastObstacleX + minSpacing, 800);

  const groupId = Date.now();
  for (let i = 0; i < numCows; i++) {
    const cow = document.createElement("div");
    cow.className = "obstacle";
    cow.textContent = "🐄";
    cow.style.left = startX + i * 40 + "px"; // cows next to each other
    cow.dataset.group = groupId;
    obstaclesRoot.appendChild(cow);
    obstacles.push(cow);
  }

  lastObstacleX = startX + (numCows - 1) * 40;
}

function updateObstacles() {
  for (let i = obstacles.length - 1; i >= 0; i--) {
    const o = obstacles[i];
    let x = parseFloat(o.style.left) || 800;
    x -= speed;
    o.style.left = x + "px";

    if (x < -60) {
      const groupId = o.dataset.group;
      const isFirstCow = i === 0 || obstacles[i - 1].dataset.group !== groupId;

      if (isFirstCow) {
        score++;
        scoreEl.textContent = score;

        // Update high score
        if (score > highScore) {
          highScore = score;
          localStorage.setItem("luksongBakaHighScore", highScore);
          highScoreEl.textContent = "High: " + highScore;
        }

        if (score % 10 === 0) speed += 0.2;
      }

      o.remove();
      obstacles.splice(i, 1);
    } else {
      const rRect = runner.getBoundingClientRect();
      const oRect = o.getBoundingClientRect();
      const cowHitbox = { left: oRect.left + 10, right: oRect.right - 10, top: oRect.top + 10, bottom: oRect.bottom };

      if (rRect.right > cowHitbox.left && rRect.left < cowHitbox.right && rRect.bottom > cowHitbox.top) {
        gameOver();
        return;
      }
    }
  }
}

function update() {
  if (!running) return;
  updatePlayer();

  if (frame >= nextSpawn) {
    spawnObstacle();
    nextSpawn = frame + Math.floor(80 + Math.random() * 60);
  }

  updateObstacles();
  frame++;
  rafId = requestAnimationFrame(update);
}

// Event listeners
window.addEventListener("keydown", e => { if (e.code === "Space") { e.preventDefault(); if (running) jump(); } });
window.addEventListener("touchstart", e => { e.preventDefault(); if (running) jump(); }, { passive: false });
startBtn.addEventListener("click", startGame);
restartBtn.addEventListener("click", startGame);

// Initialize game
resetGame();
