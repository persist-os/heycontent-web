import { ConvexHttpClient } from 'convex/browser';

export class ConvexClient {
  private client: ConvexHttpClient;

  constructor() {
    this.client = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);
  }

  async query(query: any, args: any) {
    return await this.client.query(query, args);
  }

  async mutation(mutation: any, args: any) {
    return await this.client.mutation(mutation, args);
  }

  async action(action: any, args: any) {
    return await this.client.action(action, args);
  }
}