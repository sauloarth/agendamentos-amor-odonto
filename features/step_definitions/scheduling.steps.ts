import { Given } from '@cucumber/cucumber';
import Product from '../../src/models/Product';
import Block from '../../src/models/Block';
import Appointment from '../../src/models/Appointment';
import { ApiWorld } from '../support/world';
import { parseRelativeDate, weekdayIndex } from '../support/dates';

const splitList = (text: string): string[] =>
  text
    .split(/,|\band\b/)
    .map((item) => item.trim())
    .filter(Boolean);

// Products

const createProduct = async (
  world: ApiWorld,
  name: string,
  durationMinutes: number,
  price: number,
  professionals: string[]
): Promise<void> => {
  const product = await Product.create({
    name,
    durationMinutes,
    price,
    professionals: professionals.map((alias) => world.user(alias).id),
  });
  world.remember('product', name, product._id.toString());
};

Given(
  'a product {string} lasting {int} minutes costing {float}',
  async function (this: ApiWorld, name: string, duration: number, price: number) {
    await createProduct(this, name, duration, price, []);
  }
);

Given(
  'a product {string} lasting {int} minutes costing {float} performed by {string}',
  async function (this: ApiWorld, name: string, duration: number, price: number, professionals: string) {
    await createProduct(this, name, duration, price, splitList(professionals));
  }
);

Given('the product {string} is inactive', async function (this: ApiWorld, name: string) {
  await Product.findByIdAndUpdate(this.id('product', name), { active: false });
});

// Blocks

const createSingleBlock = async (
  world: ApiWorld,
  alias: string,
  professional: string | null,
  from: string,
  to: string
): Promise<void> => {
  const block = await Block.create({
    type: 'single',
    professional,
    startDateTime: parseRelativeDate(from),
    endDateTime: parseRelativeDate(to),
  });
  world.remember('block', alias, block._id.toString());
};

Given(
  'a single block {string} for {string} from {string} to {string}',
  async function (this: ApiWorld, alias: string, professional: string, from: string, to: string) {
    await createSingleBlock(this, alias, this.user(professional).id, from, to);
  }
);

Given(
  'a single block {string} for the whole clinic from {string} to {string}',
  async function (this: ApiWorld, alias: string, from: string, to: string) {
    await createSingleBlock(this, alias, null, from, to);
  }
);

Given(
  'a recurring block {string} for {string} on {string} from {string} to {string}',
  async function (this: ApiWorld, alias: string, professional: string, days: string, startTime: string, endTime: string) {
    const block = await Block.create({
      type: 'recurring',
      professional: this.user(professional).id,
      daysOfWeek: splitList(days).map(weekdayIndex),
      startTime,
      endTime,
    });
    this.remember('block', alias, block._id.toString());
  }
);

// Appointments

Given(
  '{string} has an appointment {string} with {string} for {string} at {string}',
  async function (this: ApiWorld, client: string, alias: string, professional: string, productName: string, at: string) {
    const product = await Product.findById(this.id('product', productName));
    const startDateTime = parseRelativeDate(at);

    const appointment = await Appointment.create({
      client: this.user(client).id,
      professional: this.user(professional).id,
      product: product!._id,
      startDateTime,
      endDateTime: new Date(startDateTime.getTime() + product!.durationMinutes * 60000),
    });
    this.remember('appointment', alias, appointment._id.toString());
  }
);

Given('the appointment {string} is cancelled', async function (this: ApiWorld, alias: string) {
  await Appointment.findByIdAndUpdate(this.id('appointment', alias), { status: 'cancelled' });
});
