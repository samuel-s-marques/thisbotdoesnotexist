import sharp from "sharp";
import fs from "fs";
import { v4 as uuidv4 } from "uuid";
import { Character } from "character-forge";

/**
 * Processes an array of base64-encoded images, saves them to disk, and returns an array of their file paths.
 * @param images An array of base64-encoded images.
 * @returns An array of file paths where the processed images were saved.
 */
export async function processImage(images: string[]): Promise<string[]> {
  const listOfImages: string[] = [];

  try {
    for (const i of images) {
      const imageData = Buffer.from(i, "base64");

      const image = sharp(imageData);
      const outputImageBuffer = await image.toBuffer();
      const uuid = uuidv4();

      if (!fs.existsSync("output")) {
        fs.mkdirSync("output");
      }

      fs.writeFileSync(`output/${uuid}.png`, outputImageBuffer);
      listOfImages.push(`output/${uuid}.png`);
    }

    console.log("Images processed and saved.");
  } catch (error) {
    console.error("Error processing images: ", error);
  }

  return listOfImages;
}

/**
 * Extends the Array prototype with a new method called formattedJoin.
 * This method joins the elements of an array into a string, with a comma and space between each element.
 * The last element is preceded by "and" instead of a comma.
 * If the array is empty, an empty string is returned.
 * @returns {string} The formatted string.
 */
declare global {
  interface Array<T> {
    formattedJoin(): string;
  }
}

Array.prototype.formattedJoin = function () {
  if (this.length > 1) {
    return this.join(", ").replace(/, ([^,]*)$/, ", and $1");
  } else if (this.length === 1) {
    return this[0];
  }

  return "";
};

/**
 * Builds an image prompt string based on the given character object.
 * @param character - The character object to build the prompt from.
 * @returns The generated image prompt string.
 */
export function imagePromptBuilder(character: Character) {
  let prompt = "RAW Photo, DSLR BREAK ";

  prompt += `${character.bodyType.type} `;
  prompt += `${character.ethnicity} ${character.occupation}, `;
  prompt += `${character.age} years old ${character.sex}, `;
  prompt += `${character.hairColor} color ${character.hairStyle} hairstyle, `;
  prompt += `${character.eyeColor} eyes, `;
  prompt += `wearing ${character.clothings.upperbody}`;

  if (character.clothings.accessories.length !== 0) {
    prompt += `, wearing ${character.clothings.accessories.formattedJoin()}`;
  }

  prompt += ", (looking at viewer), focused, detailed, natural light";

  console.log(prompt);

  return prompt;
}

export function negativeImagePromptBuilder(sex: string): string {
  let negativePrompts = [
    "paintings",
    "sketches",
    "(worst quality: 2)",
    "(low quality: 2)",
    "(normal quality: 2)",
    "lowres",
    "((monochrome))",
    "((grayscale))",
    "bad anatomy",
    "DeepNegative",
    "facing away",
    "looking away",
    "tilted head",
    "bad hands",
    "text",
    "error",
    "missing fingers",
    "cropped",
    "low quality",
    "normal quality",
    "jpeg artifacts",
    "watermark",
    "blurry",
    "long neck",
    "deformed",
  ];

  if (sex === "male") {
    negativePrompts.push("female");
  } else {
    negativePrompts.push("male");
  }

  return negativePrompts.join(", ");
}

export function promptBuilder(session: any): string {
  let prompt: string = `${session.character.name}'s Persona: ${session.character.summary}.`;
  let lastMessages = session.messages.slice(-5);

  for (let message of lastMessages) {
    if (message.from === "User") {
      prompt += `${message.message}\n${session.character.name}:`;
    } else {
      prompt += `\n${session.character.name}: ${message.message}\nUser:`;
    }
  }

  return prompt;
}
