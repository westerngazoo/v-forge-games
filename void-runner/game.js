const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const startScreen = document.getElementById('start-screen');
const gameOverScreen = document.getElementById('game-over-screen');
const startBtn = document.getElementById('start-btn');
const restartBtn = document.getElementById('restart-btn');
const scoreEl = document.getElementById('score');
const highScoreEl = document.getElementById('high-score');
const finalScoreEl = document.getElementById('final-score');

// Game State
let gameState = 'START'; // START, PLAYING, GAMEOVER
let score = 0;
let highScore = localStorage.getItem('voidRunnerHighScore') || 0;
let frameCount = 0;
let gameSpeed = 2.5; // Nintendo easy: very slow speed

highScoreEl.innerText = highScore;

// Player Setup
const player = {
    x: 50,
    y: 200,
    width: 30,
    height: 50,
    dy: 0,
    jumpPower: -9,      // Nintendo easy: smaller initial burst
    gravity: 0.25,      // Nintendo easy: very floaty gravity
    grounded: false,
    color: '#00f0ff',
    
    draw() {
        // Draw player (a retro bike or ship abstraction)
        ctx.fillStyle = this.color;
        ctx.shadowBlur = 10;
        ctx.shadowColor = this.color;
        
        ctx.beginPath();
        ctx.moveTo(this.x, this.y);
        ctx.lineTo(this.x + this.width, this.y + this.height / 2);
        ctx.lineTo(this.x, this.y + this.height);
        ctx.lineTo(this.x + this.width / 4, this.y + this.height / 2);
        ctx.closePath();
        ctx.fill();
        
        // Reset shadow
        ctx.shadowBlur = 0;
    },
    
    update() {
        this.y += this.dy;
        
        // Apply gravity
        if (this.y + this.height < canvas.height - 20) {
            this.dy += this.gravity;
            this.grounded = false;
        } else {
            this.y = canvas.height - 20 - this.height;
            this.dy = 0;
            this.grounded = true;
        }
    },
    
    jump() {
        if (this.grounded) {
            this.dy = this.jumpPower;
        }
    }
};

// Obstacles
let obstacles = [];
const obstacleColor = '#f70776';

class Obstacle {
    constructor() {
        this.width = Math.random() * 10 + 15;  // Nintendo easy: much smaller
        this.height = Math.random() * 20 + 20; // Nintendo easy: shorter
        this.x = canvas.width;
        this.y = canvas.height - 20 - this.height;
        this.color = obstacleColor;
    }
    
    draw() {
        ctx.fillStyle = this.color;
        ctx.shadowBlur = 15;
        ctx.shadowColor = this.color;
        
        // Pyramid shape
        ctx.beginPath();
        ctx.moveTo(this.x + this.width / 2, this.y);
        ctx.lineTo(this.x + this.width, this.y + this.height);
        ctx.lineTo(this.x, this.y + this.height);
        ctx.closePath();
        ctx.fill();
        
        ctx.shadowBlur = 0;
    }
    
    update() {
        this.x -= gameSpeed;
    }
}

// Particles (for trail)
let particles = [];
class Particle {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.size = Math.random() * 3 + 1;
        this.speedX = Math.random() * -2 - 1;
        this.speedY = Math.random() * 2 - 1;
        this.life = 1;
    }
    update() {
        this.x += this.speedX;
        this.y += this.speedY;
        this.life -= 0.05;
    }
    draw() {
        ctx.fillStyle = `rgba(0, 240, 255, ${this.life})`;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
    }
}

function handleParticles() {
    // Add particle at player engine
    if (gameState === 'PLAYING') {
        particles.push(new Particle(player.x, player.y + player.height / 2));
    }
    
    for (let i = 0; i < particles.length; i++) {
        particles[i].update();
        particles[i].draw();
        if (particles[i].life <= 0) {
            particles.splice(i, 1);
            i--;
        }
    }
}

function handleObstacles() {
    // Nintendo easy: extremely rare obstacle spawning
    if (frameCount % Math.floor(Math.random() * 150 + 150) === 0) {
        obstacles.push(new Obstacle());
    }
    
    for (let i = 0; i < obstacles.length; i++) {
        obstacles[i].update();
        obstacles[i].draw();
        
        // Collision detection
        if (
            player.x < obstacles[i].x + obstacles[i].width &&
            player.x + player.width > obstacles[i].x &&
            player.y < obstacles[i].y + obstacles[i].height &&
            player.y + player.height > obstacles[i].y
        ) {
            gameOver();
        }
        
        // Remove off-screen obstacles
        if (obstacles[i].x + obstacles[i].width < 0) {
            score += 10;
            scoreEl.innerText = score;
            obstacles.splice(i, 1);
            i--;
            
            // Increase speed slightly
            if (score % 100 === 0) {
                gameSpeed += 0.5;
            }
        }
    }
}

// Floor
function drawFloor() {
    ctx.strokeStyle = '#c501e2';
    ctx.lineWidth = 2;
    ctx.shadowBlur = 10;
    ctx.shadowColor = '#c501e2';
    ctx.beginPath();
    ctx.moveTo(0, canvas.height - 20);
    ctx.lineTo(canvas.width, canvas.height - 20);
    ctx.stroke();
    ctx.shadowBlur = 0;
}

function initGame() {
    player.y = 200;
    player.dy = 0;
    obstacles = [];
    particles = [];
    score = 0;
    gameSpeed = 5;
    frameCount = 0;
    scoreEl.innerText = score;
    
    startScreen.classList.remove('active');
    gameOverScreen.classList.remove('active');
    
    gameState = 'PLAYING';
    gameLoop();
}

function gameOver() {
    gameState = 'GAMEOVER';
    finalScoreEl.innerText = score;
    if (score > highScore) {
        highScore = score;
        localStorage.setItem('voidRunnerHighScore', highScore);
        highScoreEl.innerText = highScore;
    }
    gameOverScreen.classList.add('active');
}

function gameLoop() {
    if (gameState !== 'PLAYING') return;
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    handleParticles();
    drawFloor();
    player.update();
    player.draw();
    handleObstacles();
    
    frameCount++;
    requestAnimationFrame(gameLoop);
}

// Controls
window.addEventListener('keydown', (e) => {
    if ((e.code === 'Space' || e.code === 'ArrowUp') && gameState === 'PLAYING') {
        player.jump();
    }
});

// Touch controls for mobile
window.addEventListener('touchstart', () => {
    if (gameState === 'PLAYING') {
        player.jump();
    }
});

startBtn.addEventListener('click', initGame);
restartBtn.addEventListener('click', initGame);

// Initial draw
drawFloor();
player.draw();
