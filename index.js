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

io.on("connection", (socket) => {
  console.log("🔌 Client connected:", socket.id);

  socket.on("join-group", (groupId) => {
    socket.join(groupId);
    console.log(`👥 Socket ${socket.id} joined group: ${groupId}`);
  });

  socket.on("disconnect", () => {
    console.log("❌ Client disconnected:", socket.id);
  });
});

// 🔥 endpoint สำหรับ Next.js ยิง event realtime
app.post("/emit", (req, res) => {
  const { groupId, type, image, imageId, duration } = req.body;

  if (!groupId || !type) {
    return res.status(400).json({ error: "Missing groupId or type" });
  }

  console.log("📣 EMIT:", type, "→ group:", groupId);

  switch (type) {
    case "new-image": {
      if (!image || !image._id) {
        return res.status(400).json({ error: "Invalid image data" });
      }

      io.to(groupId).emit("new-image", image);
      break;
    }

    case "delete-image": {
      if (!imageId) {
        return res.status(400).json({ error: "Missing imageId" });
      }

      io.to(groupId).emit("delete-image", imageId);
      break;
    }

    case "update-image": {
      if (!image || !image._id) {
        return res.status(400).json({ error: "Invalid image data" });
      }
      io.to(groupId).emit("update-image", image);
      break;
    }

    case "update-duration": {
      if (typeof duration !== "number") {
        return res.status(400).json({ error: "Invalid duration" });
      }

      io.to(groupId).emit("update-duration", duration);
      break;
    }

    default:
      return res.status(400).json({ error: "Unknown type" });
  }

  res.json({ success: true });
});

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
  console.log("🚀 Socket Server running on port", PORT);
});
