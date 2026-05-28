import { OpenAI } from "openai";
import * as XLSX from "xlsx";
import * as mammoth from "mammoth";

// 由于文件在 src/services 下，意味着它会在浏览器前端执行
// 必须设置 dangerouslyAllowBrowser: true 才能在前端使用 API Key
const client = new OpenAI({
  baseURL: "https://api.gptsapi.net/v1",
  apiKey: process.env.GEMINI_API_KEY || "", 
  dangerouslyAllowBrowser: true 
});

export async function generateItinerary(prompt: string) {
  const fullPrompt = `You are a professional travel guide. Based on the following request, generate a detailed, scientific, and realistic travel itinerary in Chinese. 
  Request: ${prompt}
  
  Ensure the itinerary is a valid JSON object with the following fields: 
  name, cover, status, itinerary (array of objects), packingList (array of objects), and budget (number).`;

  try {
    const response = await client.chat.completions.create({
      model: "gemini-3.5-flash",
      messages: [
        { role: "system", content: "You are a professional travel guide. Return JSON output only." },
        { role: "user", content: fullPrompt }
      ],
      response_format: { type: "json_object" },
    });

    const content = response.choices[0].message.content;
    return JSON.parse(content || "{}");
  } catch (error) {
    console.error("Error generating itinerary:", error);
    throw error;
  }
}

export async function generateItineraryFromImage(base64Data: string, mimeType: string) {
  try {
    const response = await client.chat.completions.create({
      model: "gemini-3.5-flash",
      messages: [
        { 
          role: "user", 
          content: [
            { type: "text", text: "Extract info from this image and generate a structured travel itinerary in Chinese as a JSON object." },
            { type: "image_url", image_url: { url: `data:${mimeType};base64,${base64Data}` } }
          ] 
        }
      ],
      response_format: { type: "json_object" },
    });

    const content = response.choices[0].message.content;
    return JSON.parse(content || "{}");
  } catch (error) {
    console.error("Error generating itinerary from image:", error);
    throw error;
  }
}

// 文件解析工具保持不变
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
      } catch (err) { reject(err); }
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
      } catch (err) { reject(err); }
    };
    reader.onerror = () => reject(new Error("File read error"));
    reader.readAsArrayBuffer(file);
  });
}
