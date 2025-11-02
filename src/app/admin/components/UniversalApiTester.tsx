'use client';

import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { RouteList, ApiRoute } from './RouteList';
import { fetchWithApiKey } from '@/app/lib/api-helpers';

interface TestHistoryItem {
  route: string;
  method: string;
  timestamp: number;
  status: number;
  success: boolean;
}

export function UniversalApiTester() {
  const [selectedRoute, setSelectedRoute] = useState<ApiRoute | null>(null);
  const [requestBody, setRequestBody] = useState('{}');
  const [headers, setHeaders] = useState('{}');
  const [response, setResponse] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [testHistory, setTestHistory] = useState<TestHistoryItem[]>([]);

  const executeTest = async () => {
    if (!selectedRoute) return;
    
    setLoading(true);
    setResponse(null);
    
    try {
      let parsedHeaders = {};
      let parsedBody = null;
      
      try {
        parsedHeaders = headers ? JSON.parse(headers) : {};
      } catch (e) {
        setResponse({ error: 'Invalid JSON in headers' });
        setLoading(false);
        return;
      }
      
      if (selectedRoute.method !== 'GET' && requestBody) {
        try {
          parsedBody = JSON.parse(requestBody);
        } catch (e) {
          setResponse({ error: 'Invalid JSON in request body' });
          setLoading(false);
          return;
        }
      }
      
      const result = await fetchWithApiKey(selectedRoute.path, {
        method: selectedRoute.method,
        headers: {
          'Content-Type': 'application/json',
          ...parsedHeaders,
        },
        body: parsedBody ? JSON.stringify(parsedBody) : undefined,
      });
      
      let data;
      try {
        data = await result.json();
      } catch (e) {
        data = { error: 'Response was not JSON' };
      }
      
      setResponse({ 
        status: result.status, 
        statusText: result.statusText,
        data 
      });
      
      setTestHistory(prev => [{
        route: selectedRoute.path,
        method: selectedRoute.method,
        timestamp: Date.now(),
        status: result.status,
        success: result.ok,
      }, ...prev].slice(0, 50));
      
    } catch (error: any) {
      setResponse({ 
        error: error?.message || 'Request failed',
        details: error.toString()
      });
      
      setTestHistory(prev => [{
        route: selectedRoute.path,
        method: selectedRoute.method,
        timestamp: Date.now(),
        status: 0,
        success: false,
      }, ...prev].slice(0, 50));
    } finally {
      setLoading(false);
    }
  };

  const clearTest = () => {
    setSelectedRoute(null);
    setRequestBody('{}');
    setHeaders('{}');
    setResponse(null);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Left: Route Selector */}
      <Card className="lg:col-span-1">
        <CardHeader>
          <CardTitle>API Routes</CardTitle>
          <CardDescription>Select a route to test</CardDescription>
        </CardHeader>
        <CardContent>
          <RouteList onSelect={setSelectedRoute} />
        </CardContent>
      </Card>

      {/* Center/Right: Request Configuration */}
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle>Request Configuration</CardTitle>
          <CardDescription>
            {selectedRoute 
              ? 'Configure and execute your API request' 
              : 'Select a route from the list to begin'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {selectedRoute ? (
            <>
              <div>
                <Label>Route</Label>
                <div className="flex gap-2 items-center mt-1">
                  <Badge>{selectedRoute.method}</Badge>
                  <code className="text-sm text-foreground font-mono">
                    {selectedRoute.path}
                  </code>
                </div>
                {selectedRoute.description && (
                  <p className="text-sm text-muted-foreground mt-1">
                    {selectedRoute.description}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="headers">Additional Headers (JSON)</Label>
                <Textarea
                  id="headers"
                  value={headers}
                  onChange={(e) => setHeaders(e.target.value)}
                  placeholder='{"Custom-Header": "value"}'
                  rows={3}
                  className="font-mono text-xs"
                />
              </div>

              {selectedRoute.method !== 'GET' && selectedRoute.method !== 'DELETE' && (
                <div>
                  <Label htmlFor="requestBody">Request Body (JSON)</Label>
                  <Textarea
                    id="requestBody"
                    value={requestBody}
                    onChange={(e) => setRequestBody(e.target.value)}
                    placeholder='{"key": "value"}'
                    rows={8}
                    className="font-mono text-xs"
                  />
                </div>
              )}

              <div className="flex gap-2">
                <Button onClick={executeTest} disabled={loading}>
                  {loading ? 'Testing...' : 'Run Test'}
                </Button>
                <Button onClick={clearTest} variant="outline">
                  Clear
                </Button>
              </div>
            </>
          ) : (
            <p className="text-center text-muted-foreground py-8">
              Select a route from the list to configure and test it
            </p>
          )}
        </CardContent>
      </Card>

      {/* Bottom: Response */}
      {response && (
        <Card className="lg:col-span-3">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Response</CardTitle>
              {response.status && (
                <Badge variant={response.status < 400 ? 'default' : 'destructive'}>
                  {response.status} {response.statusText}
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <pre className="text-xs bg-muted p-4 rounded-lg overflow-auto max-h-96 font-mono">
              {JSON.stringify(response, null, 2)}
            </pre>
          </CardContent>
        </Card>
      )}

      {/* Bottom: Test History */}
      {testHistory.length > 0 && (
        <Card className="lg:col-span-3">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Test History</CardTitle>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setTestHistory([])}
              >
                Clear History
              </Button>
            </div>
            <CardDescription>Last 50 test executions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {testHistory.map((test, i) => (
                <div 
                  key={i} 
                  className="flex items-center gap-2 text-sm p-2 rounded hover:bg-muted/50"
                >
                  <Badge variant={test.success ? 'default' : 'destructive'}>
                    {test.status || 'ERR'}
                  </Badge>
                  <Badge variant="outline">{test.method}</Badge>
                  <span className="text-muted-foreground font-mono text-xs flex-1">
                    {test.route}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {new Date(test.timestamp).toLocaleTimeString()}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

