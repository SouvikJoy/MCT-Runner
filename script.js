const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
canvas.width = 600;
canvas.height = 600;

const cellSize = 40;
const mazeRows = canvas.height / cellSize;
const mazeCols = canvas.width / cellSize;

let maze = [];
let player = { x: 0, y: 0 };
let keys = [];
let exit = { x: mazeCols - 1, y: mazeRows - 1 };
let movingElements = [];
let score = 0;
let level = 1;
let gameOver = false;
let intervalId;

const backgroundImage = new Image();
backgroundImage.src = 'https://i.postimg.cc/SN2NGfGX/background.jpg';

const playerImage = new Image();
playerImage.src = 'https://i.postimg.cc/0jHjyt0v/player.png';

const movingElement = new Image();
movingElement.src = 'https://i.postimg.cc/26Q63bxF/skeleton-v2.png';

const keyImage = new Image();
keyImage.src = 'https://i.postimg.cc/MZmtR9PV/key.png';

const boxImage = new Image();
boxImage.src = 'https://i.postimg.cc/5NPX2t2J/box.png';

const lockedImage = new Image();
lockedImage.src = 'https://i.postimg.cc/d3MstFXC/locked.jpg';

const unlockedImage = new Image();
unlockedImage.src = 'https://i.postimg.cc/1zn1gTDr/unlocked.jpg';

const keySound = new Audio('keysound.mp3');

const levelSound = new Audio('level_up.mp3');

const gameTeleportSound = new Audio('game_teleport.mp3');

const hud = document.getElementById('hud');
const menu = document.getElementById('menu');
const gameOverScreen = document.getElementById('gameOver');
const startButton = document.getElementById('startButton');
const restartButton = document.getElementById('restartButton');

function updateHUD() {
    document.getElementById('level').textContent = `Level: ${level}`;
    document.getElementById('score').textContent = `Score: ${score}`;
}

function generateMaze() {
    maze = Array.from({ length: mazeRows }, () => Array(mazeCols).fill(0));

    // Simple maze generation with random walls
    for (let row = 0; row < mazeRows; row++) {
        for (let col = 0; col < mazeCols; col++) {
            if (Math.random() < 0.2 && !(row === 0 && col === 0) && !(row === mazeRows - 1 && col === mazeCols - 1)) {
                maze[row][col] = 1; // Wall
            }
        }
    }

    // Generate keys at random positions
    keys = [];
    for (let i = 0; i < 5; i++) {
        let keyX, keyY;
        do {
            keyX = Math.floor(Math.random() * mazeCols);
            keyY = Math.floor(Math.random() * mazeRows);
        } while (maze[keyY][keyX] === 1 || (keyX === 0 && keyY === 0));
        keys.push({ x: keyX, y: keyY });
    }

    // Generate moving elements
    movingElements = [];
    for (let i = 0; i < 3; i++) {
        let meX, meY;
        do {
            meX = Math.floor(Math.random() * mazeCols);
            meY = Math.floor(Math.random() * mazeRows);
        } while (maze[meY][meX] === 1 || (meX === 0 && meY === 0));
        movingElements.push({ x: meX, y: meY, dirX: Math.random() > 0.5 ? 1 : -1, dirY: Math.random() > 0.5 ? 1 : -1 });
    }
}

function drawMaze() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(backgroundImage, 0, 0, canvas.width, canvas.height);
    for (let row = 0; row < mazeRows; row++) {
        for (let col = 0; col < mazeCols; col++) {
            if (maze[row][col] === 1) {
                ctx.drawImage(boxImage, col * cellSize, row * cellSize, cellSize, cellSize);
                // ctx.fillStyle = '#444';
                // ctx.fillRect(col * cellSize, row * cellSize, cellSize, cellSize);
            }
        }
    }

    // Draw keys
    keys.forEach(key => {
        ctx.drawImage(keyImage, key.x * cellSize, key.y * cellSize, cellSize, cellSize);
        // ctx.fillStyle = 'yellow';
        // ctx.beginPath();
        // ctx.arc(key.x * cellSize + cellSize / 2, key.y * cellSize + cellSize / 2, cellSize / 4, 0, Math.PI * 2);
        // ctx.fill();
    });

    // Draw player
    ctx.drawImage(playerImage, player.x * cellSize, player.y * cellSize, cellSize, cellSize);
    // ctx.fillStyle = 'blue';
    // ctx.beginPath();
    // ctx.arc(player.x * cellSize + cellSize / 2, player.y * cellSize + cellSize / 2, cellSize / 2.5, 0, Math.PI * 2);
    // ctx.fill();

    // Draw exit
    // ctx.fillStyle = 'green';
    // ctx.fillRect(exit.x * cellSize, exit.y * cellSize, cellSize, cellSize);

	if(keys.length === 0) {
		// ctx.fillStyle = 'green';
    	// ctx.fillRect(exit.x * cellSize, exit.y * cellSize, cellSize, cellSize);
        ctx.drawImage(unlockedImage, exit.x * cellSize, exit.y * cellSize, cellSize, cellSize);
	} else {
		// ctx.fillStyle = 'orange';
    	// ctx.fillRect(exit.x * cellSize, exit.y * cellSize, cellSize, cellSize);
        ctx.drawImage(lockedImage, exit.x * cellSize, exit.y * cellSize, cellSize, cellSize);
	}

    // Draw moving elements
    movingElements.forEach(me => {
        // ctx.fillStyle = 'red';
        // ctx.beginPath();
        // ctx.arc(me.x * cellSize + cellSize / 2, me.y * cellSize + cellSize / 2, cellSize / 3, 0, Math.PI * 2);
        // ctx.fill();
        ctx.drawImage(movingElement, me.x * cellSize, me.y * cellSize, cellSize, cellSize);
    });
}

function movePlayer(dx, dy) {
    if (gameOver) return;

    const newX = player.x + dx;
    const newY = player.y + dy;

    if (newX >= 0 && newX < mazeCols && newY >= 0 && newY < mazeRows && maze[newY][newX] === 0) {
        player.x = newX;
        player.y = newY;

        // Check if player collected a key
        keys = keys.filter(key => {
            if (key.x === player.x && key.y === player.y) {
                score += 5;
                keySound.play();
                updateHUD();
                return false;
            }
            return true;
        });

        // Check if player touched a moving element
        for (const me of movingElements) {
            if (me.x === player.x && me.y === player.y) {
                endGame();
                return;
            }
        }

        // Check if player reached the exit
        if (player.x === exit.x && player.y === exit.y && keys.length === 0) {
            level++;
            levelSound.play();
            updateHUD();
            generateMaze();
            player = { x: 0, y: 0 };
        }

        drawMaze();
    }
}

function moveElements() {
    if (gameOver) return;

    movingElements.forEach(me => {
        let newX = me.x + me.dirX;
        let newY = me.y + me.dirY;

        if (newX < 0 || newX >= mazeCols || maze[me.y][newX] === 1) me.dirX *= -1;
        if (newY < 0 || newY >= mazeRows || maze[newY][me.x] === 1) me.dirY *= -1;

        me.x += me.dirX;
        me.y += me.dirY;

        if (me.x === player.x && me.y === player.y) {
            endGame();
            pla
        }
    });

    drawMaze();
}

function endGame() {
    gameOver = true;
    gameTeleportSound.play();
    clearInterval(intervalId);
    gameOverScreen.style.display = 'flex';
}

function startGame() {
    menu.style.display = 'none';
    gameOverScreen.style.display = 'none';
    hud.style.display = 'flex';
    score = 0;
    level = 1;
    gameOver = false;
    player = { x: 0, y: 0 };
    generateMaze();
    updateHUD();
    drawMaze();
    intervalId = setInterval(moveElements, 500);
}

document.addEventListener('keydown', (e) => {
    switch (e.key) {
        case 'ArrowUp':
            movePlayer(0, -1);
            break;
        case 'ArrowDown':
            movePlayer(0, 1);
            break;
        case 'ArrowLeft':
            movePlayer(-1, 0);
            break;
        case 'ArrowRight':
            movePlayer(1, 0);
            break;
    }
});

startButton.addEventListener('click', startGame);
restartButton.addEventListener('click', startGame);

generateMaze();
drawMaze();
updateHUD();
menu.style.display = 'flex';
