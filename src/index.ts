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

const koboldHost = process.env.KB_HOST;
const koboldPort = process.env.KB_PORT;
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
  let character = forge.forge();

  sessions[socket.id] = {
    character: character,
    messages: [
      {
        from: character.name,
        message: "Hi! How are you?",
      },
    ],
  };

  socket.emit("character", sessions[socket.id].character);
  socket.emit("message", {
    from: character.name,
    message: "Hi! How are you?",
  });

  socket.on("message", async (data: any) => {
    const message = data.message
    sessions[socket.id].messages.push({ from: "User", message: message });

    const prompt = promptBuilder(sessions[socket.id]);

    try {
      const response = await axios.post(
        `${koboldHost}:${koboldPort}/api/v1/generate`,
        {
          prompt: prompt,
          use_story: false,
          use_memory: false,
          use_authors_note: false,
          use_world_info: false,
          max_content_length: 1600,
          max_length: 180,
          rep_pen: 1.2,
          rep_pen_range: 1024,
          rep_pen_slope: 0.7,
          temperature: 0.7,
          tfs: 0.9,
          top_a: 0,
          top_k: 0,
          top_p: 0.9,
          typical: 0.1,
          sampler_order: [6, 0, 1, 3, 4, 2, 5],
          singleline: false,
          sampler_seed: 69420,
          sampler_full_determinism: false,
          frmttriminc: false,
          frmtrmblln: false,
          stop_sequence: ["\nUser:", "\nYou:", "\n\n"],
        },
        {
          headers: { "Content-Type": "application/json" },
        },
      );
      console.log(response.data);
      console.log(`Server responded with status code: ${response.status}`);

      const serverMessage = response.data.results[0].text;
      const trimmedMessage = serverMessage.trim();
      const lines = trimmedMessage.split("\n");

      if (
        lines[lines.length - 1].trim() === "You:" ||
        lines[lines.length - 1].trim() === "User:"
      ) {
        lines.pop();
      }

      const finalMessage = lines.join("\n");

      sessions[socket.id].messages.push({
        from: character.name,
        message: finalMessage,
      });
      socket.emit("message", {
        from: character.name,
        message: finalMessage,
      });
    } catch (error) {
      console.error(
        `💀 [server]: Error making request to other server: ${error}`,
      );
    }
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
