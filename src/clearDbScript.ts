import {
  anonymizedCustomersCollection,
  customersCollection,
  dbClient,
  logsOfChangesInCustomersDbCollection,
  runDb,
} from "./db";

async function clearDb() {
  try {
    await runDb();
    await dbClient.db("shop").dropDatabase();
    console.log("Documents deleted successfully");
  } catch (error) {
    console.error("Error deleting documents:", error);
  } finally {
    await dbClient.close();
  }
}

clearDb();
