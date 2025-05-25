import { env } from "@/env.mjs";
import { GoogleGenerativeAI } from "@google/generative-ai";
import OpenAI from "openai";

interface CoachingFeedback {
  type: "pacing" | "clarity" | "emphasis" | "energy";
  message: string;
  timestamp: number;
  confidence: number;
}

interface TranscriptionResult {
  text: string;
  segments: Array<{
    text: string;
    start: number;
    end: number;
    confidence: number;
  }>;
}

export class AICoach {
  private openai: OpenAI;
  private gemini: GoogleGenerativeAI;
  private model: "gpt-4o" | "gemini-pro";

  constructor(model: "gpt-4o" | "gemini-pro" = "gpt-4o") {
    this.openai = new OpenAI({
      apiKey: env.OPENAI_API_KEY,
    });
    this.gemini = new GoogleGenerativeAI(env.GEMINI_API_KEY);
    this.model = model;
  }

  async analyzeSpeech(audioBuffer: ArrayBuffer): Promise<CoachingFeedback[]> {
    // First, transcribe the audio
    const transcription = await this.transcribeAudio(audioBuffer);
    
    // Then, analyze the transcription for feedback
    if (this.model === "gpt-4o") {
      return this.analyzeWithGPT(transcription);
    } else {
      return this.analyzeWithGemini(transcription);
    }
  }

  private async transcribeAudio(audioBuffer: ArrayBuffer): Promise<TranscriptionResult> {
    const response = await this.openai.audio.transcriptions.create({
      file: new File([audioBuffer], "audio.wav", { type: "audio/wav" }),
      model: "whisper-1",
      response_format: "verbose_json",
    });

    return response as unknown as TranscriptionResult;
  }

  private async analyzeWithGPT(transcription: TranscriptionResult): Promise<CoachingFeedback[]> {
    const response = await this.openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: "You are an expert public speaking coach. Analyze the following transcription and provide real-time feedback on pacing, clarity, emphasis, and energy. Focus on actionable, specific feedback that can be implemented immediately."
        },
        {
          role: "user",
          content: transcription.text
        }
      ],
      temperature: 0.7,
    });

    // Parse the response into structured feedback
    const feedback: CoachingFeedback[] = [];
    // Implementation details for parsing GPT response...
    return feedback;
  }

  private async analyzeWithGemini(transcription: TranscriptionResult): Promise<CoachingFeedback[]> {
    const model = this.gemini.getGenerativeModel({ model: "gemini-pro" });
    const result = await model.generateContent([
      "You are an expert public speaking coach. Analyze the following transcription and provide real-time feedback on pacing, clarity, emphasis, and energy. Focus on actionable, specific feedback that can be implemented immediately.",
      transcription.text
    ]);

    // Parse the response into structured feedback
    const feedback: CoachingFeedback[] = [];
    // Implementation details for parsing Gemini response...
    return feedback;
  }

  async generateScriptPrompt(topic: string, style: string): Promise<string> {
    const prompt = `Create a script for a ${style} video about ${topic}. Include hooks, key points, and a call to action. Format it for easy reading with clear sections.`;

    if (this.model === "gpt-4o") {
      const response = await this.openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: "You are an expert content creator. Create engaging, natural-sounding scripts that are easy to read and deliver."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.7,
      });

      return response.choices[0].message.content || "";
    } else {
      const model = this.gemini.getGenerativeModel({ model: "gemini-pro" });
      const result = await model.generateContent([
        "You are an expert content creator. Create engaging, natural-sounding scripts that are easy to read and deliver.",
        prompt
      ]);

      return result.response.text();
    }
  }
} 