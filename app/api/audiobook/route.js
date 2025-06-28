export async function POST(request) {
  try {
    const body = await request.json();
    
    const response = await fetch('https://prospace-4d2a452088b6.herokuapp.com/audiobook-to-audio', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();
    
    return Response.json(data, { status: response.status });
  } catch (error) {
    console.error('Proxy error:', error);
    return Response.json(
      { error: 'Failed to connect to audiobook service' },
      { status: 500 }
    );
  }
} 