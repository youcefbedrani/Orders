import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

// GET /api/admin/download?file={filename}&userId={userId}
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const fileName = searchParams.get('file');
        const userId = searchParams.get('userId');

        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        if (!fileName) {
            return NextResponse.json({ error: 'File name is required' }, { status: 400 });
        }

        // Verify admin role
        const user = await prisma.user.findUnique({
            where: { id: userId }
        });

        if (!user || user.role !== 'ADMIN') {
            return NextResponse.json({ error: 'Unauthorized - Admin access required' }, { status: 403 });
        }

        // Construct file path
        const filePath = path.join(process.cwd(), 'public', 'uploads', fileName);

        // Check if file exists
        if (!fs.existsSync(filePath)) {
            return NextResponse.json({ error: 'File not found' }, { status: 404 });
        }

        // Read file
        const fileBuffer = fs.readFileSync(filePath);

        // Return file as download
        return new NextResponse(fileBuffer, {
            headers: {
                'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                'Content-Disposition': `attachment; filename="${fileName}"`,
            },
        });

    } catch (error) {
        console.error('Download file error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
