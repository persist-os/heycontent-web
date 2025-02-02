import { SocialPlatform } from '../../types/social-platforms';

export interface PendingRequest<T = unknown> {
  id: string;
  service: ServiceType;
  type: 'auth' | 'connection' | 'data';
  timestamp: Date;
  data?: T;
  resolve: (value: T) => void;
  reject: (error: Error) => void;
}

export interface ServiceState {
  isAuthenticated: boolean;
  isConnected: boolean;
  lastSync: Date | null;
  error?: string;
  pendingRequests: Array<PendingRequest<unknown>>;
}

// Define all possible service types
export type ServiceType = 
  | SocialPlatform    // 'instagram' | 'youtube' | 'tiktok' | 'gmail'
  | 'memory'          // Memory system service
  | 'rag';            // RAG system service

export class ServiceStateManager {
  private states: Map<ServiceType, ServiceState>;
  private static instance: ServiceStateManager;

  private constructor() {
    this.states = new Map();
  }

  // Singleton pattern to ensure only one instance exists
  public static getInstance(): ServiceStateManager {
    if (!ServiceStateManager.instance) {
      ServiceStateManager.instance = new ServiceStateManager();
    }
    return ServiceStateManager.instance;
  }

  // Initialize a service state if it doesn't exist
  private initializeState(service: ServiceType): ServiceState {
    if (!this.states.has(service)) {
      this.states.set(service, {
        isAuthenticated: false,
        isConnected: false,
        lastSync: null,
        pendingRequests: []
      });
    }
    return this.states.get(service)!;
  }

  // Get the current state of a service
  public async getState(service: ServiceType): Promise<ServiceState> {
    return this.initializeState(service);
  }

  // Update the state of a service
  public async updateState(
    service: ServiceType, 
    updates: Partial<Omit<ServiceState, 'pendingRequests'>>
  ): Promise<ServiceState> {
    const currentState = this.initializeState(service);
    const newState = {
      ...currentState,
      ...updates,
      // Ensure pendingRequests can't be overwritten directly
      pendingRequests: currentState.pendingRequests
    };
    this.states.set(service, newState);
    return newState;
  }

  // Add a pending request
  public async addPendingRequest<T>(
    service: ServiceType,
    type: PendingRequest['type'],
    data?: T
  ): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      const state = this.initializeState(service);
      const request: PendingRequest<T> = {
        id: Math.random().toString(36).substring(7),
        service,
        type,
        timestamp: new Date(),
        data,
        resolve,
        reject
      };
      // Cast the request to match the array type
      state.pendingRequests.push(request as PendingRequest<unknown>);
      this.states.set(service, state);
    });
  }

  // Resolve a pending request
  public async resolvePendingRequest<T>(
    service: ServiceType, 
    requestId: string, 
    result: T
  ): Promise<void> {
    const state = this.initializeState(service);
    const requestIndex = state.pendingRequests.findIndex(req => req.id === requestId);
    
    if (requestIndex >= 0) {
      const request = state.pendingRequests[requestIndex] as PendingRequest<T>;
      state.pendingRequests.splice(requestIndex, 1);
      this.states.set(service, state);
      request.resolve(result);
    }
  }

  // Check if a service needs authentication
  public async checkAuthentication(service: ServiceType): Promise<boolean> {
    const state = await this.getState(service);
    return state.isAuthenticated;
  }

  // Request authentication for a service
  public async requestAuthentication(service: ServiceType): Promise<void> {
    return this.addPendingRequest(service, 'auth');
  }

  // Mark a service as authenticated
  public async setAuthenticated(service: ServiceType, isAuthenticated: boolean): Promise<void> {
    await this.updateState(service, { isAuthenticated });
  }

  // Get all pending requests for a service
  public async getPendingRequests(service: ServiceType): Promise<PendingRequest[]> {
    const state = await this.getState(service);
    return state.pendingRequests;
  }

  // Clear error state
  public async clearError(service: ServiceType): Promise<void> {
    await this.updateState(service, { error: undefined });
  }

  // Set error state
  public async setError(service: ServiceType, error: string): Promise<void> {
    if (typeof error !== 'string' || !error.trim()) {
      throw new Error('Invalid error message');
    }
    await this.updateState(service, { error: error.trim() });
  }
}

// Export a singleton instance
export const serviceStateManager = ServiceStateManager.getInstance(); 