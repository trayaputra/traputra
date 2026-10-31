const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Game variables
const gridSize = 20;
const tileCount = 16;
let snake = [{ x: 8, y: 8 }];
let food = { x: 12, y: 12 };
let direction = { x: 1, y: 0 };
let nextDirection = { x: 1, y: 0 };
let score = 0;
let highScore = localStorage.getItem('snakeHighScore') || 0;
let gameRunning = false;
let gamePaused = false;
let gameSpeed = 100;
let lastMoveTime = 0;
let lastFrameTime = 0;

// Animation variables
let snakePositions = [{ x: 8, y: 8 }]; // Smooth positions for rendering
let foodPosition = { x: 12, y: 12 };

// DOM elements
const scoreDisplay = document.getElementById('score');
const highScoreDisplay = document.getElementById('highScore');
const gameStatusDisplay = document.getElementById('gameStatus');
const startBtn = document.getElementById('startBtn');
const pauseBtn = document.getElementById('pauseBtn');
const resetBtn = document.getElementById('resetBtn');

// Mobile controls
const upBtn = document.getElementById('upBtn');
const downBtn = document.getElementById('downBtn');
const leftBtn = document.getElementById('leftBtn');
const rightBtn = document.getElementById('rightBtn');

// Initialize
highScoreDisplay.textContent = highScore;

// Event listeners
startBtn.addEventListener('click', startGame);
pauseBtn.addEventListener('click', togglePause);
resetBtn.addEventListener('click', resetGame);

// Keyboard controls
document.addEventListener('keydown', handleKeyPress);

// Mobile button controls
upBtn.addEventListener('click', () => changeDirection(0, -1));
downBtn.addEventListener('click', () => changeDirection(0, 1));
leftBtn.addEventListener('click', () => changeDirection(-1, 0));
rightBtn.addEventListener('click', () => changeDirection(1, 0));

function handleKeyPress(e) {
    if (!gameRunning || gamePaused) return;
    
    switch(e.key) {
        case 'ArrowUp':
            e.preventDefault();
            changeDirection(0, -1);
            break;
        case 'ArrowDown':
            e.preventDefault();
            changeDirection(0, 1);
            break;
        case 'ArrowLeft':
            e.preventDefault();
            changeDirection(-1, 0);
            break;
        case 'ArrowRight':
            e.preventDefault();
            changeDirection(1, 0);
            break;
    }
}

function changeDirection(x, y) {
    // Prevent reversing into itself
    if (nextDirection.x === -x && nextDirection.y === -y) return;
    nextDirection = { x, y };
}

function startGame() {
    if (gameRunning) return;
    gameRunning = true;
    gamePaused = false;
    startBtn.disabled = true;
    pauseBtn.disabled = false;
    gameStatusDisplay.textContent = 'Game started!';
    lastMoveTime = Date.now();
    lastFrameTime = Date.now();
    requestAnimationFrame(gameLoop);
}

function togglePause() {
    if (!gameRunning) return;
    
    gamePaused = !gamePaused;
    if (gamePaused) {
        pauseBtn.textContent = 'Resume';
        gameStatusDisplay.textContent = 'Game paused';
    } else {
        pauseBtn.textContent = 'Pause';
        gameStatusDisplay.textContent = '';
        lastMoveTime = Date.now();
        lastFrameTime = Date.now();
        requestAnimationFrame(gameLoop);
    }
}

function resetGame() {
    gameRunning = false;
    gamePaused = false;
    
    snake = [{ x: 8, y: 8 }];
    snakePositions = [{ x: 8, y: 8 }];
    food = generateFood();
    foodPosition = { ...food };
    direction = { x: 1, y: 0 };
    nextDirection = { x: 1, y: 0 };
    score = 0;
    
    startBtn.disabled = false;
    pauseBtn.disabled = true;
    pauseBtn.textContent = 'Pause';
    scoreDisplay.textContent = score;
    gameStatusDisplay.textContent = 'Game reset';
    
    draw();
}

function generateFood() {
    let newFood;
    let foodOnSnake;
    
    do {
        foodOnSnake = false;
        newFood = {
            x: Math.floor(Math.random() * tileCount),
            y: Math.floor(Math.random() * tileCount)
        };
        
        for (let segment of snake) {
            if (segment.x === newFood.x && segment.y === newFood.y) {
                foodOnSnake = true;
                break;
            }
        }
    } while (foodOnSnake);
    
    return newFood;
}

function update() {
    direction = nextDirection;
    
    // Calculate new head position
    const head = { x: snake[0].x + direction.x, y: snake[0].y + direction.y };
    
    // Check wall collision
    if (head.x < 0 || head.x >= tileCount || head.y < 0 || head.y >= tileCount) {
        endGame('Hit the wall!');
        return;
    }
    
    // Check self collision
    for (let segment of snake) {
        if (head.x === segment.x && head.y === segment.y) {
            endGame('Hit yourself!');
            return;
        }
    }
    
    snake.unshift(head);
    
    // Check food collision
    if (head.x === food.x && head.y === food.y) {
        score += 10;
        scoreDisplay.textContent = score;
        food = generateFood();
        foodPosition = { ...food };
        
        // Increase difficulty
        if (score % 50 === 0 && gameSpeed > 50) {
            gameSpeed -= 5;
        }
    } else {
        snake.pop();
    }
}

function endGame(message) {
    gameRunning = false;
    gamePaused = false;
    
    if (score > highScore) {
        highScore = score;
        localStorage.setItem('snakeHighScore', highScore);
        highScoreDisplay.textContent = highScore;
        gameStatusDisplay.textContent = `Game Over! ${message} New High Score: ${score}`;
    } else {
        gameStatusDisplay.textContent = `Game Over! ${message} Score: ${score}`;
    }
    
    startBtn.disabled = false;
    pauseBtn.disabled = true;
    pauseBtn.textContent = 'Pause';
    
    draw();
}

function interpolatePositions(progress) {
    // Smooth positions untuk rendering
    snakePositions = snake.map(segment => ({
        x: segment.x - direction.x * (1 - progress),
        y: segment.y - direction.y * (1 - progress)
    }));
    
    // Smooth food position
    foodPosition = {
        x: food.x,
        y: food.y
    };
}

function drawHead(x, y, dirX, dirY) {
    const centerX = x * gridSize + gridSize / 2;
    const centerY = y * gridSize + gridSize / 2;
    const headRadius = gridSize / 2 - 2;
    
    // Draw head body (lebih terang hijau)
    ctx.fillStyle = '#00ff00';
    ctx.shadowColor = '#00ff00';
    ctx.shadowBlur = 15;
    ctx.beginPath();
    ctx.arc(centerX, centerY, headRadius, 0, Math.PI * 2);
    ctx.fill();
    
    // Draw mata berdasarkan arah
    ctx.shadowColor = 'transparent';
    ctx.fillStyle = '#ffffff';
    
    let eyeOffsetX = 0;
    let eyeOffsetY = 0;
    
    if (dirX === 1) eyeOffsetX = 4;      // Ke kanan
    else if (dirX === -1) eyeOffsetX = -4; // Ke kiri
    else if (dirY === 1) eyeOffsetY = 4;   // Ke bawah
    else if (dirY === -1) eyeOffsetY = -4; // Ke atas
    
    // Mata kiri
    ctx.beginPath();
    ctx.arc(centerX - 3 + eyeOffsetX, centerY - 3 + eyeOffsetY, 1.5, 0, Math.PI * 2);
    ctx.fill();
    
    // Mata kanan
    ctx.beginPath();
    ctx.arc(centerX + 3 + eyeOffsetX, centerY - 3 + eyeOffsetY, 1.5, 0, Math.PI * 2);
    ctx.fill();
    
    // Pupil (hitam kecil di mata)
    ctx.fillStyle = '#000000';
    ctx.beginPath();
    ctx.arc(centerX - 3 + eyeOffsetX, centerY - 3 + eyeOffsetY, 0.8, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.beginPath();
    ctx.arc(centerX + 3 + eyeOffsetX, centerY - 3 + eyeOffsetY, 0.8, 0, Math.PI * 2);
    ctx.fill();
}

function draw() {
    // Clear canvas
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw grid (optional)
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 0.5;
    for (let i = 0; i <= tileCount; i++) {
        ctx.beginPath();
        ctx.moveTo(i * gridSize, 0);
        ctx.lineTo(i * gridSize, canvas.height);
        ctx.stroke();
        
        ctx.beginPath();
        ctx.moveTo(0, i * gridSize);
        ctx.lineTo(canvas.width, i * gridSize);
        ctx.stroke();
    }
    
    // Draw snake body dan head
    snakePositions.forEach((segment, index) => {
        if (index === 0) {
            // Head dengan mata
            drawHead(segment.x, segment.y, direction.x, direction.y);
        } else {
            // Body
            ctx.fillStyle = '#00cc00';
            ctx.shadowColor = '#00cc00';
            ctx.shadowBlur = 5;
            ctx.fillRect(segment.x * gridSize + 1, segment.y * gridSize + 1, gridSize - 2, gridSize - 2);
        }
    });
    ctx.shadowColor = 'transparent';
    
    // Draw food
    ctx.fillStyle = '#ff4444';
    ctx.shadowColor = '#ff4444';
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.arc(foodPosition.x * gridSize + gridSize / 2, foodPosition.y * gridSize + gridSize / 2, gridSize / 2 - 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowColor = 'transparent';
}

function gameLoop(currentTime) {
    if (!gameRunning) return;
    if (gamePaused) {
        requestAnimationFrame(gameLoop);
        return;
    }
    
    const deltaTime = currentTime - lastFrameTime;
    lastFrameTime = currentTime;
    
    const timeSinceLastMove = currentTime - lastMoveTime;
    const moveProgress = Math.min(timeSinceLastMove / gameSpeed, 1);
    
    // Update game logic ketika waktu mencukupi
    if (timeSinceLastMove >= gameSpeed) {
        update();
        lastMoveTime = currentTime;
    }
    
    // Interpolate posisi untuk smooth rendering
    interpolatePositions(moveProgress);
    
    // Draw
    draw();
    
    requestAnimationFrame(gameLoop);
}

// Initial draw
draw();
