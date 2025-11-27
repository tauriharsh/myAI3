import { tool } from "ai";
import { z } from "zod";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export const imageGeneration = tool({
  description: `Generate images using DALL-E 3. Use this when the user explicitly asks to:
- "Generate an image"
- "Create a diagram" (for technical diagrams, use this)
- "Show me a visualization"
- "Draw" or "Illustrate" something
- "Make an architecture diagram"

Examples:
- "Generate an AWS Lambda architecture diagram"
- "Create an image of a serverless data pipeline"
- "Draw a diagram showing SAP S/4HANA migration flow"
- "Visualize a 3-tier web architecture"`,
  
  parameters: z.object({
    prompt: z.string().describe("The detailed prompt describing the image to generate"),
    size: z.enum(["1024x1024", "1792x1024", "1024x1792"]).default("1024x1024"),
    quality: z.enum(["standard", "hd"]).default("standard"),
  }),

  async execute({ prompt, size, quality }) {
    try {
      console.log(`[Image Gen] Generating: ${prompt.substring(0, 50)}...`);
      
      // Enhance prompt for technical diagrams
      let enhancedPrompt = prompt;
      if (prompt.toLowerCase().includes("diagram") || 
          prompt.toLowerCase().includes("architecture") ||
          prompt.toLowerCase().includes("flowchart")) {
        enhancedPrompt = `Create a clean, professional technical diagram: ${prompt}. Use a white background, clear labels, standard cloud/tech icons, and simple colors (blues, grays).`;
      }

      const response = await openai.images.generate({
        model: "dall-e-3",
        prompt: enhancedPrompt,
        n: 1,
        size,
        quality,
        response_format: "url",
      });

      const imageUrl = response.data[0]?.url;

      if (!imageUrl) {
        return {
          success: false,
          error: "No image URL returned",
        };
      }

      console.log(`[Image Gen] Success!`);

      return {
        success: true,
        imageUrl,
        message: `Image generated: ![Diagram](${imageUrl})`,
      };
    } catch (error) {
      console.error("[Image Gen] Error:", error);
      
      return {
        success: false,
        error: error instanceof Error ? error.message : "Generation failed",
      };
    }
  },
});
