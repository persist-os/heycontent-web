export class AuthenticationError extends Error {
  constructor(message: string = 'We couldn\'t verify your account. Please sign in again to continue your creative journey!') {
    super(message);
    this.name = 'AuthenticationError';
  }
}

export class ServiceUnavailableError extends Error {
  constructor(message: string = 'Our creative engines are warming up! Please try again in a moment. Your content is safe with us.') {
    super(message);
    this.name = 'ServiceUnavailableError';
  }
}

export class APIError extends Error {
  constructor(message: string = 'We hit a creative block while processing your request. Our team has been notified and will get things flowing again soon!') {
    super(message);
    this.name = 'APIError';
  }
} 