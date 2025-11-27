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
- "Visualize a 3-tier web architecture"

Note: This generates visual images/diagrams, not just descriptions. For text-based architecture descriptions, don't use this tool.`,
  
  parameters: z.object({
    prompt: z.string().describe("The detailed prompt describing the image to generate. Be specific about technical details, architecture components, colors, and style. For technical diagrams, mention 'technical diagram', 'architecture diagram', 'flowchart', etc."),
    size: z.enum(["1024x1024", "1792x1024", "1024x1792"]).optional().describe("Image size. Use 1792x1024 for wide diagrams/architectures"),
    quality: z.enum(["standard", "hd"]).optional().describe("Image quality. Use 'hd' for detailed technical diagrams"),
  }),

  execute: async ({ prompt, size = "1024x1024", quality = "standard" }) => {
    try {
      console.log(`[Image Gen] Generating image: ${prompt.substring(0, 50)}...`);
      
      // Enhance prompt for technical diagrams
      let enhancedPrompt = prompt;
      if (prompt.toLowerCase().includes("diagram") || 
          prompt.toLowerCase().includes("architecture") ||
          prompt.toLowerCase().includes("flowchart")) {
        enhancedPrompt = `Create a clean, professional technical diagram: ${prompt}. 
Use a white background, clear labels, standard cloud/tech icons where applicable, 
and a simple color scheme (blues, grays). Make it look like a professional 
architecture diagram you'd see in official documentation.`;
      }

      const response = await openai.images.generate({
        model: "dall-e-3",
        prompt: enhancedPrompt,
        n: 1,
        size: size,
        quality: quality,
        response_format: "url",
      });

      const imageUrl = response.data[0]?.url;
      const revisedPrompt = response.data[0]?.revised_prompt;

      if (!imageUrl) {
        throw new Error("No image URL returned from DALL-E");
      }

      console.log(`[Image Gen] Successfully generated image`);

      return {
        success: true,
        imageUrl,
        revisedPrompt,
        message: "Image generated successfully. Display this to the user with markdown: ![Generated Image](url)",
      };
    } catch (error) {
      console.error("[Image Gen] Error:", error);
      
      return {
        success: false,
        error: error instanceof Error ? error.message : "Image generation failed",
        message: "I encountered an error generating the image. Please try rephrasing your request or describing the image differently.",
      };
    }
  },
});
