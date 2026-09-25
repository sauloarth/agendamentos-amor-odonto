import { BeforeAll, Before, AfterAll } from '@cucumber/cucumber';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { SendMailOptions, Transporter } from 'nodemailer';
import { setTransporter } from '../../src/services/emailService';
import { ApiWorld } from './world';

let mongod: MongoMemoryServer;

BeforeAll(async function () {
  mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri());
});

Before(async function (this: ApiWorld) {
  // E-mails are captured in the World instead of going through SMTP.
  setTransporter({
    sendMail: async (message: SendMailOptions) => {
      this.sentEmails.push(message);
      return { messageId: `test-${this.sentEmails.length}` };
    },
  } as unknown as Transporter);

  const collections = Object.values(mongoose.connection.collections);
  await Promise.all(collections.map((collection) => collection.deleteMany({})));
});

AfterAll(async function () {
  await mongoose.disconnect();
  await mongod.stop();
});
