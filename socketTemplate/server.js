import express from "express";
import http from "http";
import { Server } from "socket.io";

const app = express();
const server = http.createServer(app);
const io = new Server(server);
app.use(express.static("public"));

let players = {};
let bullets = [];

io.on("connection", (socket) => {
  players[socket.id] = { x: 1000, y: 1000, angle: 0, turret: 0, hp: 100, score: 0 };

  socket.emit("init", { id: socket.id, players, bullets });
  socket.broadcast.emit("newPlayer", { id: socket.id, ...players[socket.id] });

  socket.on("updatePlayer", (data) => {
    if (players[socket.id]) {
      Object.assign(players[socket.id], data);
    }
  });

  socket.on("shoot", (data) => {
    const p = players[socket.id];
    if (!p) return;
    bullets.push({
      x: p.x,
      y: p.y,
      vx: Math.cos(data.angle) * 8,
      vy: Math.sin(data.angle) * 8,
      owner: socket.id
    });
  });

  socket.on("disconnect", () => {
    delete players[socket.id];
    io.emit("removePlayer", socket.id);
  });
});

setInterval(() => {
  // update bullet positions
  bullets.forEach((b) => {
    b.x += b.vx;
    b.y += b.vy;
    // check collision
    for (const pid in players) {
      const p = players[pid];
      const dx = p.x - b.x, dy = p.y - b.y;
      if (Math.sqrt(dx*dx + dy*dy) < 20 && pid !== b.owner) {
        p.hp -= 20;
        if (p.hp <= 0) {
          players[b.owner].score++;
          p.hp = 100;
          p.x = Math.random()*2000;
          p.y = Math.random()*2000;
        }
        b.hit = true;
      }
    }
  });
  bullets = bullets.filter(b => !b.hit);
  io.emit("state", { players, bullets });
}, 50);

server.listen(3000, () => {
  console.log('server running at http://localhost:3000');
});
