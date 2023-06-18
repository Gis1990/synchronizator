import { randomBytes } from "crypto";
import { anonymizedCustomersCollection, CustomerType } from "./db";

export async function generateRandomString(): Promise<string> {
  return new Promise((resolve, reject) => {
    randomBytes(4, (err, buffer) => {
      if (err) {
        reject(err);
      } else {
        const randomString = buffer.toString("hex").slice(0, 8);
        resolve(randomString);
      }
    });
  });
}

export async function generateRandomEmail(email: string): Promise<string> {
  const username = await generateRandomString();
  const domain = email.split("@")[1];
  return `${username}@${domain}`;
}

export async function anonymizeCustomer(customer: any): Promise<CustomerType> {
  const anonymizedCustomer: CustomerType = {
    _id: customer._id,
    firstName: await generateRandomString(),
    lastName: await generateRandomString(),
    email: await generateRandomEmail(customer.email),
    address: {
      line1: await generateRandomString(),
      line2: await generateRandomString(),
      postcode: await generateRandomString(),
      city: customer.address.city,
      state: customer.address.state,
      country: customer.address.country,
    },
    createdAt: customer.createdAt,
  };

  return anonymizedCustomer;
}

export async function insertBatchOfAnonymizedCustomers(
  arrayOfAnonymizedCustomers: CustomerType[]
): Promise<void> {
  const bulkOperations = arrayOfAnonymizedCustomers.map((customer) => ({
    replaceOne: {
      filter: { _id: customer._id },
      replacement: customer,
      upsert: true,
    },
  }));
  try {
    await anonymizedCustomersCollection.bulkWrite(bulkOperations);
    console.log(`Processed ${bulkOperations.length} documents`);
  } catch (error) {
    console.error("Error during bulk write:", error);
    throw error;
  }
}
