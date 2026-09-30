import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/db";
import { z } from "zod";

const BrandCreateSchema = z.object({
  name: z.string().min(2).max(100),
  aliases: z.string().max(500),
  country: z.string().default("LK"),
  domains: z.array(z.string().min(3)).min(1),
});

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search");

    let where: any = {};
    if (search && search.trim().length > 0) {
      where = {
        OR: [
          { name: { contains: search } },
          { aliases: { contains: search } },
        ],
      };
    }

    const brands = await prisma.brand.findMany({
      where,
      include: {
        domains: true,
      },
      orderBy: { name: "asc" },
    });

    return NextResponse.json({ success: true, brands });
  } catch (error) {
    console.error("Brands query error:", error);
    return NextResponse.json({ error: "Failed to fetch brands" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const userRole = (session?.user as any)?.role;

    if (userRole !== "ADMIN" && userRole !== "MODERATOR") {
      return NextResponse.json({ error: "Unauthorized: Admin privileges required" }, { status: 403 });
    }

    const body = await req.json();
    const parsed = BrandCreateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid brand payload", details: parsed.error.flatten() }, { status: 400 });
    }

    const { name, aliases, country, domains } = parsed.data;

    const brand = await prisma.brand.create({
      data: {
        name,
        aliases,
        country,
        verificationStatus: "VERIFIED",
        domains: {
          create: domains.map((d) => ({
            domain: d.toLowerCase().trim(),
            official: true,
          })),
        },
      },
      include: { domains: true },
    });

    return NextResponse.json({ success: true, brand });
  } catch (error: any) {
    console.error("Brand create error:", error);
    return NextResponse.json({ error: error.message || "Failed to create brand" }, { status: 500 });
  }
}
