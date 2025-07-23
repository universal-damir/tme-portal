import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import path from 'path';
import fs from 'fs';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ employeeCode: string }> }
) {
  try {
    // Validate session
    const sessionId = request.cookies.get('session')?.value;
    if (!sessionId) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const sessionData = await getSession(sessionId);
    if (!sessionData) {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
    }

    const resolvedParams = await params;
    const { employeeCode } = resolvedParams;
    
    // Sanitize employee code
    if (!/^[\w\s]+$/.test(employeeCode)) {
      return NextResponse.json({ error: 'Invalid employee code format' }, { status: 400 });
    }

    // Get photo format preference
    const format = request.nextUrl.searchParams.get('format') || 'webp';

    // Look for photo files in staff-photos directory
    const publicPath = path.join(process.cwd(), 'public', 'staff-photos');
    
    // Try different possible filename formats
    const possibleFilenames = [
      `${employeeCode}.${format}`,
      `${employeeCode}.jpg`,
      `${employeeCode}.jpeg`,
      `${employeeCode}.png`,
      `${employeeCode}.webp`,
      // With spaces replaced by underscores
      `${employeeCode.replace(/\s+/g, '_')}.${format}`,
      `${employeeCode.replace(/\s+/g, '_')}.jpg`,
      `${employeeCode.replace(/\s+/g, '_')}.jpeg`,
      `${employeeCode.replace(/\s+/g, '_')}.png`,
      `${employeeCode.replace(/\s+/g, '_')}.webp`,
    ];

    let photoPath = null;
    let mimeType = 'image/jpeg';

    for (const filename of possibleFilenames) {
      const filePath = path.join(publicPath, filename);
      if (fs.existsSync(filePath)) {
        photoPath = filePath;
        // Determine MIME type from extension
        const ext = path.extname(filename).toLowerCase();
        switch (ext) {
          case '.png':
            mimeType = 'image/png';
            break;
          case '.webp':
            mimeType = 'image/webp';
            break;
          case '.gif':
            mimeType = 'image/gif';
            break;
          default:
            mimeType = 'image/jpeg';
        }
        break;
      }
    }

    if (!photoPath) {
      // Return default avatar/placeholder
      return NextResponse.json({ 
        error: 'Photo not found',
        fallback: '/api/photos/default'
      }, { status: 404 });
    }

    // Read and return the photo
    const photoBuffer = fs.readFileSync(photoPath);
    
    const response = new NextResponse(photoBuffer, {
      status: 200,
      headers: {
        'Content-Type': mimeType,
        'Cache-Control': 'public, max-age=86400', // Cache for 24 hours
        'ETag': `"${employeeCode}-${fs.statSync(photoPath).mtime.getTime()}"`,
      },
    });

    return response;

  } catch (error) {
    console.error('Photo serving error:', error);
    return NextResponse.json(
      { error: 'Failed to serve photo' },
      { status: 500 }
    );
  }
}

// Handle HEAD requests for cache validation
export async function HEAD(
  request: NextRequest,
  { params }: { params: Promise<{ employeeCode: string }> }
) {
  const getResponse = await GET(request, { params });
  
  // Return same headers but no body
  return new NextResponse(null, {
    status: getResponse.status,
    headers: getResponse.headers,
  });
}