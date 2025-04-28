import { NextRequest } from 'next/server';
import { POST } from './route';

// Mock the fetch function
global.fetch = jest.fn();

// Mock the cookies function
jest.mock('next/headers', () => ({
  cookies: jest.fn().mockReturnValue({
    get: jest.fn().mockReturnValue({ value: 'mock-token.123.456' })
  })
}));

describe('Smart Note Analysis API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return 401 if no token is found', async () => {
    // Override the mock for this test
    require('next/headers').cookies.mockReturnValueOnce({
      get: jest.fn().mockReturnValue(undefined)
    });

    const request = new NextRequest('http://localhost:3000/api/smart-note/analyze', {
      method: 'POST',
      body: JSON.stringify({ content_note: 'Test note content' })
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe('Unauthorized');
  });

  it('should return 400 if content_note is missing', async () => {
    const request = new NextRequest('http://localhost:3000/api/smart-note/analyze', {
      method: 'POST',
      body: JSON.stringify({})
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Content note is required');
  });

  it('should process the analysis request successfully', async () => {
    // Mock successful fetch response
    const mockResponse = {
      success: true,
      data: {
        status: 'success',
        analysis: {
          contentStrategy: {
            overview: {
              category: 'Comedy',
              coreIdea: 'Test idea',
              contentType: 'Short-form Video',
              stage: 'Ideation'
            }
          }
        }
      },
      message: 'Content analyzed successfully'
    };

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: jest.fn().mockResolvedValueOnce(mockResponse)
    });

    const request = new NextRequest('http://localhost:3000/api/smart-note/analyze', {
      method: 'POST',
      body: JSON.stringify({ content_note: 'Test note content' })
    });

    const response = await POST(request);
    const data = await response.json();

    expect(global.fetch).toHaveBeenCalledWith(
      'https://backend.hicontent.co/api/v1/smart-note/analyze',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          'Content-Type': 'application/json',
          'Authorization': 'Bearer mock-token.123.456'
        }),
        body: JSON.stringify({ content_note: 'Test note content' })
      })
    );

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data).toEqual(mockResponse.data);
    expect(data.message).toEqual(mockResponse.message);
    expect(data.suggestedTitle).toBe('Test Idea'); // Check for the extracted title
  });

  it('should handle backend API errors', async () => {
    // Mock failed fetch response
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: jest.fn().mockResolvedValueOnce({ error: 'Backend error' })
    });

    const request = new NextRequest('http://localhost:3000/api/smart-note/analyze', {
      method: 'POST',
      body: JSON.stringify({ content_note: 'Test note content' })
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.success).toBe(false);
    expect(data.error).toBe('Internal Server Error');
  });
});
