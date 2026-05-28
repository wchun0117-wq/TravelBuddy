import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

const schema = {
  type: Type.OBJECT,
  properties: {
    name: { type: Type.STRING, description: "Trip name" },
    cover: { type: Type.STRING, description: "Cover image URL (use a high-quality Unsplash URL related to the destination)" },
    status: { type: Type.STRING, description: "Trip status (e.g., '规划中')" },
    itinerary: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          id: { type: Type.NUMBER },
          date: { type: Type.STRING, description: "Date string (e.g., '4月4日')" },
          day: { type: Type.STRING, description: "Day of week (e.g., '周四')" },
          location: { type: Type.STRING, description: "Location name" },
          title: { type: Type.STRING, description: "Day title" },
          details: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                id: { type: Type.STRING },
                time: { type: Type.STRING, description: "Time string (e.g., '09:00')" },
                iconName: { type: Type.STRING, description: "Lucide icon name (e.g., 'Plane', 'MapPin', 'Coffee', 'Utensils', 'Camera', 'Hotel')" },
                text: { type: Type.STRING, description: "Activity description" },
                sub: { type: Type.STRING, description: "Sub-info or notes" },
                isTransport: { type: Type.BOOLEAN, description: "Whether this is a transport activity" }
              },
              required: ["id", "time", "iconName", "text"]
            }
          }
        },
        required: ["id", "date", "day", "location", "title", "details"]
      }
    }
  },
  required: ["name", "cover", "status", "itinerary"]
};

export async function generateItinerary(prompt: string) {
  const fullPrompt = `You are a professional travel guide. Based on the following request, generate a detailed, scientific, and realistic travel itinerary in Chinese. 
  Request: ${prompt}
  
  Ensure the itinerary includes:
  1. Realistic travel times between locations.
  2. A mix of activities (sightseeing, dining, rest).
  3. High-quality Unsplash image URLs for the cover.
  4. Appropriate Lucide icon names for each activity.`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: fullPrompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: schema,
      },
    });

    const text = response.text;
    if (!text) throw new Error("No response from AI");
    return JSON.parse(text);
  } catch (error) {
    console.error("Error generating itinerary:", error);
    throw error;
  }
}
