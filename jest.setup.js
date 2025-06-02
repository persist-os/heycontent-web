/* eslint-disable */
require('openai/shims/node');
const { TextEncoder, TextDecoder } = require('util');
const { fetch, Headers, Request, Response } = require('cross-fetch');
const { ReadableStream, WritableStream, TransformStream } = require('stream/web');

global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;
global.fetch = fetch;
global.Headers = Headers;
global.Request = Request;
global.Response = Response;
global.ReadableStream = ReadableStream;
global.WritableStream = WritableStream;
global.TransformStream = TransformStream;

// Mock environment variables
process.env.OPENAI_API_KEY = 'test-api-key';
process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID = 'test-client-id';
process.env.NEXT_PUBLIC_GOOGLE_CLIENT_SECRET = 'test-client-secret';
process.env.GOOGLE_REDIRECT_URI = 'http://localhost:3000/api/auth/callback/google';
process.env.GMAIL_REDIRECT_URI = 'http://localhost:3000/api/social/callback/gmail';
process.env.NEXT_PUBLIC_CONVEX_URL = 'https://test-convex-url.convex.cloud';

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  // Uncomment to silence specific console methods during tests
  // log: jest.fn(),
  // error: jest.fn(),
  // warn: jest.fn(),
}; 