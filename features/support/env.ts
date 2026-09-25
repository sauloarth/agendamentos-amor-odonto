import { setDefaultTimeout } from '@cucumber/cucumber';

// Scheduling rules (recurring blocks, midnight rule) depend on the process timezone.
process.env.TZ = 'America/Sao_Paulo';
process.env.JWT_SECRET = 'test-secret';
process.env.JWT_EXPIRES_IN = '1h';
process.env.EMAIL_FROM = 'Amor Odonto <no-reply@test.com>';

// The first run downloads the MongoDB binary used by mongodb-memory-server.
setDefaultTimeout(60_000);
