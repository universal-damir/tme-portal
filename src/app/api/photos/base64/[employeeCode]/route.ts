import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET(
  request: NextRequest,
  { params }: { params: { employeeCode: string } }
) {
  try {
    const { employeeCode } = params;
    console.log('📸 Base64 API called with employeeCode:', employeeCode);

    if (!employeeCode) {
      console.log('❌ No employee code provided');
      return NextResponse.json(
        { error: 'Employee code is required' },
        { status: 400 }
      );
    }

    // Look for photo files in staff-photos directory
    const publicPath = path.join(process.cwd(), 'public', 'staff-photos');
    console.log('🗂️ Looking in directory:', publicPath);
    
    // Common file extensions to check
    const extensions = ['jpg', 'jpeg', 'png', 'webp'];
    
    let photoPath = null;
    let mimeType = 'image/jpeg';

    // Search for the photo file with different naming patterns
    for (const ext of extensions) {
      // Try direct match first (e.g., "TR.jpg")
      let filePath = path.join(publicPath, `${employeeCode}.${ext}`);
      if (fs.existsSync(filePath)) {
        photoPath = filePath;
      } else {
        // Try pattern with number prefix (e.g., "96 TR.jpg")
        // Read directory and find files that end with the employee code
        try {
          const files = fs.readdirSync(publicPath);
          console.log('📁 Files in directory:', files.length);
          
          const matchingFile = files.find(file => 
            file.toLowerCase().includes(employeeCode.toLowerCase()) && 
            file.endsWith(`.${ext}`)
          );
          
          console.log(`🔍 Looking for files containing "${employeeCode}" with extension "${ext}"`);
          console.log('🎯 Matching file found:', matchingFile);
          
          if (matchingFile) {
            filePath = path.join(publicPath, matchingFile);
            if (fs.existsSync(filePath)) {
              photoPath = filePath;
              console.log('✅ Photo path set to:', photoPath);
            }
          }
        } catch (dirError) {
          console.error('Error reading staff-photos directory:', dirError);
        }
      }
      
      if (photoPath) {
        // Set appropriate MIME type
        switch (ext.toLowerCase()) {
          case 'png':
            mimeType = 'image/png';
            break;
          case 'webp':
            mimeType = 'image/webp';
            break;
          case 'jpg':
          case 'jpeg':
          default:
            mimeType = 'image/jpeg';
            break;
        }
        break;
      }
    }

    if (!photoPath) {
      console.log('❌ No photo path found for employee code:', employeeCode);
      // Return null for no photo found - let the client handle fallback
      return NextResponse.json({
        base64: null,
        error: 'Photo not found'
      });
    }

    console.log('📖 Reading photo file:', photoPath);
    // Read the photo and convert to base64
    const photoBuffer = fs.readFileSync(photoPath);
    const base64 = photoBuffer.toString('base64');
    const dataUrl = `data:${mimeType};base64,${base64}`;

    console.log('✅ Base64 conversion successful. Data URL length:', dataUrl.length);
    console.log('📏 Base64 preview (first 100 chars):', dataUrl.substring(0, 100) + '...');

    return NextResponse.json({
      base64: dataUrl,
      mimeType,
      size: photoBuffer.length
    });

  } catch (error) {
    console.error('Base64 photo conversion error:', error);
    return NextResponse.json(
      { base64: null, error: 'Failed to convert photo' },
      { status: 500 }
    );
  }
}