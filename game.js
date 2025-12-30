// 游戏配置
const COLS = 10;
const ROWS = 20;
const BLOCK_SIZE = 30;

// 获取画布和上下文
const canvas = document.getElementById('gameBoard');
const ctx = canvas.getContext('2d');
const nextCanvas = document.getElementById('nextPiece');
const nextCtx = nextCanvas.getContext('2d');

// 游戏状态
let board = [];
let currentPiece = null;
let nextPieceType = null;
let score = 0;
let level = 1;
let lines = 0;
let gameLoop = null;
let isPaused = false;
let isGameOver = false;
let gameStarted = false;

// 方块形状定义
const PIECES = [
    { // I
        shape: [
            [[0,0,0,0], [1,1,1,1], [0,0,0,0], [0,0,0,0]],
            [[0,0,1,0], [0,0,1,0], [0,0,1,0], [0,0,1,0]],
            [[0,0,0,0], [0,0,0,0], [1,1,1,1], [0,0,0,0]],
            [[0,1,0,0], [0,1,0,0], [0,1,0,0], [0,1,0,0]]
        ],
        color: '#00f5ff'
    },
    { // O
        shape: [
            [[1,1], [1,1]],
            [[1,1], [1,1]],
            [[1,1], [1,1]],
            [[1,1], [1,1]]
        ],
        color: '#ffeb3b'
    },
    { // T
        shape: [
            [[0,1,0], [1,1,1], [0,0,0]],
            [[0,1,0], [0,1,1], [0,1,0]],
            [[0,0,0], [1,1,1], [0,1,0]],
            [[0,1,0], [1,1,0], [0,1,0]]
        ],
        color: '#e040fb'
    },
    { // S
        shape: [
            [[0,1,1], [1,1,0], [0,0,0]],
            [[0,1,0], [0,1,1], [0,0,1]],
            [[0,0,0], [0,1,1], [1,1,0]],
            [[1,0,0], [1,1,0], [0,1,0]]
        ],
        color: '#76ff03'
    },
    { // Z
        shape: [
            [[1,1,0], [0,1,1], [0,0,0]],
            [[0,0,1], [0,1,1], [0,1,0]],
            [[0,0,0], [1,1,0], [0,1,1]],
            [[0,1,0], [1,1,0], [1,0,0]]
        ],
        color: '#ff5252'
    },
    { // J
        shape: [
            [[1,0,0], [1,1,1], [0,0,0]],
            [[0,1,1], [0,1,0], [0,1,0]],
            [[0,0,0], [1,1,1], [0,0,1]],
            [[0,1,0], [0,1,0], [1,1,0]]
        ],
        color: '#448aff'
    },
    { // L
        shape: [
            [[0,0,1], [1,1,1], [0,0,0]],
            [[0,1,0], [0,1,0], [0,1,1]],
            [[0,0,0], [1,1,1], [1,0,0]],
            [[1,1,0], [0,1,0], [0,1,0]]
        ],
        color: '#ff9800'
    }
];

// 初始化游戏板
function initBoard() {
    board = Array(ROWS).fill().map(() => Array(COLS).fill(0));
}

// 创建新方块
function createPiece(type) {
    const piece = PIECES[type];
    return {
        shape: piece.shape,
        color: piece.color,
        x: Math.floor(COLS / 2) - Math.floor(piece.shape[0][0].length / 2),
        y: 0,
        rotation: 0
    };
}

// 生成随机方块
function randomPiece() {
    const type = Math.floor(Math.random() * PIECES.length);
    return createPiece(type);
}

// 绘制方块
function drawBlock(ctx, x, y, color) {
    ctx.fillStyle = color;
    ctx.fillRect(x * BLOCK_SIZE, y * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);

    // 添加高光和阴影效果
    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.fillRect(x * BLOCK_SIZE, y * BLOCK_SIZE, BLOCK_SIZE, 4);
    ctx.fillRect(x * BLOCK_SIZE, y * BLOCK_SIZE, 4, BLOCK_SIZE);

    ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
    ctx.fillRect(x * BLOCK_SIZE, y * BLOCK_SIZE + BLOCK_SIZE - 4, BLOCK_SIZE, 4);
    ctx.fillRect(x * BLOCK_SIZE + BLOCK_SIZE - 4, y * BLOCK_SIZE, 4, BLOCK_SIZE);

    // 边框
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.strokeRect(x * BLOCK_SIZE, y * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
}

// 绘制游戏板
function drawBoard() {
    // 清空画布
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 绘制网格
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
    for (let i = 0; i <= COLS; i++) {
        ctx.beginPath();
        ctx.moveTo(i * BLOCK_SIZE, 0);
        ctx.lineTo(i * BLOCK_SIZE, canvas.height);
        ctx.stroke();
    }
    for (let i = 0; i <= ROWS; i++) {
        ctx.beginPath();
        ctx.moveTo(0, i * BLOCK_SIZE);
        ctx.lineTo(canvas.width, i * BLOCK_SIZE);
        ctx.stroke();
    }

    // 绘制已固定的方块
    for (let row = 0; row < ROWS; row++) {
        for (let col = 0; col < COLS; col++) {
            if (board[row][col]) {
                drawBlock(ctx, col, row, board[row][col]);
            }
        }
    }

    // 绘制当前方块
    if (currentPiece) {
        const shape = currentPiece.shape[currentPiece.rotation];
        for (let row = 0; row < shape.length; row++) {
            for (let col = 0; col < shape[row].length; col++) {
                if (shape[row][col]) {
                    drawBlock(ctx, currentPiece.x + col, currentPiece.y + row, currentPiece.color);
                }
            }
        }
    }
}

// 绘制下一个方块
function drawNextPiece() {
    nextCtx.fillStyle = '#1a1a2e';
    nextCtx.fillRect(0, 0, nextCanvas.width, nextCanvas.height);

    if (nextPieceType !== null) {
        const piece = PIECES[nextPieceType];
        const shape = piece.shape[0];
        const offsetX = (4 - shape[0].length) / 2;
        const offsetY = (4 - shape.length) / 2;

        for (let row = 0; row < shape.length; row++) {
            for (let col = 0; col < shape[row].length; col++) {
                if (shape[row][col]) {
                    nextCtx.fillStyle = piece.color;
                    nextCtx.fillRect((offsetX + col) * 30, (offsetY + row) * 30, 30, 30);

                    nextCtx.fillStyle = 'rgba(255, 255, 255, 0.3)';
                    nextCtx.fillRect((offsetX + col) * 30, (offsetY + row) * 30, 30, 4);
                    nextCtx.fillRect((offsetX + col) * 30, (offsetY + row) * 30, 4, 30);

                    nextCtx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
                    nextCtx.strokeRect((offsetX + col) * 30, (offsetY + row) * 30, 30, 30);
                }
            }
        }
    }
}

// 检查碰撞
function checkCollision(piece, newX, newY, newRotation) {
    const shape = piece.shape[newRotation];
    for (let row = 0; row < shape.length; row++) {
        for (let col = 0; col < shape[row].length; col++) {
            if (shape[row][col]) {
                const boardX = newX + col;
                const boardY = newY + row;

                if (boardX < 0 || boardX >= COLS || boardY >= ROWS) {
                    return true;
                }

                if (boardY >= 0 && board[boardY][boardX]) {
                    return true;
                }
            }
        }
    }
    return false;
}

// 固定方块到游戏板
function lockPiece() {
    const shape = currentPiece.shape[currentPiece.rotation];
    for (let row = 0; row < shape.length; row++) {
        for (let col = 0; col < shape[row].length; col++) {
            if (shape[row][col]) {
                const boardY = currentPiece.y + row;
                const boardX = currentPiece.x + col;
                if (boardY >= 0) {
                    board[boardY][boardX] = currentPiece.color;
                }
            }
        }
    }

    clearLines();
    spawnPiece();
}

// 消除完整的行
function clearLines() {
    let linesCleared = 0;

    for (let row = ROWS - 1; row >= 0; row--) {
        if (board[row].every(cell => cell !== 0)) {
            board.splice(row, 1);
            board.unshift(Array(COLS).fill(0));
            linesCleared++;
            row++;
        }
    }

    if (linesCleared > 0) {
        lines += linesCleared;
        score += linesCleared * 100 * level;
        level = Math.floor(lines / 10) + 1;
        updateStats();
        updateSpeed();
    }
}

// 生成新方块
function spawnPiece() {
    if (nextPieceType === null) {
        nextPieceType = Math.floor(Math.random() * PIECES.length);
    }

    currentPiece = createPiece(nextPieceType);
    nextPieceType = Math.floor(Math.random() * PIECES.length);
    drawNextPiece();

    if (checkCollision(currentPiece, currentPiece.x, currentPiece.y, currentPiece.rotation)) {
        gameOver();
    }
}

// 更新统计信息
function updateStats() {
    document.getElementById('score').textContent = score;
    document.getElementById('level').textContent = level;
    document.getElementById('lines').textContent = lines;
}

// 更新下落速度
function updateSpeed() {
    if (gameLoop) {
        clearInterval(gameLoop);
        const speed = Math.max(100, 1000 - (level - 1) * 100);
        gameLoop = setInterval(moveDown, speed);
    }
}

// 方块下落
function moveDown() {
    if (!gameStarted || isPaused || isGameOver) return;

    if (!checkCollision(currentPiece, currentPiece.x, currentPiece.y + 1, currentPiece.rotation)) {
        currentPiece.y++;
        drawBoard();
    } else {
        lockPiece();
        drawBoard();
    }
}

// 移动方块
function movePiece(dir) {
    if (!gameStarted || isPaused || isGameOver) return;

    const newX = currentPiece.x + dir;
    if (!checkCollision(currentPiece, newX, currentPiece.y, currentPiece.rotation)) {
        currentPiece.x = newX;
        drawBoard();
    }
}

// 旋转方块
function rotatePiece() {
    if (!gameStarted || isPaused || isGameOver) return;

    const newRotation = (currentPiece.rotation + 1) % 4;
    if (!checkCollision(currentPiece, currentPiece.x, currentPiece.y, newRotation)) {
        currentPiece.rotation = newRotation;
        drawBoard();
    }
}

// 快速下落
function hardDrop() {
    if (!gameStarted || isPaused || isGameOver) return;

    while (!checkCollision(currentPiece, currentPiece.x, currentPiece.y + 1, currentPiece.rotation)) {
        currentPiece.y++;
        score += 2;
    }
    lockPiece();
    updateStats();
    drawBoard();
}

// 暂停游戏
function togglePause() {
    if (!gameStarted || isGameOver) return;
    isPaused = !isPaused;
}

// 游戏结束
function gameOver() {
    isGameOver = true;
    clearInterval(gameLoop);
    document.getElementById('finalScore').textContent = score;
    document.getElementById('gameOver').classList.remove('hidden');
}

// 开始游戏
function startGame() {
    initBoard();
    score = 0;
    level = 1;
    lines = 0;
    isPaused = false;
    isGameOver = false;
    gameStarted = true;
    nextPieceType = null;

    document.getElementById('gameOver').classList.add('hidden');
    updateStats();
    spawnPiece();
    drawBoard();

    if (gameLoop) clearInterval(gameLoop);
    gameLoop = setInterval(moveDown, 1000);
}

// 键盘控制
document.addEventListener('keydown', (e) => {
    if (!gameStarted) return;

    switch(e.key) {
        case 'ArrowLeft':
            e.preventDefault();
            movePiece(-1);
            break;
        case 'ArrowRight':
            e.preventDefault();
            movePiece(1);
            break;
        case 'ArrowDown':
            e.preventDefault();
            moveDown();
            break;
        case 'ArrowUp':
            e.preventDefault();
            rotatePiece();
            break;
        case ' ':
            e.preventDefault();
            togglePause();
            break;
    }
});

// 按钮事件
document.getElementById('startBtn').addEventListener('click', startGame);
document.getElementById('restartBtn').addEventListener('click', startGame);

// 移动端控制按钮事件
document.getElementById('btnLeft').addEventListener('touchstart', (e) => {
    e.preventDefault();
    movePiece(-1);
});

document.getElementById('btnRight').addEventListener('touchstart', (e) => {
    e.preventDefault();
    movePiece(1);
});

document.getElementById('btnDown').addEventListener('touchstart', (e) => {
    e.preventDefault();
    moveDown();
});

document.getElementById('btnRotate').addEventListener('touchstart', (e) => {
    e.preventDefault();
    rotatePiece();
});

document.getElementById('btnPause').addEventListener('touchstart', (e) => {
    e.preventDefault();
    togglePause();
});

// 同时也支持鼠标点击（用于桌面测试）
document.getElementById('btnLeft').addEventListener('click', () => movePiece(-1));
document.getElementById('btnRight').addEventListener('click', () => movePiece(1));
document.getElementById('btnDown').addEventListener('click', () => moveDown());
document.getElementById('btnRotate').addEventListener('click', () => rotatePiece());
document.getElementById('btnPause').addEventListener('click', () => togglePause());

// 初始化
initBoard();
drawBoard();
drawNextPiece();
