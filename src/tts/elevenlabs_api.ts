import axios, { AxiosRequestConfig } from "axios";
import fs from "fs";
import { v4 as uuidv4 } from "uuid";
import { processFile } from "../util/util.js";
import dotenv from "dotenv";
import { VoiceModel } from "./voice_model.js";

export class ElevenLabsApi {
  private baseUrl: string;
  private apiKey: string;

  constructor() {
    dotenv.config();

    this.baseUrl = "https://api.elevenlabs.io";
    this.apiKey = process.env.ELEVENLABS_API_KEY;
  }

  async getTextToSpeech(voice: VoiceModel, text: string): Promise<string> {
    const url = `${this.baseUrl}/v1/text-to-speech/${voice.id}/stream`;

    try {
      if (!fs.existsSync("output")) {
        fs.mkdirSync("output");
      }

      console.log(`🤖 [server]: Making Text-to-Speech request to ElevenLabs...`);

      const streamOptions: AxiosRequestConfig = {
        method: "POST",
        url: url,
        data: {
          text: text,
          model_id: "eleven_multilingual_v2",
          voice_settings: { stability: 0.5, similarity_boost: 0.5 },
        },
        headers: {
          accept: "audio/mpeg",
          "Content-Type": "application/json",
          "xi-api-key": this.apiKey,
        },
        responseType: "stream",
      };

      const response = await axios(streamOptions);

      const uuid = uuidv4();
      const writer = fs.createWriteStream(`output/audios/${uuid}.mp3`);

      return new Promise((resolve, reject) => {
        writer.on("finish", () => {
          console.log(`🤖 [server]: ElevenLabs' audio ${uuid}.mp3 saved.`);
          resolve(`output/audios/${uuid}.mp3`);
        });

        writer.on("error", (error) => {
          console.error(
            `💀 [server]: Error saving audio ${uuid}.mp3: ${error}`,
          );
          reject(error);
        });

        response.data.pipe(writer);
      });
    } catch (error) {
      console.error(
        `💀 [server]: Error making Text-to-Speech request to ElevenLabs: ${error}`,
      );
    }
  }

  async getVoices(): Promise<any> {
    const url = `${this.baseUrl}/v1/voices`;
    try {
      const response = await axios.get(url, {
        headers: {
          accept: "application/json",
          "xi-api-key": this.apiKey,
        },
      });
      return response.data;
    } catch (error) {
      console.error(
        `💀 [server]: Error while getting voices from ElevenLabs: ${error}`,
      );
    }
  }

  getRandomVoice(gender: string): VoiceModel {
    const voices = processFile("elevenlabs_voices").voices.filter(
      (voice: { labels: { gender: string } }) => voice.labels.gender === gender,
    );

    if (voices.length === 0) {
      return null;
    }

    const randomVoice = voices[Math.floor(Math.random() * voices.length)];
    const voiceModel: VoiceModel = new VoiceModel(
      randomVoice.name,
      randomVoice.voice_id,
      randomVoice.labels.gender,
      null,
      null,
      null,
    );

    return voiceModel;
  }
}
