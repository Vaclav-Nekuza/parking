import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { role } = body;

    if (!role || (role !== 'driver' && role !== 'admin')) {
      return NextResponse.json(
        { error: 'Invalid role. Must be either "driver" or "admin"' },
        { status: 400 }
      );
    }

    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    // Find or create user based on role
    let user;
    let userId;

    if (role === 'driver') {
      user = await prisma.driver.upsert({
        where: { email: session.user.email },
        update: {
          name: session.user.name || 'Unknown Driver',
          image: session.user.image,
          emailVerified: new Date(),
          googleId: session.user.id,
        },
        create: {
          email: session.user.email,
          name: session.user.name || 'Unknown Driver',
          image: session.user.image,
          emailVerified: new Date(),
          googleId: session.user.id,
        },
      });
      userId = user.id;
    } else {
      user = await prisma.admin.upsert({
        where: { email: session.user.email },
        update: {
          name: session.user.name || 'Unknown Admin',
          image: session.user.image,
          emailVerified: new Date(),
          googleId: session.user.id,
        },
        create: {
          email: session.user.email,
          name: session.user.name || 'Unknown Admin',
          image: session.user.image,
          emailVerified: new Date(),
          googleId: session.user.id,
        },
      });
      userId = user.id;
    }

    // Deactivate any existing sessions for this user
    await prisma.session.updateMany({
      where: {
        OR: [
          { driverId: role === 'driver' ? userId : undefined },
          { adminId: role === 'admin' ? userId : undefined }
        ]
      },
      data: { isActive: false }
    });

    // Create new active session
    const userSession = await prisma.session.create({
      data: {
        sessionToken: `${role}-${userId}-${Date.now()}`,
        userType: role,
        driverId: role === 'driver' ? userId : null,
        adminId: role === 'admin' ? userId : null,
        expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        isActive: true,
      },
    });

    return NextResponse.json({
      success: true,
      user: {
        id: userId,
        role,
        name: user.name,
        email: user.email,
        image: user.image,
      },
      sessionToken: userSession.sessionToken,
    });

  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}