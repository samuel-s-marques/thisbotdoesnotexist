import axios from "axios";
import fs from "fs";
import { v4 as uuidv4 } from "uuid";

type VoiceId = {
  id: string;
  gender: string;
};

export class TextToSpeechApi {
  private baseUrl: string;
  private apiKey: string;
  public defaultVoiceIds: VoiceId[] = [
    {
      id: "21m00Tcm4TlvDq8ikWAM",
      gender: "female",
    },
    {
      id: "AZnzlk1XvdvUeBnXmlld",
      gender: "female",
    },
    { id: "zcAOhNBS3c14rBihAFp1", gender: "male" },
  ];

  constructor(apiUrl: string, apiKey: string) {
    this.baseUrl = apiUrl;
    this.apiKey = apiKey;
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
    const filteredVoiceIds = this.defaultVoiceIds.filter(
      (item) => item.gender === gender,
    );
    const randomIndex = Math.floor(Math.random() * filteredVoiceIds.length);
    return filteredVoiceIds[randomIndex].id;
  }
}
