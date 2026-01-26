import express from "express";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*",
  },
});

io.on("connection", (socket) => {
  console.log("client connected:", socket.id);

  socket.on("join-event", (groupId) => {
    socket.join(groupId);
  });
});

app.post("/emit", (req, res) => {
  const { groupId, image } = req.body;
  io.to(groupId).emit("new-image", image);
  res.json({ ok: true });
});

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
  console.log("Socket server running on", PORT);
});
