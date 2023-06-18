import {
  customersCollection,
  CustomerType,
  getStateOfSync,
  logsOfChangesInCustomersDbCollection,
  LogTypeForCustomers,
  saveStateOfSync,
} from "./db";
import { anonymizeCustomer, insertBatchOfAnonymizedCustomers } from "./utils";
import { ObjectId } from "mongodb";

export async function synchronizeCustomersInRealTime(): Promise<void> {
  try {
    const startTime = new Date();
    while (true) {
      let lastCheckpointDate = await getStateOfSync("RealTime");
      let arrayOfAnonymizedCustomers: CustomerType[] = [];

      // Fetch customer IDs from the customers collection based on the last checkpoint date
      let query: any = lastCheckpointDate
        ? { timeOfTheLastChange: { $gt: lastCheckpointDate } }
        : { timeOfTheLastChange: { $gt: startTime } };
      let customerIdsFromDb: LogTypeForCustomers[] =
        await logsOfChangesInCustomersDbCollection
          .find(query, { projection: { customerId: 1, _id: 0 } })
          .toArray();
      let customerIds: ObjectId[] = customerIdsFromDb.map(
        (item: LogTypeForCustomers) => item.customerId
      );
      // Fetch customers from the customers collection based on the retrieved customer IDs
      let customers = await customersCollection
        .find({ _id: { $in: customerIds } })
        .toArray();
      // Process each customer and collect anonymized data
      for (let customer of customers) {
        let anonymizedCustomer = await anonymizeCustomer(customer);
        arrayOfAnonymizedCustomers.push(anonymizedCustomer);

        // Insert a batch of anonymized customers when the array reaches 1000
        if (arrayOfAnonymizedCustomers.length === 1000) {
          const lastInsertedAnomizedCustomer =
            arrayOfAnonymizedCustomers[arrayOfAnonymizedCustomers.length - 1];
          const lastInsertedCustomerId = lastInsertedAnomizedCustomer._id;

          // Check if the last inserted customer exists in the database
          const lastInsertedCustomer =
            await logsOfChangesInCustomersDbCollection.findOne({
              customerId: lastInsertedCustomerId,
            });
          if (!lastInsertedCustomer) {
            throw new Error(
              `The customer with id ${lastInsertedCustomerId} does not exist in the database.`
            );
          }

          const dateOfTheLastInsertedCustomer =
            lastInsertedCustomer.timeOfTheLastChange;

          // Insert the batch of anonymized customers and update the sync state
          await insertBatchOfAnonymizedCustomers(arrayOfAnonymizedCustomers);
          await saveStateOfSync(
            "RealTime",
            dateOfTheLastInsertedCustomer,
            null
          );
          arrayOfAnonymizedCustomers = [];
        }
      }
      await new Promise((resolve) => setTimeout(resolve, 1000));
      if (arrayOfAnonymizedCustomers.length > 0) {
        const lastInsertedAnomizedCustomer =
          arrayOfAnonymizedCustomers[arrayOfAnonymizedCustomers.length - 1];
        const lastInsertedCustomerId = lastInsertedAnomizedCustomer._id;

        // Check if the last inserted customer exists in the database
        const lastInsertedCustomer =
          await logsOfChangesInCustomersDbCollection.findOne({
            customerId: lastInsertedCustomerId,
          });
        if (!lastInsertedCustomer) {
          throw new Error(
            `The customer with id ${lastInsertedCustomerId} does not exist in the database.`
          );
        }

        const dateOfTheLastInsertedCustomer =
          lastInsertedCustomer.timeOfTheLastChange;

        // Insert the batch of anonymized customers and update the sync state
        await insertBatchOfAnonymizedCustomers(arrayOfAnonymizedCustomers);
        await saveStateOfSync("RealTime", dateOfTheLastInsertedCustomer, null);
        arrayOfAnonymizedCustomers = [];
      }
    }
  } catch (error) {
    console.error("Error connecting to MongoDB:", error);
  }
}
