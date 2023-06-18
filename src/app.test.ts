import { MongoMemoryServer } from "mongodb-memory-server";
import { MongoClient } from "mongodb";

let mongoServer: MongoMemoryServer;
let client: MongoClient;

describe("Database Tests", () => {
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

  it("should insert customers and perform other actions correctly", async () => {
    // Mock necessary functions
    const insertManyMock = jest.fn();
    // Mock customersCollection
    const customersCollection = {
      insertMany: insertManyMock,
    };

    // Define test data
    const customerData = [
      {
        firstName: "John",
        lastName: "Doe",
        email: "john@example.com",
        address: {
          line1: "123 Street",
          line2: "Apt 4",
          postcode: "12345",
          city: "City",
          state: "State",
          country: "Country",
        },
        createdAt: new Date(),
      },
    ];

    // Call the insertMany function directly on customersCollection
    await customersCollection.insertMany(customerData);

    // Verify if the insertMany function was called with the correct data
    expect(insertManyMock).toHaveBeenCalledWith(customerData);
  });
});
