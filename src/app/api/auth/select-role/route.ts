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

    const { role } = await request.json();
    
    if (!role || (role !== "driver" && role !== "admin")) {
      return NextResponse.json({ error: "Invalid role" }, { status: 400 });
    }

    const email = session.user.email;

    // Check if user already exists as driver
    const existingDriver = await prisma.driver.findUnique({
      where: { email },
    });

    // Check if user already exists as admin
    const existingAdmin = await prisma.admin.findUnique({
      where: { email },
    });

    if (role === "admin") {
      if (existingAdmin) {
        return NextResponse.json({ message: "Already an admin" });
      }

      // If user is currently a driver, we need to handle the migration
      if (existingDriver) {
        // Create admin account
        const admin = await prisma.admin.create({
          data: {
            email: existingDriver.email,
            name: existingDriver.name,
            image: existingDriver.image,
            emailVerified: existingDriver.emailVerified,
          },
        });

        // Update all accounts and sessions to point to admin
        await prisma.account.updateMany({
          where: { userId: existingDriver.id },
          data: { 
            userId: admin.id,
            userType: "admin"
          },
        });

        await prisma.session.updateMany({
          where: { userId: existingDriver.id },
          data: { 
            userId: admin.id,
            userType: "admin"
          },
        });

        // Optionally keep the driver data or delete it
        // For now, we'll keep it in case they want to switch back
        
        return NextResponse.json({ message: "Converted to admin successfully" });
      } else {
        // Create new admin
        const admin = await prisma.admin.create({
          data: {
            email,
            name: session.user.name,
            image: session.user.image,
            emailVerified: new Date(),
          },
        });

        return NextResponse.json({ message: "Admin account created successfully" });
      }
    } else {
      // Role is "driver"
      if (existingDriver) {
        return NextResponse.json({ message: "Already a driver" });
      }

      // If user is currently an admin, handle migration
      if (existingAdmin) {
        // Create driver account
        const driver = await prisma.driver.create({
          data: {
            email: existingAdmin.email,
            name: existingAdmin.name,
            image: existingAdmin.image,
            emailVerified: existingAdmin.emailVerified,
          },
        });

        // Update all accounts and sessions to point to driver
        await prisma.account.updateMany({
          where: { userId: existingAdmin.id },
          data: { 
            userId: driver.id,
            userType: "driver"
          },
        });

        await prisma.session.updateMany({
          where: { userId: existingAdmin.id },
          data: { 
            userId: driver.id,
            userType: "driver"
          },
        });

        return NextResponse.json({ message: "Converted to driver successfully" });
      } else {
        // Create new driver (this should be the default case)
        const driver = await prisma.driver.create({
          data: {
            email,
            name: session.user.name,
            image: session.user.image,
            emailVerified: new Date(),
          },
        });

        return NextResponse.json({ message: "Driver account created successfully" });
      }
    }
  } catch (error) {
    console.error("Error in role selection:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}