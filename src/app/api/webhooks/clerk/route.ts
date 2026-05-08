import { NextRequest, NextResponse } from "next/server";
import { verifyWebhook } from "@clerk/backend/webhooks";

import { prisma } from "@src/shared/lib/prisma";
import { env } from "@src/env";

export async function POST(req: NextRequest) {
  const svixId = req.headers.get("svix-id");
  const svixTs = req.headers.get("svix-timestamp");
  const svixSig = req.headers.get("svix-signature");

  console.log("[Clerk Webhook] Received request");
  console.log("[Clerk Webhook] svix-id:", svixId);
  console.log("[Clerk Webhook] svix-timestamp:", svixTs);
  console.log("[Clerk Webhook] svix-signature:", svixSig?.slice(0, 20) + "...");

  try {
    const evt = await verifyWebhook(req, {
      signingSecret: env.CLERK_WEBHOOK_SECRET,
    });

    console.log("[Clerk Webhook] Verified event type:", evt.type);
    console.log(
      "[Clerk Webhook] Event data:",
      JSON.stringify(evt.data, null, 2),
    );

    const { type, data } = evt;

    switch (type) {
      case "user.created": {
        const { id, email_addresses, first_name, last_name } = data;

        console.log("[Clerk Webhook] Processing user.created for id:", id);

        const email = email_addresses?.[0]?.email_address;

        if (!email) {
          console.log("[Clerk Webhook] No email found in payload");
          return NextResponse.json(
            { error: "No email found in webhook payload" },
            { status: 400 },
          );
        }

        const existing = await prisma.user.findUnique({
          where: { clerkId: id },
        });

        if (existing) {
          console.log("[Clerk Webhook] User already exists with clerkId:", id);
          return NextResponse.json({ message: "User already exists" });
        }

        await prisma.user.create({
          data: {
            clerkId: id,
            email,
            name:
              [first_name, last_name].filter(Boolean).join(" ") || "Unknown",
            associationId: "",
          },
        });

        console.log("[Clerk Webhook] User created successfully:", id);
        return NextResponse.json({ message: "User created" }, { status: 201 });
      }

      case "user.updated": {
        const { id, email_addresses, first_name, last_name, image_url } = data;
        const email = email_addresses?.[0]?.email_address;

        console.log("[Clerk Webhook] Processing user.updated for id:", id);

        await prisma.user.update({
          where: { clerkId: id },
          data: {
            ...(email && { email }),
            ...(first_name || last_name
              ? { name: [first_name, last_name].filter(Boolean).join(" ") }
              : {}),
            ...(image_url && { imageUrl: image_url }),
          },
        });

        console.log("[Clerk Webhook] User updated successfully:", id);
        return NextResponse.json({ message: "User updated" });
      }

      case "user.deleted": {
        const { id } = data;
        console.log("[Clerk Webhook] Processing user.deleted for id:", id);
        await prisma.user.update({
          where: { clerkId: id },
          data: { status: "ANONYMIZED", deletedAt: new Date() },
        });
        console.log("[Clerk Webhook] User anonymized successfully:", id);
        return NextResponse.json({ message: "User anonymized" });
      }

      default:
        console.log("[Clerk Webhook] Unhandled event type:", type);
        return NextResponse.json({ message: "Event ignored" });
    }
  } catch (err) {
    console.error("[Clerk Webhook Error]", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

