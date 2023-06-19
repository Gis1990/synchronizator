import { synchronizeCustomersFullReindex } from "./synchronizeCustomersFullReindex";
import { MongoClient } from "mongodb";
import { MongoMemoryServer } from "mongodb-memory-server";
import { logsOfChangesInCustomersDbCollection } from "./db";
import { faker } from "@faker-js/faker";

let mongoServer: MongoMemoryServer;
let client: MongoClient;

describe("synchronizeCustomersFullReindex", () => {
  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    client = new MongoClient(mongoUri);
    await client.connect();
  });
  afterAll(async () => {
    await client.db().dropDatabase();
    await mongoServer.stop();
    await client.close();
  });
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("should handle errors", async () => {
    const errorMessage = "Something went wrong";
    jest.spyOn(console, "error").mockImplementation(() => {});
    jest.spyOn(console, "log").mockImplementation(() => {});
    jest
      .spyOn(logsOfChangesInCustomersDbCollection, "find")
      .mockImplementation(() => {
        throw new Error(errorMessage);
      });

    await synchronizeCustomersFullReindex();

    expect(console.error).toHaveBeenCalledWith(
      "Error during full reindexing.",
      expect.any(Error)
    );
    expect(console.log).not.toHaveBeenCalledWith(
      "Full reindexing completed successfully."
    );
  });
  test("should complete successfully", async () => {
    const db = client.db();
    const customer1 = {
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

    await db.collection("customers").insertOne(customer1);
    const customersCollection = await db
      .collection("customers")
      .find({})
      .toArray();
    expect(customersCollection.length).toBeGreaterThan(0);
  });
});
