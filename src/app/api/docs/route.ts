import { NextResponse } from "next/server";
import { openApiSpec } from "@feature/swagger";

export const GET = () => {
  return NextResponse.json(openApiSpec);
};

export const dynamic = "force-dynamic";