import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/db";
import { deletePrivateFile } from "@/lib/storage";

export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as any)?.id;
    const scan = await prisma.scan.findUnique({
      where: { id: params.id },
      include: {
        inputs: true,
        signals: true,
      },
    });

    if (!scan) {
      return NextResponse.json({ error: "Scan record not found" }, { status: 404 });
    }

    if (scan.userId && scan.userId !== userId) {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 403 });
    }

    // Defensive action recommendations based on riskLevel
    const recommendations: string[] = [];
    if (scan.riskLevel === "HIGH_RISK" || scan.riskLevel === "KNOWN_MALICIOUS") {
      recommendations.push("Do not click the link or open the destination.");
      recommendations.push("Do not enter credit card, debit card, or banking details.");
      recommendations.push("Do not share passwords, PINs, or One-Time Passwords (OTPs) under any circumstances.");
      if (scan.claimedOrg) {
        recommendations.push(`Verify directly through ${scan.claimedOrg}'s official website or known official phone line.`);
      } else {
        recommendations.push("Verify directly with the alleged organization using an official, independently confirmed channel.");
      }
      recommendations.push("Report this scan to help protect the broader community.");
    } else if (scan.riskLevel === "MEDIUM_RISK") {
      recommendations.push("Exercise caution before proceeding or replying.");
      recommendations.push("Do not send advance payments, deposits, or gift cards to unverified private accounts.");
      recommendations.push("Cross-check the identity of the person or business through external references.");
    } else {
      recommendations.push("We did not detect strong risk indicators, but independent verification is still recommended.");
      recommendations.push("Always verify that the browser address bar shows the expected official domain name.");
      recommendations.push("Never disclose your banking passwords or OTPs to anyone.");
    }

    return NextResponse.json({
      success: true,
      scan: {
        ...scan,
        recommendations,
      },
    });
  } catch (error) {
    console.error("Error fetching scan:", error);
    return NextResponse.json({ error: "Failed to fetch scan details" }, { status: 500 });
  }
}

export async function PATCH(
  _req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as any)?.id;

    if (!userId) {
      return NextResponse.json({ error: "Sign in to save checks" }, { status: 401 });
    }

    const body = await req.json();
    const { isSaved } = body;

    const scan = await prisma.scan.findUnique({
      where: { id: params.id },
    });

    if (!scan) {
      return NextResponse.json({ error: "Scan not found" }, { status: 404 });
    }

    // Ownership check if scan is associated with a user
    if (scan.userId !== userId) {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 403 });
    }

    const updated = await prisma.scan.update({
      where: { id: params.id },
      data: {
        isSaved: typeof isSaved === "boolean" ? isSaved : !scan.isSaved,
      },
    });

    return NextResponse.json({ success: true, isSaved: updated.isSaved });
  } catch (error) {
    console.error("Error updating scan:", error);
    return NextResponse.json({ error: "Failed to update scan" }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as any)?.id;

    if (!userId) {
      return NextResponse.json({ error: "Sign in to delete checks" }, { status: 401 });
    }

    const scan = await prisma.scan.findUnique({
      where: { id: params.id },
      include: { inputs: true },
    });

    if (!scan) {
      return NextResponse.json({ error: "Scan not found" }, { status: 404 });
    }

    // Strict ownership verification: if user is logged in and scan belongs to user, allow.
    // If user is not logged in or doesn't match owner, block unless admin.
    const userRole = (session?.user as any)?.role;
    if (scan.userId !== userId && userRole !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Delete any associated private storage files
    for (const input of scan.inputs) {
      if (input.storageKey) {
        await deletePrivateFile(input.storageKey);
      }
    }

    await prisma.scan.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true, message: "Scan permanently deleted." });
  } catch (error) {
    console.error("Error deleting scan:", error);
    return NextResponse.json({ error: "Failed to delete scan" }, { status: 500 });
  }
}
