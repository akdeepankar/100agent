import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const body = await request.json();
    
    // Proxy the request to the Heroku backend
    const response = await fetch('https://prospace-4d2a452088b6.herokuapp.com/generate-quiz', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      return NextResponse.json(
        { 
          status: 'error', 
          message: errorData?.message || `Server error: ${response.status}` 
        },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
    
  } catch (error) {
    console.error('Quiz generation error:', error);
    return NextResponse.json(
      { 
        status: 'error', 
        message: 'Failed to connect to quiz generation service. Please try again later.' 
      },
      { status: 500 }
    );
  }
} 