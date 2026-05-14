import { NextResponse } from "next/server";
import { env } from "@src/env";
import { runDsarSlaCron } from "@src/features/cron/services";

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");

  if (authHeader !== `Bearer ${env.CRON_SECRET}`) {
    return NextResponse.json(
      { error: "Unauthorized", code: "UNAUTHORIZED" },
      { status: 401 },
    );
  }

  try {
    const results = await runDsarSlaCron();

    const totalBreached = results.reduce((sum, r) => sum + r.breached, 0);
    const totalAtRisk = results.reduce((sum, r) => sum + r.atRisk, 0);
    const processedAssociations = results.filter((r) => r.processed).length;

    return NextResponse.json({
      success: true,
      message: "DSAR SLA check completed",
      summary: {
        totalAssociations: results.length,
        processedAssociations,
        totalBreached,
        totalAtRisk,
      },
      results,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: "Internal server error",
        code: "INTERNAL_ERROR",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}