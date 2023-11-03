import dotenv from "dotenv";
import axios, { AxiosRequestConfig } from "axios";

export class OobaboogaApi {
  private baseUrl: string;

  constructor() {
    dotenv.config();

    const host = process.env.OB_HOST;
    const port = process.env.OB_PORT;

    this.baseUrl = `${host}:${port}`;

    if (!port) {
      this.baseUrl = host;
    }

    this.baseUrl = `${this.baseUrl}/api/v1/generate`;
  }

  async getResponse(prompt: string, characterName: string): Promise<string> {
    try {
      console.log(`🤖 [server]: Making request to Oobabooga AI.`);

      const requestOptions: AxiosRequestConfig = {
        method: "POST",
        url: this.baseUrl,
        headers: {
          "Content-Type": "application/json",
        },
        data: {
          prompt: prompt,
          max_context_length: 2048,
          max_length: 200,
          repetition_penalty: 1.2,
          repetition_penalty_range: 1024,
          repetition_penalty_slope: 0.7,
          temperature: 0.2,
          tfs: 0.9,
          top_a: 0,
          top_k: 0,
          top_p: 0.9,
          typical: 0.1,
          sampler_order: [6, 0, 1, 3, 4, 2, 5],
          singleline: false,
          ban_eos_token: false,
          stopping_strings: ["\nUser:", "\nYou:", "\n\n", `\n${characterName}:`],
        },
      };

      const response = await axios(requestOptions);

      console.log(`🤖 [server]: Oobabooga AI response returned successfully.`);
      return response.data.results[0].text;
    } catch (error) {
      console.error(`💀 [server]: Error making request to Oobabooga AI: ${error}`);
    }
  }
}
