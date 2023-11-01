import axios from "axios";
import fs from "fs";
import { v4 as uuidv4 } from "uuid";
import { processFile } from "../util/util.js";
import dotenv from "dotenv";

export class ElevenLabsApi {
  private baseUrl: string;
  private apiKey: string;

  constructor() {
    dotenv.config();

    this.baseUrl = "https://api.elevenlabs.io";
    this.apiKey = process.env.ELEVENLABS_API_KEY;
  }

  async getTextToSpeech(voiceId: string, text: string): Promise<string> {
    const url = `${this.baseUrl}v1/text-to-speech/${voiceId}/stream`;

    try {
      if (!fs.existsSync("output")) {
        fs.mkdirSync("output");
      }

      const response = await axios.post(
        url,
        {
          text: text,
          model_id: "eleven_multilingual_v2",
          voice_settings: { stability: 0.5, similarity_boost: 0.5 },
        },
        {
          headers: {
            accept: "audio/mpeg",
            "Content-Type": "application/json",
            "xi-api-key": this.apiKey,
          },
          responseType: "stream",
        },
      );
      const uuid = uuidv4();
      response.data.pipe(fs.createWriteStream(`output/audios/${uuid}.mp3`));

      return `output/audios/${uuid}.mp3`;
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

  getRandomVoiceId(gender: string) {
    const voices = processFile("elevenlabs_voices").voices.filter(
      (voice: { labels: { gender: string } }) => voice.labels.gender === gender,
    );

    if (voices.length === 0) {
      return null;
    }

    const randomVoice = voices[Math.floor(Math.random() * voices.length)];
    return randomVoice.voice_id;
  }
}
