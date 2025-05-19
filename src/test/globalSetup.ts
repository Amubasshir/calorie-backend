import { MongoMemoryServer } from "mongodb-memory-server";

let mongod: MongoMemoryServer;

export = async () => {
  mongod = await MongoMemoryServer.create();
  const uri = mongod.getUri();
  (global as any).__MONGOD__ = mongod;
  process.env.MONGODB_URI = uri;
};
