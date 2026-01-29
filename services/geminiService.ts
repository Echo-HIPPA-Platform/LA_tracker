import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { Vehicle } from '../types';

const getAiClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    console.error("API_KEY is missing from environment variables.");
    return null;
  }
  return new GoogleGenAI({ apiKey });
};

export const analyzeVehicleHealth = async (vehicle: Vehicle): Promise<string> => {
  const ai = getAiClient();
  if (!ai) return "API Key missing. Cannot generate analysis.";

  const prompt = `
    You are a senior fleet maintenance engineer AI. Analyze the following telemetry data for vehicle ${vehicle.name} (${vehicle.type}).
    
    Current Status: ${vehicle.status}
    Speed: ${vehicle.telemetry.speed} km/h
    RPM: ${vehicle.telemetry.rpm}
    Engine Temp: ${vehicle.telemetry.engineTemp}°C
    Fuel Level: ${vehicle.telemetry.fuelLevel}%
    Battery: ${vehicle.telemetry.batteryVoltage}V
    Tire Pressures (PSI): ${vehicle.telemetry.tirePressure.join(', ')}
    
    Provide a concise, professional assessment in markdown.
    1. Identify any immediate anomalies or safety risks (e.g. high temp, low pressure).
    2. Give a maintenance recommendation.
    3. Rate the driver's current efficiency based on speed/rpm balance (assume highway driving).
    
    Keep it under 150 words.
  `;

  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });
    return response.text || "No analysis generated.";
  } catch (error) {
    console.error("Gemini analysis error:", error);
    return "Failed to analyze vehicle health due to an API error.";
  }
};

export const getFleetInsights = async (vehicles: Vehicle[]): Promise<string> => {
  const ai = getAiClient();
  if (!ai) return "API Key missing.";

  // Summarize data to save tokens
  const summary = vehicles.map(v => ({
    name: v.name,
    status: v.status,
    fuel: v.telemetry.fuelLevel,
    temp: v.telemetry.engineTemp
  }));

  const prompt = `
    You are a logistics operations manager. Here is a snapshot of the current fleet status:
    ${JSON.stringify(summary, null, 2)}
    
    Provide a high-level strategic overview. 
    - How many vehicles are critical?
    - Are there systemic fuel issues?
    - Suggest a routing optimization strategy based on the status mix.
    
    Be brief and actionable.
  `;

  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });
    return response.text || "No insights generated.";
  } catch (error) {
    console.error("Gemini insights error:", error);
    return "Failed to generate fleet insights.";
  }
};
