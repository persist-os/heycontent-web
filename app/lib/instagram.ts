export class InstagramAPI {
  constructor(private accessToken: string) {}

  async getMetrics(metric: string, timeframe: string) {
    // Implementation will come later
    return {
      metric,
      timeframe,
      value: 0
    };
  }
} 