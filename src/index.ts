import axios from "axios";
import { CharacterForge } from "character-forge";
import dotenv from "dotenv";
import express from "express";
import path from "path";
import { Server } from "socket.io";
import {
  imagePromptBuilder,
  negativeImagePromptBuilder,
  processImage,
  promptBuilder,
} from "./util/util.js";
import fs from "fs";
import { v4 as uuidv4 } from "uuid";
import { ElevenLabsApi } from "./tts/elevenlabs_api.js";
import { PlayHtApi } from "./tts/playht_api.js";

dotenv.config();

const app = express();
app.use(express.json());

const kbHost = process.env.KB_HOST;
const kbPort = process.env.KB_PORT;

const sdHost = process.env.SD_HOST;
const sdPort = process.env.SD_PORT;

const port = process.env.PORT;
const io = new Server(7000, {
  cors: {
    origin: "*",
  },
});

const ttsApi = new ElevenLabsApi();

const __dirname = path.resolve();
var sessions = {};

io.on("connection", async (socket) => {
  socket.join(socket.id);
  const forge = new CharacterForge();
  let character = forge.forge();

  sessions[socket.id] = {
    character: character,
    voice: ttsApi.getRandomVoice(character.sex),
    messages: [
      {
        id: 0,
        from: "bot",
        message: "Hi! How are you?",
        audio: undefined,
      },
    ],
  };

  socket.emit("character", sessions[socket.id].character);
  socket.emit("message", {
    from: "bot",
    message: "Hi! How are you?",
  });

  try {
    console.log("Generating image");
    const stableDiffusionResponse = await axios.post(
      `${sdHost}:${sdPort}/sdapi/v1/txt2img`,
      {
        prompt: imagePromptBuilder(sessions[socket.id].character),
        negative_prompt: negativeImagePromptBuilder(
          sessions[socket.id].character.sex,
        ),
        steps: 30,
        cfg_scale: 10,
        width: 512,
        height: 512,
      },
    );

    const generatedImage = await processImage(
      stableDiffusionResponse.data["images"],
    );

    sessions[socket.id].image = generatedImage[0];
    socket.emit("image", sessions[socket.id].image);
  } catch (error) {
    console.error(
      `💀 [server]: Error making request to Stable Diffusion: ${error}`,
    );
  }

  socket.on("message", async (data: any) => {
    const message = data.message;
    sessions[socket.id].messages.push({ from: "user", message: message });
    let audio: {} = {};

    const prompt = promptBuilder(sessions[socket.id]);

    try {
      const koboldResponse = await axios.post(
        `${kbHost}:${kbPort}/api/v1/generate`,
        {
          prompt: prompt,
          use_story: false,
          use_memory: false,
          use_authors_note: false,
          use_world_info: false,
          max_content_length: 1000,
          max_length: 180,
          rep_pen: 1.2,
          rep_pen_range: 1024,
          rep_pen_slope: 0.7,
          temperature: 0.2,
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
      console.log(
        `Server responded with status code: ${koboldResponse.status}`,
      );

      const serverMessage = koboldResponse.data.results[0].text;
      let trimmedMessage = serverMessage.trim();

      if (trimmedMessage.startsWith(`${character.name}:`)) {
        trimmedMessage = trimmedMessage
          .replace(`${character.name}:`, "")
          .trim();
      }

      const finalMessage = trimmedMessage.split("\n")[0];

      if (character.name !== "user") {
        const messageId = uuidv4();

        socket.emit("message", {
          id: messageId,
          from: "bot",
          message: finalMessage,
        });

        const ttsResponse = await ttsApi.getTextToSpeech(
          sessions[socket.id].voice,
          finalMessage,
        );

        if (ttsResponse != null) {
          audio = {
            filename: ttsResponse,
            id: messageId,
          };
          socket.emit("tts", audio);
        }

        sessions[socket.id].messages.push({
          id: messageId,
          from: "bot",
          message: finalMessage,
          audio: audio,
        });
      } else {
        const messageId = uuidv4();

        sessions[socket.id].messages.push({
          from: "bot",
          message: finalMessage,
          id: messageId,
        });

        socket.emit("message", {
          from: "bot",
          message: finalMessage,
          id: messageId,
        });
      }
    } catch (error) {
      console.error(`💀 [server]: Error making request to Kobold AI: ${error}`);
    }
  });

  socket.on("disconnect", async () => {
    console.log(`User disconnected: ${socket.id}`);

    if (sessions[socket.id].image) {
      fs.unlink(sessions[socket.id].image, (err) => {
        if (err) {
          console.error(`💀 [server]: Error deleting image: ${err}`);
        }
      });
    }

    delete sessions[socket.id];
  });
});

app.use("/output/", express.static(path.join(__dirname, "output")));

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
