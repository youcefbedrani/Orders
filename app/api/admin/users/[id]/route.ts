import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
    try {
        const id = params.id;

        // Prevent deleting self (if you are admin) - simpler check: prevent deleting 'admin@admin.com'
        const user = await prisma.user.findUnique({ where: { id } });
        if (user?.email === 'admin@admin.com') {
            return NextResponse.json({ error: 'Cannot delete super admin' }, { status: 403 });
        }

        await prisma.user.delete({
            where: { id }
        });

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error('Delete user error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
    try {
        const id = params.id;
        const body = await request.json();

        await prisma.user.update({
            where: { id },
            data: body // Be careful with what can be updated
        });

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error('Update user error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
