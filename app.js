// ========================
// Game Configuration
// ========================
const config = {
    width: 800,
    height: 600,
    lanes: [-100, 0, 100], // Left, Center, Right
    baseSpeed: 5,
    maxBots: 3
};

// ========================
// Game State
// ========================
const state = {
    players: [],
    bots: [],
    obstacles: [],
    powerups: [],
    distance: 0,
    speed: config.baseSpeed,
    keys: {}
};

// ========================
// Core Classes
// ========================
class Player {
    constructor(id, name, isBot = false) {
        this.id = id;
        this.name = name;
        this.lane = 1; // Center lane
        this.y = config.height - 100;
        this.speed = config.baseSpeed;
        this.health = 100;
        this.score = 0;
        this.isBot = isBot;
        this.color = isBot ? '#FF5555' : '#55AAFF';
    }

    draw(ctx) {
        ctx.fillStyle = this.color;
        ctx.fillRect(
            config.width/2 + config.lanes[this.lane] - 15, 
            this.y - 30, 
            30, 60
        );
        
        // Health bar
        ctx.fillStyle = 'red';
        ctx.fillRect(
            config.width/2 + config.lanes[this.lane] - 15,
            this.y - 40,
            30 * (this.health/100),
            5
        );
    }

    moveLeft() {
        this.lane = Math.max(0, this.lane - 1);
    }

    moveRight() {
        this.lane = Math.min(2, this.lane + 1);
    }

    throwObstacle() {
        state.obstacles.push(new Obstacle(this.lane, this.y - 50));
    }

    update() {
        this.score = Math.floor(state.distance);
        
        // Simple bot AI
        if (this.isBot) {
            if (Math.random() < 0.01) {
                Math.random() > 0.5 ? this.moveLeft() : this.moveRight();
            }
            if (Math.random() < 0.005) {
                this.throwObstacle();
            }
        }
    }
}

class Obstacle {
    constructor(lane, y) {
        this.lane = lane;
        this.y = y;
        this.width = 30;
        this.height = 30;
        this.type = Math.random() > 0.5 ? 'spike' : 'slow';
    }

    draw(ctx) {
        ctx.fillStyle = this.type === 'spike' ? '#FF0000' : '#00AAFF';
        ctx.fillRect(
            config.width/2 + config.lanes[this.lane] - 15,
            this.y,
            30, 30
        );
    }

    update() {
        this.y += state.speed;
    }
}

class PowerUp {
    constructor(lane, y) {
        this.lane = lane;
        this.y = y;
        this.type = ['speed', 'shield', 'invisible'][Math.floor(Math.random() * 3)];
        this.colors = { speed: '#00FF00', shield: '#FFFF00', invisible: '#AAAAAA' };
    }

    draw(ctx) {
        ctx.fillStyle = this.colors[this.type];
        ctx.beginPath();
        ctx.arc(
            config.width/2 + config.lanes[this.lane],
            this.y,
            15, 0, Math.PI * 2
        );
        ctx.fill();
    }
}

// ========================
// Game Initialization
// ========================
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
canvas.width = config.width;
canvas.height = config.height;

// Input handling
window.addEventListener('keydown', (e) => {
    state.keys[e.key] = true;
    if (e.key === ' ') {
        state.players[0]?.throwObstacle();
    }
});

window.addEventListener('keyup', (e) => {
    state.keys[e.key] = false;
});

// ========================
// Main Game Loop
// ========================
function gameLoop() {
    update();
    render();
    requestAnimationFrame(gameLoop);
}

function update() {
    // Update players
    state.players.forEach(player => {
        if (state.keys.ArrowLeft) player.moveLeft();
        if (state.keys.ArrowRight) player.moveRight();
        player.update();
    });

    // Update bots
    state.bots.forEach(bot => bot.update());

    // Update obstacles
    state.obstacles.forEach(obs => obs.update());
    state.obstacles = state.obstacles.filter(obs => obs.y < config.height);

    // Update powerups
    state.powerups.forEach(pu => pu.y += state.speed);
    state.powerups = state.powerups.filter(pu => pu.y < config.height);

    // Spawn new obstacles/powerups
    if (Math.random() < 0.02) {
        state.obstacles.push(new Obstacle(
            Math.floor(Math.random() * 3),
            -50
        ));
    }

    if (Math.random() < 0.01) {
        state.powerups.push(new PowerUp(
            Math.floor(Math.random() * 3),
            -50
        ));
    }

    // Increase difficulty
    state.distance += state.speed / 10;
    state.speed = config.baseSpeed + Math.floor(state.distance / 1000);
    document.getElementById('distance').textContent = Math.floor(state.distance);
    document.getElementById('speed').textContent = state.speed.toFixed(1);

    // Update UI
    updatePlayersList();
}

function render() {
    // Clear screen
    ctx.fillStyle = '#222';
    ctx.fillRect(0, 0, config.width, config.height);

    // Draw track
    ctx.strokeStyle = '#555';
    ctx.lineWidth = 2;
    config.lanes.forEach(lane => {
        ctx.beginPath();
        ctx.moveTo(config.width/2 + lane, 0);
        ctx.lineTo(config.width/2 + lane, config.height);
        ctx.stroke();
    });

    // Draw all game objects
    state.players.forEach(p => p.draw(ctx));
    state.bots.forEach(b => b.draw(ctx));
    state.obstacles.forEach(o => o.draw(ctx));
    state.powerups.forEach(p => p.draw(ctx));
}

function updatePlayersList() {
    const list = document.getElementById('players-list');
    list.innerHTML = '<h3>PLAYERS</h3>';
    
    [...state.players, ...state.bots].forEach(player => {
        const div = document.createElement('div');
        div.style.color = player.color;
        div.textContent = `${player.name}: ${player.score}m`;
        list.appendChild(div);
    });
}

// ========================
// Start Game
// ========================
function initGame() {
    // Add human player
    state.players.push(new Player(0, 'You'));

    // Add bots
    for (let i = 0; i < config.maxBots; i++) {
        state.bots.push(new Player(i+1, `Bot ${i+1}`, true));
    }

    gameLoop();
}

initGame();