import { BeforeAll, Before, AfterAll } from '@cucumber/cucumber';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

let mongod: MongoMemoryServer;

BeforeAll(async function () {
  mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri());
});

Before(async function () {
  const collections = Object.values(mongoose.connection.collections);
  await Promise.all(collections.map((collection) => collection.deleteMany({})));
});

AfterAll(async function () {
  await mongoose.disconnect();
  await mongod.stop();
});
