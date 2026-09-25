import assert from 'node:assert/strict';
import { Given, Then } from '@cucumber/cucumber';
import { Transporter } from 'nodemailer';
import { setTransporter } from '../../src/services/emailService';
import { ApiWorld } from '../support/world';

const emailsTo = (world: ApiWorld, alias: string) => {
  const email = world.user(alias).email;
  return world.sentEmails.filter((message) => message.to === email);
};

Given('the email server is unavailable', function () {
  setTransporter({
    sendMail: async () => {
      throw new Error('SMTP indisponível');
    },
  } as unknown as Transporter);
});

Then('an email with subject {string} should be sent to {string}', function (this: ApiWorld, subject: string, alias: string) {
  const subjects = emailsTo(this, alias).map((message) => message.subject);
  assert.ok(subjects.includes(subject), `No email "${subject}" to ${alias}; got: ${JSON.stringify(subjects)}`);
});

Then('the email to {string} should mention {string}', function (this: ApiWorld, alias: string, text: string) {
  const messages = emailsTo(this, alias);
  assert.ok(messages.length > 0, `No email sent to ${alias}`);
  assert.ok(
    messages.some((message) => String(message.text).includes(text)),
    `No email to ${alias} mentions "${text}"`
  );
});

Then('no email should be sent to {string}', function (this: ApiWorld, alias: string) {
  assert.equal(emailsTo(this, alias).length, 0);
});

Then('no email should be sent', function (this: ApiWorld) {
  assert.equal(this.sentEmails.length, 0);
});
