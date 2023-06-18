import { faker } from "@faker-js/faker";
import {
  CustomerType,
  customersCollection,
  runDb,
  stopDb,
  LogTypeForCustomers,
  updateLogsForCustomersDb,
} from "./db";

export let createRandomCustomer = (): CustomerType => {
  return {
    firstName: faker.person.firstName(),
    lastName: faker.person.lastName(),
    email: faker.internet.email(),
    address: {
      line1: faker.location.streetAddress(),
      line2: faker.location.secondaryAddress(),
      postcode: faker.location.zipCode(),
      city: faker.location.city(),
      state: faker.location.state(),
      country: faker.location.country(),
    },
    createdAt: faker.date.past(),
  };
};

export const insertCustomers = async (dataForInsert: CustomerType[]) => {
  try {
    const result = await customersCollection.insertMany(dataForInsert);
    const insertedIds = result.insertedIds;
    const logs: LogTypeForCustomers[] = Object.values(insertedIds).map(
      (id) => ({
        customerId: id,
        timeOfTheLastChange: new Date(),
      })
    );
    await updateLogsForCustomersDb(logs);
    console.log(
      `Inserted ${dataForInsert.length} customers into the collection`
    );
  } catch (error) {
    console.error("Error inserting customers:", error);
  }
};

const start = async () => {
  try {
    await runDb();
    while (true) {
      const customers: CustomerType[] = faker.helpers.multiple(
        createRandomCustomer,
        {
          count: faker.number.int({ min: 1, max: 10 }),
        }
      );
      await insertCustomers(customers);
      await new Promise((resolve) => setTimeout(resolve, 200));
    }
  } catch (error) {
    console.error("Error generating and inserting customers:", error);
  } finally {
    await stopDb();
  }
};

start();
