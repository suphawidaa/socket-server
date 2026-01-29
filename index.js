import express from "express";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";

const app = express();
app.use(cors({ origin: "*" }));
app.use(express.json());

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

// ✅ เก็บภาพล่าสุดของแต่ละ group (กัน client เข้ามาช้า)
const lastImageByGroup = {};

io.on("connection", (socket) => {
  console.log("Client connected:", socket.id);

  socket.on("join-group", (groupId) => {
    socket.join(groupId);
    console.log(`Socket ${socket.id} joined group: ${groupId}`);

    // 🔥 ส่งภาพล่าสุดทันที ถ้ามี
    if (lastImageByGroup[groupId]) {
      socket.emit("new-image", lastImageByGroup[groupId]);
    }
  });

  socket.on("disconnect", () => {
    console.log("Client disconnected:", socket.id);
  });
});

// 🔥 endpoint สำหรับ Next.js เรียกมา emit
app.post("/emit", (req, res) => {
  const { groupId, type, image, imageId, duration } = req.body;

  if (!groupId || !type) {
    return res.status(400).json({ error: "Missing data" });
  }

  // 🖼 เพิ่มรูป
  if (type === "new-image") {
    if (!image) {
      return res.status(400).json({ error: "Missing image" });
    }

    lastImageByGroup[groupId] = image;
    io.to(groupId).emit("new-image", image);
  }

  // ⏱ update duration
  if (type === "update-duration") {
    if (!duration) {
      return res.status(400).json({ error: "Missing duration" });
    }

    io.to(groupId).emit("update-duration", duration);
  }

  // 🗑 ลบรูป
  if (type === "delete-image") {
    if (!imageId) {
      return res.status(400).json({ error: "Missing imageId" });
    }

    if (lastImageByGroup[groupId]?._id === imageId) {
      delete lastImageByGroup[groupId];
    }

    io.to(groupId).emit("delete-image", imageId);
  }

  res.json({ success: true });
});

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
  console.log("Socket Server running on port", PORT);
});
