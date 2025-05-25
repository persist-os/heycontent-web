import { env } from "@/env.mjs";

interface CanvaDesign {
  id: string;
  name: string;
  url: string;
  thumbnailUrl: string;
}

interface CanvaTemplate {
  id: string;
  name: string;
  thumbnailUrl: string;
  category: string;
}

interface CanvaDesignOptions {
  width: number;
  height: number;
  format: "jpg" | "png" | "pdf";
  quality?: "low" | "medium" | "high";
}

export class CanvaClient {
  private apiKey: string;
  private baseUrl = "https://api.canva.com/v1";

  constructor() {
    this.apiKey = env.CANVA_API_KEY;
  }

  private async request(endpoint: string, options: RequestInit = {}) {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers: {
        "Authorization": `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
        ...options.headers,
      },
    });

    if (!response.ok) {
      throw new Error(`Canva API error: ${response.statusText}`);
    }

    return response.json();
  }

  async createDesign(templateId: string, name: string): Promise<CanvaDesign> {
    return this.request("/designs", {
      method: "POST",
      body: JSON.stringify({
        templateId,
        name,
      }),
    });
  }

  async getTemplates(category?: string): Promise<CanvaTemplate[]> {
    const query = category ? `?category=${category}` : "";
    return this.request(`/templates${query}`);
  }

  async exportDesign(designId: string, options: CanvaDesignOptions): Promise<{ url: string }> {
    return this.request(`/designs/${designId}/export`, {
      method: "POST",
      body: JSON.stringify(options),
    });
  }

  async updateDesign(designId: string, updates: {
    elements?: Array<{
      type: string;
      content: any;
      position: { x: number; y: number };
    }>;
    background?: {
      type: "color" | "image";
      value: string;
    };
  }): Promise<CanvaDesign> {
    return this.request(`/designs/${designId}`, {
      method: "PATCH",
      body: JSON.stringify(updates),
    });
  }
} 