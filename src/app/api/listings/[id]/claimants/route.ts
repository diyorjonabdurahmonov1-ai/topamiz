import { NextResponse } from "next/server";
import { displayIdentity, getCurrentUser } from "@/lib/auth";
import { getListingById } from "@/lib/listings";
import { getListingClaimants } from "@/lib/messages";

// Owner-only — lets them see everyone who has claimed to have found their
// listing before picking one to confirm, instead of a "found it!" claim
// resolving the listing on its own.
export async function GET(_request: Request, ctx: RouteContext<"/api/listings/[id]/claimants">) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Kirish talab qilinadi" }, { status: 401 });

  const { id } = await ctx.params;
  const listing = getListingById(id);
  if (!listing) return NextResponse.json({ error: "Topilmadi" }, { status: 404 });
  if (listing.ownerId !== user.id) {
    return NextResponse.json({ error: "Ruxsat yo'q" }, { status: 403 });
  }

  const claimants = getListingClaimants(Number(id), user.id).map((c) => {
    const identity = displayIdentity(c.sender);
    return {
      id: c.sender.id,
      name: identity.name,
      avatarColor: identity.avatarColor,
      avatarUrl: identity.avatarUrl,
      body: c.body,
      photoUrls: c.photoUrls,
      createdAt: c.createdAt,
    };
  });

  return NextResponse.json({ claimants });
}
