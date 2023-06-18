import { runDb } from "./db";
import { synchronizeCustomersInRealTime } from "./synchronizeCustomersRealtime";
import { synchronizeCustomersFullReindex } from "./synchronizeCustomersFullReindex";

async function encryptData(): Promise<void> {
  try {
    await runDb();
    const fullReindexFlag = process.argv.includes("--full-reindex");
    if (fullReindexFlag) {
      await synchronizeCustomersFullReindex();
      process.exit(0);
    }
    await synchronizeCustomersInRealTime();
    console.log("Syncing customers...");
  } catch (error) {
    console.error("Error syncing customers:", error);
  }
}

encryptData().catch(console.error);
