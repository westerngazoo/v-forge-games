const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const startScreen = document.getElementById('start-screen');
const gameOverScreen = document.getElementById('game-over-screen');
const startBtn = document.getElementById('start-btn');
const restartBtn = document.getElementById('restart-btn');
const scoreEl = document.getElementById('score');
const waveEl = document.getElementById('wave');
const healthFill = document.getElementById('health-fill');
const finalScoreEl = document.getElementById('final-score');

// Game State
let gameState = 'START';
let score = 0;
let wave = 1;
let frameCount = 0;

// Input
const keys = {
    w: false, a: false, s: false, d: false
};
const mouse = {
    x: canvas.width / 2, y: canvas.height / 2, down: false
};

// Player
const player = {
    x: canvas.width / 2,
    y: canvas.height / 2,
    radius: 15,
    speed: 5,
    health: 200,
    maxHealth: 200,
    color: '#00f0ff',
    angle: 0,
    lastShot: 0,
    fireRate: 5, // frames between shots
    
    update() {
        if (keys.w && this.y > this.radius) this.y -= this.speed;
        if (keys.s && this.y < canvas.height - this.radius) this.y += this.speed;
        if (keys.a && this.x > this.radius) this.x -= this.speed;
        if (keys.d && this.x < canvas.width - this.radius) this.x += this.speed;
        
        // Calculate angle to mouse
        this.angle = Math.atan2(mouse.y - this.y, mouse.x - this.x);
        
        // Shooting
        if (mouse.down && frameCount - this.lastShot > this.fireRate) {
            this.shoot();
            this.lastShot = frameCount;
        }
    },
    
    draw() {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle);
        
        ctx.fillStyle = this.color;
        ctx.shadowBlur = 15;
        ctx.shadowColor = this.color;
        
        // Draw ship (triangle)
        ctx.beginPath();
        ctx.moveTo(20, 0);
        ctx.lineTo(-10, 15);
        ctx.lineTo(-5, 0);
        ctx.lineTo(-10, -15);
        ctx.closePath();
        ctx.fill();
        
        ctx.restore();
    },
    
    shoot() {
        projectiles.push(new Projectile(this.x, this.y, this.angle, this.color, true));
    },
    
    takeDamage(amount) {
        this.health -= amount;
        if (this.health < 0) this.health = 0;
        healthFill.style.width = `${(this.health / this.maxHealth) * 100}%`;
        
        // Flash screen red effect can be added here
        
        if (this.health <= 0) {
            gameOver();
        }
    }
};

// Arrays
let projectiles = [];
let enemies = [];
let particles = [];

// Classes
class Projectile {
    constructor(x, y, angle, color, isPlayer) {
        this.x = x;
        this.y = y;
        this.speed = 10;
        this.dx = Math.cos(angle) * this.speed;
        this.dy = Math.sin(angle) * this.speed;
        this.radius = 3;
        this.color = color;
        this.isPlayer = isPlayer;
    }
    
    update() {
        this.x += this.dx;
        this.y += this.dy;
    }
    
    draw() {
        ctx.fillStyle = this.color;
        ctx.shadowBlur = 10;
        ctx.shadowColor = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
    }
}

class Enemy {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.radius = Math.random() * 10 + 10;
        this.speed = Math.random() * 0.5 + (0.2 * wave);
        this.color = '#ff0055';
        this.health = this.radius * 2;
    }
    
    update() {
        const angle = Math.atan2(player.y - this.y, player.x - this.x);
        this.x += Math.cos(angle) * this.speed;
        this.y += Math.sin(angle) * this.speed;
    }
    
    draw() {
        ctx.strokeStyle = this.color;
        ctx.lineWidth = 2;
        ctx.shadowBlur = 15;
        ctx.shadowColor = this.color;
        
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.stroke();
        
        // Inner core
        ctx.fillStyle = 'rgba(255, 0, 85, 0.3)';
        ctx.fill();
        
        ctx.shadowBlur = 0;
    }
}

class Particle {
    constructor(x, y, color) {
        this.x = x;
        this.y = y;
        this.dx = (Math.random() - 0.5) * 8;
        this.dy = (Math.random() - 0.5) * 8;
        this.radius = Math.random() * 3 + 1;
        this.color = color;
        this.alpha = 1;
        this.decay = Math.random() * 0.05 + 0.02;
    }
    
    update() {
        this.x += this.dx;
        this.y += this.dy;
        this.alpha -= this.decay;
    }
    
    draw() {
        ctx.save();
        ctx.globalAlpha = this.alpha;
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
}

function spawnEnemy() {
    let x, y;
    if (Math.random() < 0.5) {
        x = Math.random() < 0.5 ? 0 - 30 : canvas.width + 30;
        y = Math.random() * canvas.height;
    } else {
        x = Math.random() * canvas.width;
        y = Math.random() < 0.5 ? 0 - 30 : canvas.height + 30;
    }
    enemies.push(new Enemy(x, y));
}

function createExplosion(x, y, color) {
    for (let i = 0; i < 15; i++) {
        particles.push(new Particle(x, y, color));
    }
}

function initGame() {
    player.x = canvas.width / 2;
    player.y = canvas.height / 2;
    player.health = player.maxHealth;
    healthFill.style.width = '100%';
    
    projectiles = [];
    enemies = [];
    particles = [];
    score = 0;
    wave = 1;
    frameCount = 0;
    
    scoreEl.innerText = score;
    waveEl.innerText = wave;
    
    startScreen.classList.remove('active');
    gameOverScreen.classList.remove('active');
    
    gameState = 'PLAYING';
    gameLoop();
}

function gameOver() {
    gameState = 'GAMEOVER';
    finalScoreEl.innerText = score;
    gameOverScreen.classList.add('active');
}

function gameLoop() {
    if (gameState !== 'PLAYING') return;
    
    // Slight trailing effect
    ctx.fillStyle = 'rgba(5, 5, 16, 0.3)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    player.update();
    player.draw();
    
    // Wave management
    if (frameCount % Math.max(90 - (wave * 5), 40) === 0) {
        spawnEnemy();
    }
    
    if (frameCount % 600 === 0) {
        wave++;
        waveEl.innerText = wave;
    }
    
    // Update and draw particles
    for (let i = particles.length - 1; i >= 0; i--) {
        particles[i].update();
        particles[i].draw();
        if (particles[i].alpha <= 0) {
            particles.splice(i, 1);
        }
    }
    
    // Update and draw projectiles
    for (let i = projectiles.length - 1; i >= 0; i--) {
        projectiles[i].update();
        projectiles[i].draw();
        
        // Remove off-screen
        if (
            projectiles[i].x < 0 || projectiles[i].x > canvas.width ||
            projectiles[i].y < 0 || projectiles[i].y > canvas.height
        ) {
            projectiles.splice(i, 1);
            continue;
        }
        
        // Check collisions with enemies if player projectile
        if (projectiles[i].isPlayer) {
            for (let j = enemies.length - 1; j >= 0; j--) {
                const dx = projectiles[i].x - enemies[j].x;
                const dy = projectiles[i].y - enemies[j].y;
                const dist = Math.hypot(dx, dy);
                
                if (dist < enemies[j].radius + projectiles[i].radius) {
                    enemies[j].health -= 20;
                    createExplosion(projectiles[i].x, projectiles[i].y, projectiles[i].color);
                    projectiles.splice(i, 1);
                    
                    if (enemies[j].health <= 0) {
                        createExplosion(enemies[j].x, enemies[j].y, enemies[j].color);
                        score += Math.floor(enemies[j].radius);
                        scoreEl.innerText = score;
                        enemies.splice(j, 1);
                    }
                    break;
                }
            }
        }
    }
    
    // Update and draw enemies
    for (let i = enemies.length - 1; i >= 0; i--) {
        enemies[i].update();
        enemies[i].draw();
        
        // Check collision with player
        const dx = player.x - enemies[i].x;
        const dy = player.y - enemies[i].y;
        const dist = Math.hypot(dx, dy);
        
        if (dist < player.radius + enemies[i].radius) {
            player.takeDamage(enemies[i].radius);
            createExplosion(enemies[i].x, enemies[i].y, enemies[i].color);
            enemies.splice(i, 1);
        }
    }
    
    frameCount++;
    requestAnimationFrame(gameLoop);
}

// Event Listeners
window.addEventListener('keydown', (e) => {
    if (e.key === 'w' || e.key === 'W') keys.w = true;
    if (e.key === 's' || e.key === 'S') keys.s = true;
    if (e.key === 'a' || e.key === 'A') keys.a = true;
    if (e.key === 'd' || e.key === 'D') keys.d = true;
});

window.addEventListener('keyup', (e) => {
    if (e.key === 'w' || e.key === 'W') keys.w = false;
    if (e.key === 's' || e.key === 'S') keys.s = false;
    if (e.key === 'a' || e.key === 'A') keys.a = false;
    if (e.key === 'd' || e.key === 'D') keys.d = false;
});

window.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    mouse.x = e.clientX - rect.left;
    mouse.y = e.clientY - rect.top;
});

window.addEventListener('mousedown', () => mouse.down = true);
window.addEventListener('mouseup', () => mouse.down = false);

startBtn.addEventListener('click', initGame);
restartBtn.addEventListener('click', initGame);
