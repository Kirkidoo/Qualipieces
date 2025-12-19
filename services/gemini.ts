
import { GoogleGenAI } from "@google/genai";
import { OrchestraItem } from "../types";

export class GeminiService {
  private ai: GoogleGenAI;

  constructor() {
    this.ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
  }

  async optimizeDescription(item: OrchestraItem): Promise<string> {
    if (!process.env.API_KEY) return item.description2EN || item.description || "";

    const prompt = `
      Act as an e-commerce SEO specialist. I have a product from an ERP system that needs a high-quality Shopify description.
      
      Original SKU: ${item.itemNumber}
      Original Name: ${item.descriptionEN || item.description}
      Secondary Info: ${item.description2 || 'N/A'}
      Category: ${item.category} / ${item.subCategory}
      
      Task: Generate a professional, engaging, and SEO-friendly product description in HTML format. 
      Use bullet points for features. Do not include price or stock levels. Keep it concise but persuasive.
      Return ONLY the HTML body content.
    `;

    try {
      const response = await this.ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
      });
      return response.text || (item.description2EN || item.description || "");
    } catch (error) {
      console.error("Gemini optimization failed:", error);
      return item.description2EN || item.description || "";
    }
  }
}
