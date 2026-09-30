import prisma from "@/lib/db";

export interface BrandMatchResult {
  claimedBrand: string | null;
  officialDomains: string[];
  isMatch: boolean;
  mismatchReason: string | null;
  brandCountry?: string;
  isVerifiedBrand: boolean;
}

export async function matchBrandDomain(
  claimedBrandNameOrText: string | null,
  targetHostOrDomain: string
): Promise<BrandMatchResult> {
  const cleanTargetHost = targetHostOrDomain.toLowerCase().replace(/^(https?:\/\/)?(www\.)?/, "").split("/")[0].split(":")[0];

  // Retrieve all verified brands and their official domains
  const brands = await prisma.brand.findMany({
    include: { domains: true },
  });

  let matchedBrand: (typeof brands)[0] | null = null;

  // Case 1: Specific brand claimed directly
  if (claimedBrandNameOrText) {
    const claimLower = claimedBrandNameOrText.toLowerCase().trim();
    matchedBrand = brands.find((b) => {
      if (b.name.toLowerCase() === claimLower) return true;
      const aliases = b.aliases.split(",").map((a) => a.trim().toLowerCase());
      return aliases.some((a) => a === claimLower || claimLower.includes(a));
    }) || null;
  }

  // Case 2: No specific brand explicitly passed, but domain or text contains known brand names
  if (!matchedBrand) {
    for (const b of brands) {
      const brandKey = b.name.toLowerCase();
      // Check if target domain tries to squat or imitate the brand name (e.g. 'daraz-delivery.xyz' or 'combank-alert.com')
      if (cleanTargetHost.includes(brandKey.replace(/\s+/g, ""))) {
        matchedBrand = b;
        break;
      }
      // Check aliases in target host
      const aliases = b.aliases.split(",").map((a) => a.trim().toLowerCase());
      const hasAlias = aliases.some((a) => a.length >= 4 && cleanTargetHost.includes(a.replace(/\s+/g, "")));
      if (hasAlias) {
        matchedBrand = b;
        break;
      }
    }
  }

  if (!matchedBrand) {
    return {
      claimedBrand: null,
      officialDomains: [],
      isMatch: false,
      mismatchReason: null,
      isVerifiedBrand: false,
    };
  }

  const officialDomains = matchedBrand.domains.map((d) => d.domain.toLowerCase());

  // Check if target host is an exact match or valid subdomain of an official domain
  const isOfficial = officialDomains.some((official) => {
    return cleanTargetHost === official || cleanTargetHost.endsWith(`.${official}`);
  });

  if (isOfficial) {
    return {
      claimedBrand: matchedBrand.name,
      officialDomains,
      isMatch: true,
      mismatchReason: null,
      brandCountry: matchedBrand.country,
      isVerifiedBrand: matchedBrand.verificationStatus === "VERIFIED",
    };
  }

  return {
    claimedBrand: matchedBrand.name,
    officialDomains,
    isMatch: false,
    mismatchReason: `The website does not match the official domain stored for the organization being claimed (${matchedBrand.name}: ${officialDomains.join(", ")}).`,
    brandCountry: matchedBrand.country,
    isVerifiedBrand: matchedBrand.verificationStatus === "VERIFIED",
  };
}
