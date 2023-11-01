import axios, { AxiosRequestConfig } from "axios";
import fs from "fs";
import { v4 as uuidv4 } from "uuid";
import { processFile } from "../util/util.js";
import dotenv from "dotenv";
import { VoiceModel } from "./voice_model.js";

export type Emotion =
  | "female_happy"
  | "female_sad"
  | "female_angry"
  | "female_fearful"
  | "female_disgust"
  | "female_surprised"
  | "male_happy"
  | "male_sad"
  | "male_angry"
  | "male_fearful"
  | "male_disgust"
  | "male_surprised";

export class PlayHtApi {
  private baseUrl: string;
  private userId: string;
  private apiKey: string;

  constructor() {
    dotenv.config();

    this.baseUrl = "https://api.play.ht";
    this.userId = process.env.PLAYHT_USER_ID;
    this.apiKey = process.env.PLAYHT_API_KEY;
  }

  async saveAudio(text: string, voice: VoiceModel): Promise<string> {
    const url = `${this.baseUrl}/api/v2/tts/stream`;

    try {
      if (!fs.existsSync("output")) {
        fs.mkdirSync("output");
      }

      console.log(`🤖 [server]: Making Text-to-Speech request to PlayHT...`);

      const streamOptions: AxiosRequestConfig = {
        method: "POST",
        url: url,
        headers: {
          accept: "audio/mpeg",
          "Content-Type": "application/json",
          AUTHORIZATION: this.apiKey,
          "X-USER-ID": this.userId,
        },
        responseType: "stream",
        data: {
          text: text,
          voice: voice.id,
          quality: "draft", // TODO: change quality to test it
          output_format: "mp3",
          voice_engine: voice.engine,
        }
      };

      const response = await axios(streamOptions);

      const uuid = uuidv4();
      const writer = fs.createWriteStream(`output/audios/${uuid}.mp3`);

      return new Promise((resolve, reject) => {
        writer.on("finish", () => {
          console.log(`🤖 [server]: PlayHT's audio ${uuid}.mp3 saved.`);
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
        `💀 [server]: Error making Text-to-Speech request to PlayHT: ${error}`,
      );
    }
  }

  async getTextToSpeech(voice: VoiceModel, text: string): Promise<string> {
    try {
      const audioPath = await this.saveAudio(text, voice);
      return audioPath;
    } catch (error) {
      console.error(
        `💀 [server]: Error making Text-to-Speech request to PlayHT: ${error}`,
      );
    }
  }

  async getVoices(): Promise<any> {
    const url = `${this.baseUrl}/api/v2/voices`;
    try {
      const response = await axios.get(url, {
        headers: {
          AUTHORIZATION: this.apiKey,
          'X-USER-ID': this.userId,
        },
      });
      return response.data;
    } catch (error) {
      console.error(
        `💀 [server]: Error while getting voices from PlayHT: ${error}`,
      );
    }
  }

  getRandomVoice(gender: string): VoiceModel {
    const voices = processFile("playht_voices").filter(
      (voice: { gender: string; voice_engine: string }) =>
        voice.gender === gender && voice.voice_engine != "PlayHT1.0",
    );

    if (voices.length === 0) {
      return null;
    }

    const randomVoice = voices[Math.floor(Math.random() * voices.length)];
    const voiceModel: VoiceModel = new VoiceModel(
      randomVoice.name,
      randomVoice.id,
      randomVoice.gender,
      randomVoice.voice_engine,
      null,
      randomVoice.language,
    );
    return voiceModel;
  }
}
