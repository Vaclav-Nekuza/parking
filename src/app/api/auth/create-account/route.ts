import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user?.email) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { role, email, name, image } = await request.json();
    
    if (!role || (role !== "driver" && role !== "admin")) {
      return NextResponse.json({ error: "Invalid role" }, { status: 400 });
    }

    if (email !== session.user.email) {
      return NextResponse.json({ error: "Email mismatch" }, { status: 400 });
    }

    // Check if user already exists
    const existingDriver = await prisma.driver.findUnique({
      where: { email },
    });

    const existingAdmin = await prisma.admin.findUnique({
      where: { email },
    });

    if (existingDriver || existingAdmin) {
      return NextResponse.json({ error: "Account already exists" }, { status: 400 });
    }

    let newUser;

    if (role === "admin") {
      newUser = await prisma.admin.create({
        data: {
          email,
          name,
          image,
          emailVerified: new Date(),
        },
      });
    } else {
      newUser = await prisma.driver.create({
        data: {
          email,
          name,
          image,
          emailVerified: new Date(),
        },
      });
    }

    return NextResponse.json({ 
      message: `${role} account created successfully`,
      userId: newUser.id,
      role 
    });
  } catch (error) {
    console.error("Error creating account:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}