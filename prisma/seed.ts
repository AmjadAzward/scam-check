import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import crypto from "crypto";

const prisma = new PrismaClient();

function hashValue(value: string): string {
  return crypto.createHash("sha256").update(value.trim().toLowerCase()).digest("hex");
}

async function main() {
  console.log("🌱 Starting ScamCheck database seed...");

  // 1. Create Default Users (Admin, Moderator, Consumer)
  const adminSeedPassword = process.env.SEED_ADMIN_PASSWORD;
  const moderatorSeedPassword = process.env.SEED_MODERATOR_PASSWORD;
  const userSeedPassword = process.env.SEED_USER_PASSWORD;
  if (!adminSeedPassword || !moderatorSeedPassword || !userSeedPassword) {
    throw new Error("Set SEED_ADMIN_PASSWORD, SEED_MODERATOR_PASSWORD, and SEED_USER_PASSWORD before running the seed.");
  }
  const passwordHash = await bcrypt.hash(adminSeedPassword, 12);
  const moderatorPasswordHash = await bcrypt.hash(moderatorSeedPassword, 12);
  const userPasswordHash = await bcrypt.hash(userSeedPassword, 12);

  const admin = await prisma.user.upsert({
    where: { email: "admin@scamcheck.lk" },
    update: { passwordHash },
    create: {
      email: "admin@scamcheck.lk",
      name: "ScamCheck Admin",
      passwordHash,
      role: "ADMIN",
      country: "LK",
      language: "en",
      preferences: {
        create: {
          language: "en",
          deleteScreenshotsAfterScan: true,
          notificationsEnabled: true,
        },
      },
    },
  });

  const moderator = await prisma.user.upsert({
    where: { email: "moderator@scamcheck.lk" },
    update: { passwordHash: moderatorPasswordHash },
    create: {
      email: "moderator@scamcheck.lk",
      name: "Community Safety Lead",
      passwordHash: moderatorPasswordHash,
      role: "MODERATOR",
      country: "LK",
      language: "en",
      preferences: {
        create: {
          language: "en",
          deleteScreenshotsAfterScan: true,
          notificationsEnabled: true,
        },
      },
    },
  });

  const demoUser = await prisma.user.upsert({
    where: { email: "user@scamcheck.lk" },
    update: { passwordHash: userPasswordHash },
    create: {
      email: "user@scamcheck.lk",
      name: "Kasun Perera",
      passwordHash: userPasswordHash,
      role: "USER",
      country: "LK",
      language: "en",
      preferences: {
        create: {
          language: "en",
          deleteScreenshotsAfterScan: true,
          notificationsEnabled: true,
        },
      },
    },
  });

  console.log("✅ Seeded Users: Admin, Moderator, User");

  // 2. Verified Brands Registry (Sri Lanka & Global)
  const brandsData = [
    {
      name: "Daraz",
      aliases: "daraz, daraz.lk, daraz online, daraz express, daraz sri lanka",
      country: "LK",
      domains: ["daraz.lk", "daraz.com"],
    },
    {
      name: "Sri Lanka Post",
      aliases: "sl post, slpost, sri lanka postal, colombo central post, postal department",
      country: "LK",
      domains: ["slpost.gov.lk", "postal.gov.lk"],
    },
    {
      name: "Commercial Bank of Ceylon",
      aliases: "combank, commercial bank, combank digital, cbc",
      country: "LK",
      domains: ["combank.lk", "combankdigital.com"],
    },
    {
      name: "Bank of Ceylon (BOC)",
      aliases: "boc, bank of ceylon, b-app, boc smart online",
      country: "LK",
      domains: ["boc.lk"],
    },
    {
      name: "Sampath Bank",
      aliases: "sampath, sampath vishwa, sampath bank plc",
      country: "LK",
      domains: ["sampath.lk", "sampathvishwa.com"],
    },
    {
      name: "Hatton National Bank (HNB)",
      aliases: "hnb, hatton national, hnb digital",
      country: "LK",
      domains: ["hnb.net"],
    },
    {
      name: "Dialog Axiata",
      aliases: "dialog, dialog axiata, mydialog, dialog broadband",
      country: "LK",
      domains: ["dialog.lk"],
    },
    {
      name: "SLT-MOBITEL",
      aliases: "mobitel, slt, sri lanka telecom, slt mobitel",
      country: "LK",
      domains: ["mobitel.lk", "slt.lk"],
    },
    {
      name: "PickMe",
      aliases: "pickme, digital mobility solutions, pickme food",
      country: "LK",
      domains: ["pickme.lk"],
    },
    {
      name: "Uber",
      aliases: "uber, uber eats",
      country: "GL",
      domains: ["uber.com"],
    },
    {
      name: "DHL Express",
      aliases: "dhl, dhl express, dhl sri lanka",
      country: "GL",
      domains: ["dhl.com", "dhl.lk"],
    },
    {
      name: "Central Bank of Sri Lanka (CBSL)",
      aliases: "cbsl, central bank, central bank of sri lanka",
      country: "LK",
      domains: ["cbsl.gov.lk"],
    },
    {
      name: "Department of Immigration and Emigration",
      aliases: "eta, sri lanka eta, immigration gov lk, passport office",
      country: "LK",
      domains: ["immigration.gov.lk", "eta.gov.lk"],
    },
    {
      name: "WhatsApp",
      aliases: "whatsapp, whatsapp support, meta whatsapp",
      country: "GL",
      domains: ["whatsapp.com"],
    },
    {
      name: "Facebook",
      aliases: "facebook, meta, fb marketplace",
      country: "GL",
      domains: ["facebook.com", "meta.com"],
    },
    {
      name: "Telegram",
      aliases: "telegram, tg, telegram messenger",
      country: "GL",
      domains: ["telegram.org", "t.me"],
    },
  ];

  for (const b of brandsData) {
    const existing = await prisma.brand.findUnique({ where: { name: b.name } });
    if (!existing) {
      const brand = await prisma.brand.create({
        data: {
          name: b.name,
          aliases: b.aliases,
          country: b.country,
          verificationStatus: "VERIFIED",
        },
      });

      for (const d of b.domains) {
        await prisma.brandDomain.create({
          data: {
            brandId: brand.id,
            domain: d.toLowerCase(),
            official: true,
          },
        });
      }
    }
  }

  console.log("✅ Seeded Official Brand & Domain Registry");

  // 3. Known Threat Indicators
  const threatIndicators = [
    {
      type: "DOMAIN",
      value: "daraz-delivery-tracking.xyz",
      display: "daraz-delivery-tracking.xyz",
      source: "CERT_LK",
      riskLevel: "KNOWN_MALICIOUS",
    },
    {
      type: "DOMAIN",
      value: "slpost-customs-clearance.top",
      display: "slpost-customs-clearance.top",
      source: "INTERNAL_INTEL",
      riskLevel: "KNOWN_MALICIOUS",
    },
    {
      type: "DOMAIN",
      value: "combank-secure-update.online",
      display: "combank-secure-update.online",
      source: "MODERATOR",
      riskLevel: "KNOWN_MALICIOUS",
    },
    {
      type: "DOMAIN",
      value: "dialog-claim-bonus.click",
      display: "dialog-claim-bonus.click",
      source: "COMMUNITY_CONSENSUS",
      riskLevel: "KNOWN_MALICIOUS",
    },
    {
      type: "PHONE",
      value: "+94770192834",
      display: "+94 77 019 2834",
      source: "COMMUNITY_CONSENSUS",
      riskLevel: "HIGH_RISK",
    },
    {
      type: "PHONE",
      value: "+94719283746",
      display: "+94 71 928 3746",
      source: "COMMUNITY_CONSENSUS",
      riskLevel: "HIGH_RISK",
    },
    {
      type: "PHONE",
      value: "+94765432109",
      display: "+94 76 543 2109",
      source: "MODERATOR",
      riskLevel: "KNOWN_MALICIOUS",
    },
  ];

  for (const ti of threatIndicators) {
    const valHash = hashValue(ti.value);
    const existing = await prisma.threatIndicator.findFirst({
      where: { indicatorValueHash: valHash },
    });
    if (!existing) {
      await prisma.threatIndicator.create({
        data: {
          indicatorType: ti.type,
          indicatorValueHash: valHash,
          displayValue: ti.display,
          source: ti.source,
          riskLevel: ti.riskLevel,
          active: true,
        },
      });
    }
  }

  console.log("✅ Seeded Threat Intelligence Indicators");

  // 4. Community Reports
  const sampleReports = [
    {
      identifierType: "PHONE",
      rawIdentifier: "+94770192834",
      displayMasked: "+94 77 •••• 834",
      category: "Courier Scam",
      platform: "SMS",
      description: "Received SMS claiming my parcel from Daraz is held and asking to pay Rs. 450 customs tax via an unknown web link.",
      amountLost: null,
      status: "CONFIRMED_BY_MODERATOR",
    },
    {
      identifierType: "PHONE",
      rawIdentifier: "+94770192834",
      displayMasked: "+94 77 •••• 834",
      category: "Marketplace Scam",
      platform: "WhatsApp",
      description: "Seller on Ikman insisted on advance deposit of Rs. 3,000 for a phone delivery and then blocked my number.",
      amountLost: 3000,
      status: "VISIBLE",
    },
    {
      identifierType: "PHONE",
      rawIdentifier: "+94719283746",
      displayMasked: "+94 71 •••• 746",
      category: "Investment Scam",
      platform: "Telegram",
      description: "Added to a group promising 200% daily profit on crypto tasks. Asked to transfer money to a private bank account.",
      amountLost: 15000,
      status: "CONFIRMED_BY_MODERATOR",
    },
    {
      identifierType: "URL",
      rawIdentifier: "http://daraz-delivery-tracking.xyz",
      displayMasked: "http://daraz-delivery-••••.xyz",
      category: "Courier Scam",
      platform: "SMS",
      description: "Phishing site imitating Daraz login and asking for credit card details.",
      amountLost: null,
      status: "CONFIRMED_BY_MODERATOR",
    },
    {
      identifierType: "PHONE",
      rawIdentifier: "+94765432109",
      displayMasked: "+94 76 •••• 109",
      category: "OTP Scam",
      platform: "Call",
      description: "Caller claimed to be from Commercial Bank asking to read out the 6-digit OTP sent to my phone.",
      amountLost: null,
      status: "CONFIRMED_BY_MODERATOR",
    },
    {
      identifierType: "URL",
      rawIdentifier: "https://combank-secure-update.online",
      displayMasked: "https://combank-secure-••••.online",
      category: "Banking Scam",
      platform: "Email",
      description: "Fake ComBank digital banking page requesting user ID, password, and OTP.",
      amountLost: 0,
      status: "CONFIRMED_BY_MODERATOR",
    },
    {
      identifierType: "PHONE",
      rawIdentifier: "+94781122334",
      displayMasked: "+94 78 •••• 334",
      category: "Job Scam",
      platform: "WhatsApp",
      description: "Job offer for liking YouTube videos, asked for Rs. 5,000 registration fee.",
      amountLost: 5000,
      status: "UNDER_REVIEW",
    },
  ];

  for (const r of sampleReports) {
    const hash = hashValue(r.rawIdentifier);
    await prisma.communityReport.create({
      data: {
        userId: demoUser.id,
        identifierType: r.identifierType,
        identifierValueHash: hash,
        displayValueMasked: r.displayMasked,
        category: r.category,
        platform: r.platform,
        description: r.description,
        amountLost: r.amountLost,
        currency: "LKR",
        status: r.status,
      },
    });
  }

  console.log("✅ Seeded Community Reports");

  // 5. Recent Checks (Sample Scans)
  const sampleScans = [
    {
      scanType: "MESSAGE",
      summary: "Parcel Delivery Message claiming customs detention",
      riskLevel: "HIGH_RISK",
      riskScore: 87,
      language: "en",
      claimedOrg: "Sri Lanka Post",
      inputs: [
        {
          inputType: "TEXT",
          text: "Your parcel has been detained. Pay Rs. 450 immediately using this link: http://slpost-customs-clearance.top/pay",
        },
      ],
      signals: [
        {
          type: "url_intelligence",
          score: 92,
          confidence: 95,
          title: "Suspicious website",
          description: "The website domain slpost-customs-clearance.top does not match the official domain (slpost.gov.lk) for Sri Lanka Post.",
          evidence: "Domain: slpost-customs-clearance.top vs official slpost.gov.lk",
          source: "URL Intelligence & Brand Registry",
        },
        {
          type: "ai_message_analysis",
          score: 85,
          confidence: 90,
          title: "Urgent payment request",
          description: "The message pressures you to pay immediately under threat of detention.",
          evidence: "Text: 'Pay Rs. 450 immediately'",
          source: "AI Message Analysis",
        },
        {
          type: "sender_verification",
          score: 75,
          confidence: 80,
          title: "Sender not verified",
          description: "We could not verify the sender identity against official courier registries.",
          evidence: "Unverified SMS sender header",
          source: "Sender Verification Engine",
        },
        {
          type: "threat_intel",
          score: 95,
          confidence: 99,
          title: "Known malicious indicator",
          description: "Similar links have been flagged as phishing destinations targeting postal customers.",
          evidence: "slpost-customs-clearance.top listed in threat intelligence database",
          source: "ScamCheck Threat Intelligence",
        },
      ],
    },
    {
      scanType: "MESSAGE",
      summary: "Facebook Marketplace Seller payment request",
      riskLevel: "MEDIUM_RISK",
      riskScore: 52,
      language: "en",
      claimedOrg: null,
      inputs: [
        {
          inputType: "TEXT",
          text: "Hi, item still available. I can courier today if you transfer 50% advance to my personal account.",
        },
      ],
      signals: [
        {
          type: "ai_message_analysis",
          score: 55,
          confidence: 85,
          title: "Advance payment request",
          description: "Requesting bank transfer before inspection or formal delivery in marketplace transactions is a common risk pattern.",
          evidence: "Text: 'transfer 50% advance to my personal account'",
          source: "AI Message Analysis",
        },
        {
          type: "sender_verification",
          score: 50,
          confidence: 70,
          title: "Unverified private individual",
          description: "No verified merchant credentials found for this seller.",
          evidence: "Private bank account transfer request",
          source: "Sender Verification Engine",
        },
      ],
    },
    {
      scanType: "PHONE",
      summary: "Unknown number with multiple community reports",
      riskLevel: "HIGH_RISK",
      riskScore: 82,
      language: "en",
      claimedOrg: null,
      normalizedTarget: "+94770192834",
      inputs: [
        {
          inputType: "PHONE",
          text: "+94770192834",
        },
      ],
      signals: [
        {
          type: "community_reports",
          score: 85,
          confidence: 90,
          title: "Multiple community reports",
          description: "This number has received 23 community reports across Marketplace Scam, Courier Scam, and Impersonation.",
          evidence: "23 community reports recorded",
          source: "ScamCheck Community Intelligence",
        },
      ],
    },
    {
      scanType: "URL",
      summary: "Dialog official promotional portal link",
      riskLevel: "LOW_RISK",
      riskScore: 12,
      language: "en",
      claimedOrg: "Dialog Axiata",
      normalizedTarget: "https://dialog.lk/myaccount",
      inputs: [
        {
          inputType: "URL",
          text: "https://dialog.lk/myaccount",
        },
      ],
      signals: [
        {
          type: "brand_impersonation",
          score: 10,
          confidence: 99,
          title: "Matches official verified brand domain",
          description: "The domain dialog.lk matches the verified official domain stored in the Brand Registry for Dialog Axiata.",
          evidence: "Official domain: dialog.lk",
          source: "Brand Registry",
        },
        {
          type: "url_intelligence",
          score: 12,
          confidence: 95,
          title: "Secure HTTPS and clean reputation",
          description: "Valid SSL certificate, official domain hierarchy, and no threat reports.",
          evidence: "HTTPS valid, 0 threat matches",
          source: "URL Intelligence",
        },
      ],
    },
  ];

  for (const s of sampleScans) {
    const createdScan = await prisma.scan.create({
      data: {
        userId: demoUser.id,
        scanType: s.scanType,
        summary: s.summary,
        riskLevel: s.riskLevel,
        riskScore: s.riskScore,
        language: s.language,
        claimedOrg: s.claimedOrg,
        normalizedTarget: s.normalizedTarget,
        status: "COMPLETED",
        inputs: {
          create: s.inputs,
        },
        signals: {
          create: s.signals,
        },
      },
    });
  }

  console.log("✅ Seeded Sample Scans & Intelligence Signals");
  console.log("🎉 Database seeding completed successfully!");
}

main()
  .catch((e) => {
    console.error("❌ Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
