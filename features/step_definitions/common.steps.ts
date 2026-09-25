import assert from 'node:assert/strict';
import { Given, When, Then, DataTable } from '@cucumber/cucumber';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User, { IUser } from '../../src/models/User';
import { ApiWorld } from '../support/world';

const PASSWORD = 'secret123';

const getPath = (value: any, path: string): any =>
  path.split('.').reduce((current, key) => (current == null ? undefined : current[key]), value);

const createUser = async (world: ApiWorld, alias: string, role: IUser['role']): Promise<void> => {
  const email = `${alias}@test.com`;
  const user = await User.create({ name: alias, email, password: await bcrypt.hash(PASSWORD, 4), role });
  const id = user._id.toString();
  const token = jwt.sign({ id }, process.env.JWT_SECRET!, { expiresIn: '1h' });

  world.users.set(alias, { id, token, email, password: PASSWORD });
  world.remember('user', alias, id);
};

// Users

Given('a client {string}', async function (this: ApiWorld, alias: string) {
  await createUser(this, alias, 'client');
});

Given('a professional {string}', async function (this: ApiWorld, alias: string) {
  await createUser(this, alias, 'professional');
});

Given('an admin {string}', async function (this: ApiWorld, alias: string) {
  await createUser(this, alias, 'admin');
});

// Requests

When('{string} sends {word} {string}', async function (this: ApiWorld, alias: string, method: string, path: string) {
  await this.send(method, path, { as: alias });
});

When(
  '{string} sends {word} {string} with:',
  async function (this: ApiWorld, alias: string, method: string, path: string, body: string) {
    await this.send(method, path, { as: alias, body });
  }
);

When('an anonymous user sends {word} {string}', async function (this: ApiWorld, method: string, path: string) {
  await this.send(method, path);
});

When(
  'an anonymous user sends {word} {string} with:',
  async function (this: ApiWorld, method: string, path: string, body: string) {
    await this.send(method, path, { body });
  }
);

When(
  'someone with an invalid token sends {word} {string}',
  async function (this: ApiWorld, method: string, path: string) {
    await this.send(method, path, { token: 'not-a-valid-jwt' });
  }
);

// Assertions

Then('the response status should be {int}', function (this: ApiWorld, status: number) {
  assert.equal(this.response?.status, status, `Response body: ${JSON.stringify(this.body)}`);
});

Then('the response message should be {string}', function (this: ApiWorld, message: string) {
  assert.equal(this.body.message, message);
});

Then('the response should contain:', function (this: ApiWorld, table: DataTable) {
  for (const [path, expected] of table.raw()) {
    assert.equal(String(getPath(this.body, path)), this.resolve(expected), `Field "${path}"`);
  }
});

Then('the response should have a {string}', function (this: ApiWorld, path: string) {
  assert.notEqual(getPath(this.body, path), undefined, `Expected field "${path}" to be present`);
});

Then('the response should not have a {string}', function (this: ApiWorld, path: string) {
  assert.equal(getPath(this.body, path), undefined, `Expected field "${path}" to be absent`);
});

Then('the response should be a list with {int} item(s)', function (this: ApiWorld, count: number) {
  assert.ok(Array.isArray(this.body), 'Expected the response to be a list');
  assert.equal(this.body.length, count);
});

Then('the response field {string} should have {int} item(s)', function (this: ApiWorld, path: string, count: number) {
  const value = getPath(this.body, path);
  assert.ok(Array.isArray(value), `Expected field "${path}" to be a list`);
  assert.equal(value.length, count);
});

Then('the {string} of the listed items should be:', function (this: ApiWorld, path: string, table: DataTable) {
  assert.ok(Array.isArray(this.body), 'Expected the response to be a list');
  const actual = this.body.map((item: unknown) => String(getPath(item, path)));
  const expected = table.raw().map(([value]) => this.resolve(value));
  assert.deepEqual(actual, expected);
});

Then('the validation errors should include field {string}', function (this: ApiWorld, field: string) {
  assert.equal(this.body.message, 'Dados inválidos');
  const fields = (this.body.errors ?? []).map((error: { field: string }) => error.field);
  assert.ok(fields.includes(field), `Expected a validation error on "${field}", got: ${fields.join(', ')}`);
});
