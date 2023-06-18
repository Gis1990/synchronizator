import { MongoClient, ObjectId } from "mongodb";
import "dotenv/config";

type AddressType = {
  line1: string;
  line2: string;
  postcode: string;
  city: string;
  state: string;
  country: string;
};

export type CustomerType = {
  _id?: ObjectId;
  firstName: string;
  lastName: string;
  email: string;
  address: AddressType;
  createdAt: Date;
};

export type LogTypeForCustomers = {
  customerId: ObjectId;
  timeOfTheLastChange: Date;
};

export type LogTypeForSync = {
  programIdentifier: string;
  lastCheckpointDate: Date | null;
  wasCorrectFinish: boolean | null;
};

const dbUri = process.env.DB_URI || "mongodb://localhost:27017";

export const dbClient = new MongoClient(dbUri);

export const customersCollection = dbClient
  .db("shop")
  .collection<CustomerType>("Customers");
export const anonymizedCustomersCollection = dbClient
  .db("shop")
  .collection<CustomerType>("Anonymized customers");
export const logsOfChangesInCustomersDbCollection = dbClient
  .db("shop")
  .collection<LogTypeForCustomers>("Log for customers");
export const logsForSyncCollection = dbClient
  .db("shop")
  .collection<LogTypeForSync>("Log for sync");

export async function getStateOfSync(
  programIdentifier: string
): Promise<Date | { _date: string } | null> {
  const result = await logsForSyncCollection.findOne({ programIdentifier });
  if (programIdentifier === "fullReindex" && result?.wasCorrectFinish) {
    return null;
  }
  return result?.lastCheckpointDate || null;
}

export async function saveStateOfSync(
  programIdentifier: string,
  lastCheckpointDate: Date | null,
  wasCorrectFinish: boolean | null
): Promise<boolean> {
  const result = await logsForSyncCollection.updateOne(
    { programIdentifier },
    {
      $set: {
        lastCheckpointDate: lastCheckpointDate,
        wasCorrectFinish: wasCorrectFinish,
      },
    },
    { upsert: true }
  );
  return result.modifiedCount === 1;
}

export async function getDateOfTheLastUpdateInCustomersDb(): Promise<Date | null> {
  const result = await logsOfChangesInCustomersDbCollection
    .find()
    .sort({ timeOfTheLastChange: -1 })
    .limit(1)
    .toArray();
  return result[0]?.timeOfTheLastChange || null;
}

export async function updateLogsForCustomersDb(
  log: LogTypeForCustomers[]
): Promise<boolean> {
  try {
    const updateOperations = log.map(({ customerId, timeOfTheLastChange }) => ({
      updateOne: {
        filter: { customerId: customerId },
        update: { $set: { timeOfTheLastChange: timeOfTheLastChange } },
        upsert: true,
      },
    }));

    const result = await logsOfChangesInCustomersDbCollection.bulkWrite(
      updateOperations
    );
    return result.modifiedCount === log.length;
  } catch (error) {
    console.error("Error:", error);
    return false;
  }
}

export async function runDb() {
  try {
    await dbClient.connect();
    console.log("Connected successfully to mongo server");
  } catch {
    console.log("Error connecting to mongo server");
    await dbClient.close();
  }
}

export async function stopDb() {
  await dbClient.close();
  console.log("Program stopped");
}
