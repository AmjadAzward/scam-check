import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/db";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as any)?.id;

    if (!userId) {
      // Default preferences for anonymous user
      return NextResponse.json({
        success: true,
        preferences: {
          language: "en",
          deleteScreenshotsAfterScan: true,
          notificationsEnabled: true,
        },
      });
    }

    const pref = await prisma.userPreference.findUnique({
      where: { userId },
    });

    return NextResponse.json({
      success: true,
      preferences: pref || {
        language: "en",
        deleteScreenshotsAfterScan: true,
        notificationsEnabled: true,
      },
    });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch preferences" }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as any)?.id;

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { language, deleteScreenshotsAfterScan, notificationsEnabled } = body;

    const updated = await prisma.userPreference.upsert({
      where: { userId },
      update: {
        ...(typeof language === "string" ? { language } : {}),
        ...(typeof deleteScreenshotsAfterScan === "boolean" ? { deleteScreenshotsAfterScan } : {}),
        ...(typeof notificationsEnabled === "boolean" ? { notificationsEnabled } : {}),
      },
      create: {
        userId,
        language: language || "en",
        deleteScreenshotsAfterScan: deleteScreenshotsAfterScan ?? true,
        notificationsEnabled: notificationsEnabled ?? true,
      },
    });

    if (language) {
      await prisma.user.update({
        where: { id: userId },
        data: { language },
      });
    }

    return NextResponse.json({ success: true, preferences: updated });
  } catch (error) {
    return NextResponse.json({ error: "Failed to update preferences" }, { status: 500 });
  }
}
