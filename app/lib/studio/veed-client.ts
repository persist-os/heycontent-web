import { env } from "@/env.mjs";

interface VeedProject {
  id: string;
  name: string;
  status: "processing" | "ready" | "error";
  url?: string;
}

interface VeedEditOptions {
  autoCut?: boolean;
  removeSilence?: boolean;
  removeFillerWords?: boolean;
  format?: "vertical" | "horizontal" | "square";
  platform?: "tiktok" | "youtube" | "instagram";
}

export class VeedClient {
  private apiKey: string;
  private baseUrl = "https://api.veed.io/v1";

  constructor() {
    this.apiKey = env.VEED_API_KEY;
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
      throw new Error(`Veed API error: ${response.statusText}`);
    }

    return response.json();
  }

  async createProject(name: string): Promise<VeedProject> {
    return this.request("/projects", {
      method: "POST",
      body: JSON.stringify({ name }),
    });
  }

  async uploadMedia(projectId: string, file: File): Promise<{ id: string }> {
    const formData = new FormData();
    formData.append("file", file);

    return this.request(`/projects/${projectId}/media`, {
      method: "POST",
      body: formData,
      headers: {
        "Authorization": `Bearer ${this.apiKey}`,
      },
    });
  }

  async autoEdit(projectId: string, options: VeedEditOptions): Promise<VeedProject> {
    return this.request(`/projects/${projectId}/auto-edit`, {
      method: "POST",
      body: JSON.stringify(options),
    });
  }

  async getProjectStatus(projectId: string): Promise<VeedProject> {
    return this.request(`/projects/${projectId}`);
  }

  async exportProject(projectId: string, format: string): Promise<{ url: string }> {
    return this.request(`/projects/${projectId}/export`, {
      method: "POST",
      body: JSON.stringify({ format }),
    });
  }
} 