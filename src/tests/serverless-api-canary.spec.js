const handler = require('../serverless-api-canary');

test('Simple Test', () => handler.hello().then((data) => {
  expect(data).toBeDefined();
}));
