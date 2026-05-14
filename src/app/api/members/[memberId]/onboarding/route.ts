import { withAssociation } from "@src/shared/api/with-association";
import { NextResponse } from "next/server";

export const POST = withAssociation({}, async () => {
  // TODO : implement onboarding api
  return NextResponse.json({ message: "HI" });
});
