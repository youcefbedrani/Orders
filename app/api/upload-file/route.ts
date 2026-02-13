import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

export async function POST(request: NextRequest) {
    try {
        console.log('📤 File upload request received');

        const formData = await request.formData();
        const file = formData.get('file') as File;

        if (!file) {
            console.error('❌ No file provided in request');
            return NextResponse.json({ error: 'No file provided' }, { status: 400 });
        }

        console.log(`📄 File received: ${file.name}, size: ${file.size} bytes`);

        // Generate unique filename
        const timestamp = Date.now();
        const originalName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
        const filename = `${timestamp}_${originalName}`;

        // Convert file to buffer
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        console.log(`💾 Buffer created: ${buffer.length} bytes`);

        // Ensure upload directory exists
        const uploadDir = join(process.cwd(), 'public', 'uploads');

        if (!existsSync(uploadDir)) {
            console.log(`📁 Creating upload directory: ${uploadDir}`);
            await mkdir(uploadDir, { recursive: true });
        }

        const filepath = join(uploadDir, filename);
        console.log(`💾 Saving file to: ${filepath}`);

        await writeFile(filepath, buffer);

        console.log(`✅ File uploaded successfully: ${filename}`);

        return NextResponse.json({
            success: true,
            filename,
            fileUrl: `/uploads/${filename}`,
            fileSize: buffer.length
        });

    } catch (error) {
        console.error('❌ File upload error:', error);
        console.error('   Error type:', error instanceof Error ? error.constructor.name : typeof error);
        console.error('   Error message:', error instanceof Error ? error.message : String(error));
        console.error('   Error stack:', error instanceof Error ? error.stack : 'N/A');

        return NextResponse.json({
            error: 'File upload failed',
            details: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
}
