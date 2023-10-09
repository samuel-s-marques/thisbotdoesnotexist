import axios from "axios";
import { CharacterForge } from "character-forge";
import dotenv from "dotenv";
import express from "express";
import path from "path";
import { Server } from "socket.io";
import { promptBuilder } from "./util/util.js";

dotenv.config();

const app = express();
app.use(express.json());

const port = process.env.PORT;
const io = new Server(7000, {
  cors: {
    origin: "*",
  },
});

const __dirname = path.resolve();
var sessions = {};

io.on("connection", (socket) => {
  socket.join(socket.id);
  const forge = new CharacterForge();

  sessions[socket.id] = {
    character: forge.forge(),
    messages: [],
  };

  socket.emit("character", sessions[socket.id].character);

  socket.on("message", async (message: any) => {
    console.log(`Received message: ${message}`);
    sessions[socket.id].messages.push({ from: "User", message: message });

    const prompt = promptBuilder(sessions[socket.id]);

    try {
      const response = await axios.post(
        "http://localhost:3333/api/kobold",
        {
          prompt: prompt,
        },
        {
          headers: { "Content-Type": "application/json" },
        },
      );
      console.log(`Server rersponded with status code: ${response.status}`);
    } catch (error) {
      console.error(
        `💀 [server]: Error making request to other server: ${error}`,
      );
    }

    socket.emit("message", message);
  });

  socket.on("disconnect", () => {
    console.log(`User disconnected: ${socket.id}`);
    delete sessions[socket.id];
  });
});

app.get("/images/:filename", (req, res) => {});

app.use(express.static(path.join(__dirname, "public")));

app.get("/api/character", (req, res) => {
  const forge = new CharacterForge();
  const character = forge.forge();
  res.send(JSON.stringify(character));
});

app.post("/api/kobold", (req, res) => {
  console.log(req.body);
  res.json({ requestBody: req.body });
});

app.listen(port, () => {
  console.log(`⚡️ [server]: Server is running at http://localhost:${port}.`);
});
