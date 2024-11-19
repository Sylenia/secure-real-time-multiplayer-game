const socket = io();
const canvas = document.getElementById('game-window');
const context = canvas.getContext('2d');

// Game state
let players = {};
let collectibles = [];

// Initialize game state
socket.on('init', ({ players: serverPlayers, collectibles: serverCollectibles }) => {
  players = serverPlayers;
  collectibles = serverCollectibles;
  draw();
});

// Update state
socket.on('stateUpdate', (updatedPlayers) => {
  players = updatedPlayers;
  draw();
});

function draw() {
  context.clearRect(0, 0, canvas.width, canvas.height);

  // Draw players
  for (const playerId in players) {
    const player = players[playerId];
    context.fillStyle = 'blue';
    context.fillRect(player.x, player.y, 20, 20);
  }

  // Draw collectibles
  collectibles.forEach(item => {
    context.fillStyle = 'gold';
    context.fillRect(item.x, item.y, 10, 10);
  });
}

// Listen for keyboard input
window.addEventListener('keydown', (e) => {
  const speed = 5;
  const dir = { ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right' }[e.key];
  if (dir) {
    socket.emit('move', { dir, speed });
  }
});

