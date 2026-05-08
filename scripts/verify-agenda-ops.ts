import { processAgendaOperations } from "../src/features/meetings/services/processAgendaOperations";

async function main() {
  try {
    console.log("Testing processAgendaOperations with non-existent meetingId...");
    await processAgendaOperations({
      meetingId: "00000000-0000-0000-0000-000000000000",
      associationId: "00000000-0000-0000-0000-000000000000",
      operations: []
    });
    console.log("FAIL: Should have thrown NotFoundError");
    process.exit(1);
  } catch (error: any) {
    if (error.name === "NotFoundError" || error.code === "NOT_FOUND" || error.message.includes("not found")) {
      console.log("PASS: Threw correct error:", error.message);
    } else {
      console.log("FAIL: Threw unexpected error type:", error.constructor.name);
      console.log(error);
      process.exit(1);
    }
  }
}

main().catch(err => {
  console.error("Unexpected error in script:", err);
  process.exit(1);
});
