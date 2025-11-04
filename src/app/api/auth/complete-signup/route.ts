import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user?.email) {
      return NextResponse.redirect(new URL("/login", request.url));
    }

    // Get the selected role from localStorage (this will be handled on client side)
    // For now, we'll check if user already exists
    const email = session.user.email;

    const existingDriver = await prisma.driver.findUnique({
      where: { email },
    });

    const existingAdmin = await prisma.admin.findUnique({
      where: { email },
    });

    if (existingDriver || existingAdmin) {
      // User already exists, redirect to home
      return NextResponse.redirect(new URL("/", request.url));
    }

    // User doesn't exist, redirect to role selection
    return NextResponse.redirect(new URL("/setup-account", request.url));
  } catch (error) {
    console.error("Error in complete signup:", error);
    return NextResponse.redirect(new URL("/login", request.url));
  }
}