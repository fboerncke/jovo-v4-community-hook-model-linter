/*
|--------------------------------------------------------------------------
| UNIT TESTING
|--------------------------------------------------------------------------
|
| Run `npm test` to execute this sample test.
| Learn more here: www.jovo.tech/docs/unit-testing
|
*/

import { validateModel } from "../src/ModelLinterHook";

// suppress output on console
beforeEach(() => {
  jest.spyOn(console, "warn").mockImplementation(() => undefined);
});

afterEach(() => {
  jest.clearAllMocks();
});

test("whitespace at start", async () => {
  const consoleSpy = jest.spyOn(console, "warn");

  validateModel({ intents: { TestIntent: { phrases: [" TEST"] } } }, "de");

  expect(consoleSpy).toHaveBeenLastCalledWith(
    "🔺 Warning: phrase ' TEST' has superfluous whitespace in intent 'TestIntent' in 'de' model. "
  );
});

test("whitespace at end", async () => {
  const consoleSpy = jest.spyOn(console, "warn");

  validateModel({ intents: { TestIntent: { phrases: ["TEST "] } } }, "de");

  expect(consoleSpy).toHaveBeenLastCalledWith(
    "🔺 Warning: phrase 'TEST ' has superfluous whitespace in intent 'TestIntent' in 'de' model. "
  );
});

test("no whitespace in phrase", async () => {
  const consoleSpy = jest.spyOn(console, "warn");
  validateModel({ intents: { TestIntent: { phrases: ["TEST"] } } }, "de");

  expect(consoleSpy).not.toHaveBeenCalledWith(
    "🔺 Warning: phrase 'TEST' has superfluous whitespace in intent 'TestIntent' in 'de' model. "
  );
});

test("no duplicate phrases", async () => {
  const consoleSpy = jest.spyOn(console, "warn");
  validateModel(
    {
      intents: {
        AlphaIntent: { phrases: ["TEST"] },
        BetaIntent: { phrases: ["TEST"] },
      },
    },
    "de"
  );

  expect(consoleSpy).toHaveBeenLastCalledWith(
    "🔺 Warning: phrase 'test' is used in both intents 'AlphaIntent' and 'BetaIntent' in 'de' model. "
  );
});

test("no duplicate phrases - whitespace 1", async () => {
  const consoleSpy = jest.spyOn(console, "warn");
  validateModel(
    {
      intents: {
        AlphaIntent: { phrases: [" TEST"] },
        BetaIntent: { phrases: ["TEST"] },
      },
    },
    "de"
  );

  expect(consoleSpy).toHaveBeenCalledWith(
    "🔺 Warning: phrase 'test' is used in both intents 'AlphaIntent' and 'BetaIntent' in 'de' model. "
  );
  expect(consoleSpy).toHaveBeenCalledWith(
    "🔺 Warning: phrase ' TEST' has superfluous whitespace in intent 'AlphaIntent' in 'de' model. "
  );
});

test("no duplicate phrases whitespace 2", async () => {
  const consoleSpy = jest.spyOn(console, "warn");
  validateModel(
    {
      intents: {
        AlphaIntent: { phrases: ["TEST"] },
        BetaIntent: { phrases: [" TEST"] },
      },
    },
    "de"
  );

  expect(consoleSpy).toHaveBeenCalledWith(
    "🔺 Warning: phrase 'test' is used in both intents 'AlphaIntent' and 'BetaIntent' in 'de' model. "
  );
  expect(consoleSpy).toHaveBeenCalledWith(
    "🔺 Warning: phrase ' TEST' has superfluous whitespace in intent 'BetaIntent' in 'de' model. "
  );
});

test("no duplicate phrases - case match", async () => {
  const consoleSpy = jest.spyOn(console, "warn");
  validateModel(
    {
      intents: {
        AlphaIntent: { phrases: ["TEST"] },
        BetaIntent: { phrases: ["test"] },
      },
    },
    "de"
  );

  expect(consoleSpy).toHaveBeenLastCalledWith(
    "🔺 Warning: phrase 'test' is used in both intents 'AlphaIntent' and 'BetaIntent' in 'de' model. "
  );
});
