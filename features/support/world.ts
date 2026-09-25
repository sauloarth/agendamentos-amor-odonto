import { World, IWorldOptions, setWorldConstructor } from '@cucumber/cucumber';
import request, { Response } from 'supertest';
import { SendMailOptions } from 'nodemailer';
import app from '../../src/app';
import { parseRelativeDate } from './dates';

export interface TestUser {
  id: string;
  token: string;
  email: string;
  password: string;
}

type HttpMethod = 'get' | 'post' | 'put' | 'patch' | 'delete';

/**
 * Test users are created as `<alias>@test.com` with password `secret123` and name `<alias>`.
 *
 * Text sent to the API (paths and JSON bodies) may contain placeholders:
 *   {user:ana}, {product:Cleaning}, {block:lunch}, {appointment:A1} → the entity ID
 *   {date:tomorrow at 10:00} → ISO date (see dates.ts)
 */
export class ApiWorld extends World {
  users = new Map<string, TestUser>();
  ids = new Map<string, string>();
  response?: Response;
  sentEmails: SendMailOptions[] = [];

  constructor(options: IWorldOptions) {
    super(options);
  }

  user(alias: string): TestUser {
    const user = this.users.get(alias);
    if (!user) {
      throw new Error(`Unknown user "${alias}"`);
    }
    return user;
  }

  remember(kind: string, name: string, id: string): void {
    this.ids.set(`${kind}:${name}`, id);
  }

  id(kind: string, name: string): string {
    const id = this.ids.get(`${kind}:${name}`);
    if (!id) {
      throw new Error(`Unknown ${kind} "${name}"`);
    }
    return id;
  }

  resolve(text: string): string {
    return text.replace(/\{(\w+):([^}]+)\}/g, (_, kind: string, name: string) =>
      kind === 'date' ? parseRelativeDate(name).toISOString() : this.id(kind, name)
    );
  }

  async send(method: string, path: string, options: { body?: string; as?: string; token?: string } = {}) {
    let req = request(app)[method.toLowerCase() as HttpMethod](this.resolve(path));

    const token = options.as ? this.user(options.as).token : options.token;
    if (token) {
      req = req.set('Authorization', `Bearer ${token}`);
    }
    if (options.body !== undefined) {
      req = req.send(JSON.parse(this.resolve(options.body)));
    }

    this.response = await req;
  }

  get body(): any {
    if (!this.response) {
      throw new Error('No request has been sent yet');
    }
    return this.response.body;
  }
}

setWorldConstructor(ApiWorld);
