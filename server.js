import 'dotenv/config';
import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';

const app = express();
app.use(express.json());

const httpServer = createServer(app);
const io = new Server(httpServer, { cors: { origin: '*' } });
const WS_PORT = process.env.WS_PORT || 3001;

// Endpoint para recibir eventos desde Laravel sin Redis
app.post('/ingest', (req, res) => {
  const payload = req.body || {};
  io.emit('dashboard', payload);
  console.log('[emit http]', payload);
  res.json({ ok: true });
});

io.on('connection', (socket) => {
  console.log('dashboard client connected', socket.id);
});

httpServer.listen(WS_PORT, () => console.log('WS on', WS_PORT));
