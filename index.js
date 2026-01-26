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

/* ================= SOCKET ================= */
io.on("connection", (socket) => {
  console.log("client connected:", socket.id);

  socket.on("join-group", (groupId) => {
    console.log("join group:", groupId);
    socket.join(groupId);
  });

  socket.on("disconnect", () => {
    console.log("client disconnected:", socket.id);
  });
});

/* ================= EMIT IMAGE ================= */
/*
POST /emit
body:
{
  "groupId": "group123",
  "image": {
    "url": "https://...",
    "duration": 3
  }
}
*/
app.post("/emit", (req, res) => {
  const { groupId, image } = req.body;

  if (!groupId || !image) {
    return res.status(400).json({ error: "missing groupId or image" });
  }

  io.to(groupId).emit("new-image", image);
  console.log("emit new-image to group:", groupId);

  res.json({ ok: true });
});

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
  console.log("Socket server running on port", PORT);
});
