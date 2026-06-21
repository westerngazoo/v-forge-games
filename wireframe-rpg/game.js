const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const startScreen = document.getElementById('start-screen');
const gameOverScreen = document.getElementById('game-over-screen');
const startBtn = document.getElementById('start-btn');
const restartBtn = document.getElementById('restart-btn');
const actionBtns = document.querySelectorAll('.action-btn');
const combatLog = document.getElementById('combat-log');

const playerHpBar = document.getElementById('player-hp');
const playerMpBar = document.getElementById('player-mp');
const enemyHpBar = document.getElementById('enemy-hp');
const enemyNameDisplay = document.getElementById('enemy-name');
const killCountEl = document.getElementById('kill-count');
const endMessageEl = document.getElementById('end-message');

// Game State
let gameState = 'START'; // START, PLAYER_TURN, ENEMY_TURN, GAMEOVER
let killCount = 0;
let turnCount = 0;

const player = {
    x: 200,
    y: 250,
    hp: 100,
    maxHp: 100,
    mp: 50,
    maxMp: 50,
    attackPower: 15,
    defense: 0,
    isDefending: false,
    
    draw() {
        ctx.strokeStyle = '#00ff41';
        ctx.lineWidth = 2;
        ctx.beginPath();
        // Cube
        ctx.moveTo(this.x, this.y);
        ctx.lineTo(this.x + 40, this.y - 20);
        ctx.lineTo(this.x + 40, this.y - 60);
        ctx.lineTo(this.x, this.y - 40);
        ctx.closePath();
        ctx.stroke();
        
        ctx.beginPath();
        ctx.moveTo(this.x, this.y);
        ctx.lineTo(this.x - 40, this.y - 20);
        ctx.lineTo(this.x - 40, this.y - 60);
        ctx.lineTo(this.x, this.y - 40);
        ctx.closePath();
        ctx.stroke();
        
        ctx.beginPath();
        ctx.moveTo(this.x, this.y - 40);
        ctx.lineTo(this.x + 40, this.y - 60);
        ctx.lineTo(this.x, this.y - 80);
        ctx.lineTo(this.x - 40, this.y - 60);
        ctx.closePath();
        ctx.stroke();
        
        if (this.isDefending) {
            ctx.beginPath();
            ctx.arc(this.x, this.y - 40, 60, 0, Math.PI * 2);
            ctx.setLineDash([5, 10]);
            ctx.stroke();
            ctx.setLineDash([]);
        }
    },
    
    updateBars() {
        playerHpBar.style.width = `${(this.hp / this.maxHp) * 100}%`;
        playerMpBar.style.width = `${(this.mp / this.maxMp) * 100}%`;
    }
};

let enemy = createEnemy();

function createEnemy() {
    const types = [
        { name: 'CORRUPT_NODE', hp: 50, atk: 10, shape: 'diamond' },
        { name: 'VIRUS_WORM', hp: 30, atk: 20, shape: 'snake' },
        { name: 'TROJAN_HORSE', hp: 80, atk: 15, shape: 'box' }
    ];
    const type = types[Math.floor(Math.random() * types.length)];
    
    // Scale up slightly based on kill count
    const hpScale = 1 + (killCount * 0.2);
    const atkScale = 1 + (killCount * 0.1);
    
    return {
        x: 600,
        y: 250,
        name: type.name,
        hp: Math.floor(type.hp * hpScale),
        maxHp: Math.floor(type.hp * hpScale),
        attackPower: Math.floor(type.atk * atkScale),
        shape: type.shape,
        offset: 0,
        
        draw() {
            ctx.strokeStyle = '#ff003c';
            ctx.lineWidth = 2;
            
            // Hover animation
            this.offset = Math.sin(Date.now() / 200) * 10;
            const drawY = this.y + this.offset;
            
            ctx.beginPath();
            if (this.shape === 'diamond') {
                ctx.moveTo(this.x, drawY - 80);
                ctx.lineTo(this.x + 30, drawY - 40);
                ctx.lineTo(this.x, drawY);
                ctx.lineTo(this.x - 30, drawY - 40);
            } else if (this.shape === 'snake') {
                ctx.moveTo(this.x - 20, drawY);
                for(let i=0; i<4; i++) {
                    ctx.lineTo(this.x - 20 + i*10, drawY - i*20 + (i%2==0?10:-10));
                }
                ctx.lineTo(this.x + 20, drawY);
            } else {
                ctx.rect(this.x - 30, drawY - 60, 60, 60);
                ctx.moveTo(this.x - 30, drawY - 60);
                ctx.lineTo(this.x + 30, drawY);
                ctx.moveTo(this.x + 30, drawY - 60);
                ctx.lineTo(this.x - 30, drawY);
            }
            ctx.closePath();
            ctx.stroke();
            
            // Glitch effect occasionally
            if (Math.random() < 0.05) {
                ctx.fillStyle = 'rgba(255, 0, 60, 0.5)';
                ctx.fillRect(this.x - 40, drawY - 80 + Math.random()*80, 80, 5);
            }
        },
        
        updateBars() {
            enemyNameDisplay.innerText = this.name;
            enemyHpBar.style.width = `${(this.hp / this.maxHp) * 100}%`;
        }
    };
}

function log(msg) {
    const p = document.createElement('div');
    p.className = 'log-entry';
    p.innerText = `> ${msg}`;
    combatLog.appendChild(p);
    if (combatLog.children.length > 5) {
        combatLog.removeChild(combatLog.firstChild);
    }
}

function render() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Grid background
    ctx.strokeStyle = '#003b00';
    ctx.lineWidth = 1;
    for (let i = 0; i < canvas.width; i += 40) {
        ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, canvas.height); ctx.stroke();
    }
    for (let i = 0; i < canvas.height; i += 40) {
        ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(canvas.width, i); ctx.stroke();
    }
    
    player.draw();
    if (enemy) enemy.draw();
    
    if (gameState !== 'GAMEOVER') {
        requestAnimationFrame(render);
    }
}

function spawnNextEnemy() {
    killCount++;
    enemy = createEnemy();
    enemy.updateBars();
    log(`NEW ENTITY DETECTED: ${enemy.name}`);
    gameState = 'PLAYER_TURN';
    updateUI();
}

function updateUI() {
    player.updateBars();
    if(enemy) enemy.updateBars();
    
    actionBtns.forEach(btn => {
        btn.disabled = gameState !== 'PLAYER_TURN';
        if (btn.dataset.action === 'heal' && player.mp < 10) {
            btn.disabled = true;
        }
    });
}

function enemyTurn() {
    gameState = 'ENEMY_TURN';
    updateUI();
    
    setTimeout(() => {
        if (!enemy || enemy.hp <= 0) return;
        
        log(`${enemy.name} prepares to attack...`);
        
        setTimeout(() => {
            let dmg = enemy.attackPower + Math.floor(Math.random() * 5);
            if (player.isDefending) {
                dmg = Math.floor(dmg / 2);
                log(`PLAYER DEFLECTED ATTACK. Received ${dmg} damage.`);
            } else {
                log(`${enemy.name} strikes for ${dmg} damage!`);
            }
            
            player.hp -= dmg;
            if (player.hp < 0) player.hp = 0;
            
            updateUI();
            
            if (player.hp <= 0) {
                gameOver();
            } else {
                gameState = 'PLAYER_TURN';
                player.isDefending = false;
                turnCount++;
                updateUI();
                log('AWAITING PLAYER INPUT...');
            }
        }, 1000);
        
    }, 1000);
}

function executeAction(action) {
    if (gameState !== 'PLAYER_TURN') return;
    
    if (action === 'attack') {
        let dmg = player.attackPower + Math.floor(Math.random() * 10);
        enemy.hp -= dmg;
        log(`PLAYER EXECUTED ATTACK. Dealt ${dmg} damage.`);
    } 
    else if (action === 'defend') {
        player.isDefending = true;
        player.mp += 5; // regain MP on defend
        if (player.mp > player.maxMp) player.mp = player.maxMp;
        log(`PLAYER ENTERED DEFENSIVE STANCE. Regained MP.`);
    }
    else if (action === 'heal') {
        if (player.mp >= 10) {
            player.mp -= 10;
            let heal = 30;
            player.hp += heal;
            if (player.hp > player.maxHp) player.hp = player.maxHp;
            log(`PLAYER EXECUTED REPAIR PROTOCOL. Recovered ${heal} HP.`);
        }
    }
    
    updateUI();
    
    if (enemy.hp <= 0) {
        log(`ENTITY ${enemy.name} TERMINATED.`);
        enemy.hp = 0;
        updateUI();
        
        // Regain some stats
        player.hp += 10;
        if(player.hp > player.maxHp) player.hp = player.maxHp;
        player.mp += 10;
        if(player.mp > player.maxMp) player.mp = player.maxMp;
        
        setTimeout(spawnNextEnemy, 1500);
    } else {
        enemyTurn();
    }
}

function initGame() {
    player.hp = player.maxHp;
    player.mp = player.maxMp;
    player.isDefending = false;
    killCount = 0;
    turnCount = 0;
    combatLog.innerHTML = '';
    
    enemy = createEnemy();
    
    startScreen.classList.remove('active');
    gameOverScreen.classList.remove('active');
    
    gameState = 'PLAYER_TURN';
    log('SIMULATION INITIALIZED. AWAITING INPUT...');
    updateUI();
    render();
}

function gameOver() {
    gameState = 'GAMEOVER';
    killCountEl.innerText = killCount;
    gameOverScreen.classList.add('active');
}

actionBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
        executeAction(e.target.dataset.action);
    });
});

startBtn.addEventListener('click', initGame);
restartBtn.addEventListener('click', initGame);
