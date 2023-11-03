import dotenv from "dotenv";
import axios, { AxiosRequestConfig } from "axios";

export class KoboldApi {
  private baseUrl: string;

  constructor() {
    dotenv.config();

    const host = process.env.KB_HOST;
    const port = process.env.KB_PORT;

    this.baseUrl = `${host}:${port}`;

    if (!port) {
      this.baseUrl = host;
    }

    this.baseUrl = `${this.baseUrl}/api/v1/generate`;
  }

  async getResponse(prompt: string, characterName: string): Promise<string> {
    try {
      console.log(`🤖 [server]: Making request to Kobold AI.`);

      const requestOptions: AxiosRequestConfig = {
        method: "POST",
        url: this.baseUrl,
        headers: {
          "Content-Type": "application/json",
        },
        data: {
          prompt: prompt,
          use_story: false,
          use_memory: false,
          use_authors_note: false,
          use_world_info: false,
          max_context_length: 2048,
          max_length: 200,
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
          stop_sequence: ["\nUser:", "\nYou:", "\n\n", `\n${characterName}:`],
        },
      };

      const response = await axios(requestOptions);

      console.log(`🤖 [server]: Kobold AI response returned successfully.`);
      return response.data.results[0].text;
    } catch (error) {
      console.error(`💀 [server]: Error making request to Kobold AI: ${error}`);
    }
  }
}
