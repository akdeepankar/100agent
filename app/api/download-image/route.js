import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const { imageUrl } = await request.json();
    
    if (!imageUrl) {
      return NextResponse.json(
        { status: 'error', message: 'Image URL is required' },
        { status: 400 }
      );
    }

    // Download the image on the server side
    const response = await fetch(imageUrl);
    
    if (!response.ok) {
      return NextResponse.json(
        { status: 'error', message: 'Failed to download image' },
        { status: response.status }
      );
    }

    // Get the image as a buffer
    const imageBuffer = await response.arrayBuffer();
    
    // Get the content type from the response
    const contentType = response.headers.get('content-type') || 'image/png';
    
    // Return the image data
    return new NextResponse(imageBuffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Length': imageBuffer.byteLength.toString(),
      },
    });
    
  } catch (error) {
    console.error('Image download error:', error);
    return NextResponse.json(
      { 
        status: 'error', 
        message: 'Failed to download image. Please try again later.' 
      },
      { status: 500 }
    );
  }
} 