import { GoogleGenAI, Type } from "@google/genai";
import * as XLSX from "xlsx";
import * as mammoth from "mammoth";

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
          title: { type: Type.STRING, description: "Day title in Chinese. Keep it very concise and punchy (e.g., '初识吉隆坡', '探索热带雨林'). Try to keep it within 13 characters for optimal visual layout." },
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
    },
    packingList: {
      type: Type.ARRAY,
      description: "Highly customized list of items/essentials to pack for this trip, categorized (e.g., 证件类, 穿搭衣物, 电子设备, 常用药品, 目的地特色准备). Provide a rich, highly practical selection instead of generic suggestions.",
      items: {
        type: Type.OBJECT,
        properties: {
          category: { type: Type.STRING, description: "Category name in Chinese (e.g., '证件与资金', '户外装备', '个人护理')" },
          items: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: "A list of item/essential text lines"
          }
        },
        required: ["category", "items"]
      }
    },
    budget: {
      type: Type.NUMBER,
      description: "Recommended total travel budget in CNY (Chinese Yuan, integer only like 8500 or 15000) for this trip based on the itinerary days, destinations, transport, activities, hotels, and expected daily expenses."
    }
  },
  required: ["name", "cover", "status", "itinerary", "packingList", "budget"]
};

export async function generateItinerary(prompt: string) {
  const fullPrompt = `You are a professional travel guide. Based on the following request, generate a detailed, scientific, and realistic travel itinerary in Chinese. 
  Request: ${prompt}
  
  Ensure the itinerary and data include:
  1. Realistic daily itinerary titles (title) that are very concise (ideally up to 13 Chinese characters). Keep them simple, engaging, and clear.
  2. Realistic travel times between locations.
  3. A mix of activities (sightseeing, dining, rest).
  4. High-quality Unsplash image URLs for the cover.
  5. Appropriate Lucide icon names for each activity.
  6. A rich, customized, and practical checklist of essentials to pack (packingList) tailored strictly to this destination, the estimated weather/season, and planned activities.
  7. A realistic recommended travel total budget (budget, number field) estimated based on duration, destinations, transportation, and activities.`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
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

export async function generateItineraryFromImage(base64Data: string, mimeType: string) {
  const imagePart = {
    inlineData: {
      mimeType,
      data: base64Data,
    },
  };
  const textPart = {
    text: `You are a professional travel guide. We have uploaded an image representing a travel plan, flight ticket, timetable, brochure, or handwritten itinerary notes. 
    Please extract all information in the image, analyze the detailed itinerary information, and generate a structured, comprehensive, and realistic travel itinerary in Chinese, matching the schema exactly.
    Ensure to generate:
    1. Realistic daily itinerary titles (title) that are very concise (ideally up to 13 Chinese characters).
    2. Realistic travel times/duration between locations.
    3. A mix of activities (sightseeing, food, rest, transportation).
    4. High-quality Unsplash image URLs for the cover.
    5. Appropriate Lucide icon names for each activity.
    6. A rich, customized, and practical checklist of essentials to pack (packingList) tailored strictly to this destination, its weather, and the activities parsed from the image.
    7. A realistic recommended travel total budget (budget, number field) estimated based on duration, destinations, transportation, and activities.`,
  };

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: { parts: [imagePart, textPart] },
      config: {
        responseMimeType: "application/json",
        responseSchema: schema,
      },
    });

    const text = response.text;
    if (!text) throw new Error("No response from AI");
    return JSON.parse(text);
  } catch (error) {
    console.error("Error generating itinerary from image:", error);
    throw error;
  }
}

export async function parseExcel(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        if (!data) throw new Error("Read file empty");
        const workbook = XLSX.read(data, { type: "array" });
        let result = "";
        for (const sheetName of workbook.SheetNames) {
          const sheet = workbook.Sheets[sheetName];
          const csv = XLSX.utils.sheet_to_csv(sheet);
          result += `Sheet: ${sheetName}\n${csv}\n\n`;
        }
        resolve(result);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = () => reject(new Error("File read error"));
    reader.readAsArrayBuffer(file);
  });
}

export async function parseWord(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const arrayBuffer = e.target?.result as ArrayBuffer;
        if (!arrayBuffer) throw new Error("Read file empty");
        const result = await mammoth.extractRawText({ arrayBuffer });
        resolve(result.value || "");
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = () => reject(new Error("File read error"));
    reader.readAsArrayBuffer(file);
  });
}
