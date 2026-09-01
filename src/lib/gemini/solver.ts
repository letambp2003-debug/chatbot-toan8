import { GoogleGenAI } from "@google/genai";
import { runIntelligentGeminiSolver } from "./intelligent_solver";
import type { KnowledgeChunk } from "@/types/knowledge";

export interface GeminiSolverOptions {
  aiClient: GoogleGenAI;
  systemInstruction: string;
  userPrompt: string;
  imageBase64?: string;
  imageMimeType?: string;
  feedback?: string;
  retrievedChunks?: KnowledgeChunk[];
}

export async function runGeminiSolver(options: GeminiSolverOptions): Promise<string> {
  return runIntelligentGeminiSolver(options);
}

export async function generateMathSolution(options: {
  prompt: string;
  systemInstruction: string;
  imageBase64?: string;
  imageMimeType?: string;
  feedback?: string;
  aiClient: GoogleGenAI;
  retrievedChunks?: KnowledgeChunk[];
}): Promise<{ text: string }> {
  const text = await runGeminiSolver({
    aiClient: options.aiClient,
    systemInstruction: options.systemInstruction,
    userPrompt: options.prompt,
    imageBase64: options.imageBase64,
    imageMimeType: options.imageMimeType,
    feedback: options.feedback,
    retrievedChunks: options.retrievedChunks,
  });
  return { text };
}
