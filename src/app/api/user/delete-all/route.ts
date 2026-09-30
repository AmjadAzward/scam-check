import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/db";
import { deletePrivateFile } from "@/lib/storage";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as any)?.id;

    if (!userId) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const body = await req.json();
    const { action } = body; // "DELETE_SCANS" | "DELETE_ACCOUNT"

    if (action === "DELETE_SCANS") {
      // Find all user scans to clean up any files
      const scans = await prisma.scan.findMany({
        where: { userId },
        include: { inputs: true },
      });

      for (const scan of scans) {
        for (const input of scan.inputs) {
          if (input.storageKey) {
            await deletePrivateFile(input.storageKey);
          }
        }
      }

      await prisma.scan.deleteMany({
        where: { userId },
      });

      await prisma.auditLog.create({
        data: {
          userId,
          action: "USER_DELETED_ALL_SCANS",
        },
      });

      return NextResponse.json({
        success: true,
        message: "All scan history has been permanently deleted.",
      });
    } else if (action === "DELETE_ACCOUNT") {
      // Clean up files
      const scans = await prisma.scan.findMany({
        where: { userId },
        include: { inputs: true },
      });

      for (const scan of scans) {
        for (const input of scan.inputs) {
          if (input.storageKey) {
            await deletePrivateFile(input.storageKey);
          }
        }
      }

      // Delete User (Cascades Scans and Preferences; reports are set null)
      await prisma.user.delete({
        where: { id: userId },
      });

      return NextResponse.json({
        success: true,
        message: "Your account and all associated data have been permanently deleted.",
      });
    }

    return NextResponse.json({ error: "Invalid delete action specified" }, { status: 400 });
  } catch (error) {
    console.error("Data deletion error:", error);
    return NextResponse.json({ error: "Failed to complete data deletion" }, { status: 500 });
  }
}
