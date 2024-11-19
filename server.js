require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const helmet = require('helmet');
const cors = require('cors');
const socketIo = require('socket.io');

const app = express();

// Apply headers globally
app.use((req, res, next) => {
  res.setHeader('x-powered-by', 'PHP 7.4.3');
  res.setHeader('x-content-type-options', 'nosniff');
  res.setHeader('x-xss-protection', '1; mode=block');
  res.setHeader('cache-control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('pragma', 'no-cache');
  res.setHeader('expires', '0');
  res.setHeader('surrogate-control', 'no-store');
  next();
});

// Use Helmet for security
app.use(helmet());
app.use(helmet.hidePoweredBy({ setTo: 'PHP 7.4.3' }));
app.use(helmet.noSniff());
app.use(helmet.xssFilter());
app.use(helmet.noCache());

// Enable CORS
app.use(cors());

// Serve static files with headers
app.use('/public', (req, res, next) => {
  res.setHeader('x-powered-by', 'PHP 7.4.3');
  res.setHeader('x-content-type-options', 'nosniff');
  res.setHeader('x-xss-protection', '1; mode=block');
  res.setHeader('cache-control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('pragma', 'no-cache');
  res.setHeader('expires', '0');
  res.setHeader('surrogate-control', 'no-store');
  next();
}, express.static(process.cwd() + '/public'));

// Body parser
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Serve index page with explicit headers
app.route('/').get((req, res) => {
  res.setHeader('x-powered-by', 'PHP 7.4.3');
  res.setHeader('x-content-type-options', 'nosniff');
  res.setHeader('x-xss-protection', '1; mode=block');
  res.setHeader('cache-control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('pragma', 'no-cache');
  res.setHeader('expires', '0');
  res.setHeader('surrogate-control', 'no-store');
  res.sendFile(process.cwd() + '/views/index.html');
});

// 404 Not Found Middleware
app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    headers: {
      'x-powered-by': 'PHP 7.4.3',
      'x-content-type-options': 'nosniff',
      'x-xss-protection': '1; mode=block',
      'cache-control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
      'pragma': 'no-cache',
      'expires': '0',
      'surrogate-control': 'no-store',
    },
  });
});

// Start the server
const portNum = process.env.PORT || 3000;
const server = app.listen(portNum, () => {
  console.log(`Listening on port ${portNum}`);
});

// Initialize Socket.IO
const io = socketIo(server);

// Server-side game state
let players = {};
let collectibles = [];

// Generate collectibles (simple objects on the server)
function generateCollectibles() {
  collectibles = Array.from({ length: 5 }, (_, i) => ({
    x: Math.random() * 500,
    y: Math.random() * 500,
    value: Math.floor(Math.random() * 10 + 1),
    id: `item-${i}`,
  }));
}
generateCollectibles();

// Socket.IO logic
io.on('connection', (socket) => {
  console.log(`Player connected: ${socket.id}`);

  // Create a new player and add to the players object
  players[socket.id] = { x: 250, y: 250, score: 0, id: socket.id };

  // Send initial state to the connected player
  socket.emit('init', { players, collectibles });

  // Notify all players of the new connection
  io.emit('playerConnected', players[socket.id]);

  // Handle player movement
  socket.on('move', ({ dir, speed }) => {
    const player = players[socket.id];
    if (player) {
      // Update player position based on direction
      if (dir === 'up') player.y -= speed;
      if (dir === 'down') player.y += speed;
      if (dir === 'left') player.x -= speed;
      if (dir === 'right') player.x += speed;

      // Check for collisions with collectibles
      collectibles.forEach((item, index) => {
        if (
          player.x < item.x + 10 &&
          player.x + 20 > item.x &&
          player.y < item.y + 10 &&
          player.y + 20 > item.y
        ) {
          player.score += item.value;
          collectibles.splice(index, 1); // Remove collected item
        }
      });

      // Regenerate collectibles if all are collected
      if (collectibles.length === 0) {
        generateCollectibles();
      }

      // Broadcast updated state
      io.emit('stateUpdate', { players, collectibles });
    }
  });

  // Handle player disconnection
  socket.on('disconnect', () => {
    console.log(`Player disconnected: ${socket.id}`);
    delete players[socket.id];
    io.emit('playerDisconnected', socket.id);
  });
});

