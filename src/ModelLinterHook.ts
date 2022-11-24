import type { BuildPlatformContext } from "@jovotech/cli-command-build";
import fs from "fs";

export function ModelLinterHook(context: BuildPlatformContext): void {
  console.log("👌 Launching Model Linter");

  context.locales.forEach((locale: string) => {
    const modelJson: string = fs.readFileSync(
      "models/" + locale + ".json",
      "utf8"
    );

    const model = JSON.parse(modelJson);
    validateModel(model, locale);
  });
}

/**
 * TODO:
 * - Check if required EntityType exists in the model
 * - ...
 *
 * @param {*} model
 * @param {*} locale
 */

export function validateModel(model: any, locale: string): void {
  assertNoDuplicatePhrases(model, locale);
  assertNoDuplicateEntityTypeValues(model, locale);

  assertNoSuperfluousWhitespaceInPhrases(model, locale);
  assertNoSuperfluousWhitespaceInEntityTypes(model, locale);

  assertCorrectBracketsInPhrases(model, locale);
}

/**
 * Within the JSON model structure under the element "intents" make sure that
 * there are no duplicate values in all the entries with the name "phrases".
 *
 * In other words: make sure that not to intents listen to the same phrase.
 *
 * @param {*} model
 * @param {*} locale
 */
function assertNoDuplicatePhrases(model: any, locale: string): void {
  const intents = model.intents;
  const phrasesMap: { [key: string]: string } = {};
  Object.keys(intents).forEach((intent) => {
    const phrases = model.intents[intent].phrases;
    phrases?.forEach((phrase: string) => {
      phrase = phrase.trim().toLowerCase();
      if (phrasesMap[phrase]) {
        console.warn(
          `🔺 Warning: phrase '${phrase}' is used in both intents '${phrasesMap[phrase]}' and '${intent}' in '${locale}' model. `
        );
      }
      phrasesMap[phrase] = intent;
    });
  });
}

/**
 * Within the JSON model structure under the element "entityTypes" make sure that
 * there are no duplicate values/synonyms in all the entries with the name "phrases".
 *
 * In other words: you might run into problems if different entities are configured
 * to use the same value.
 *
 * @param {*} model
 * @param {*} locale
 */
function assertNoDuplicateEntityTypeValues(model: any, locale: string): void {
  const entityTypes = model.entityTypes;
  if (entityTypes === undefined) {
    return;
  }
  const entityTypeValueMap: { [key: string]: string } = {};
  Object.keys(entityTypes).forEach((entityType) => {
    const values = model.entityTypes[entityType].values;
    values?.forEach((value: any) => {
      if (typeof value === "object") {
        const entityTypeValue = value.value.trim().toLowerCase();

        if (entityTypeValueMap[entityTypeValue]) {
          console.warn(
            `🔺 Warning: value '${entityTypeValue}' is used at least twice in both entity types '${entityTypeValueMap[entityTypeValue]}' and '${entityType}' in '${locale}' model. `
          );
        }
        entityTypeValueMap[value] = entityType.trim().toLowerCase();

        value.synonyms?.forEach((synonym: string) => {
          synonym = synonym.trim().toLowerCase();
          if (entityTypeValueMap[synonym]) {
            console.warn(
              `🔺 Warning: synonym/value '${synonym}' is used at least twice in both entity types '${entityTypeValueMap[synonym]}' and '${entityType}' in '${locale}' model. `
            );
          }
          entityTypeValueMap[synonym] = entityTypeValue;
        });
      } else {
        // entity type value is a plain string
        value = value.trim().toLowerCase();
        if (entityTypeValueMap[value]) {
          console.warn(
            `🔺 Warning: value '${value}' is used at least twice in both entity types '${entityTypeValueMap[value]}' and '${entityType}' in '${locale}' model. `
          );
        }
        entityTypeValueMap[value] = entityType.trim().toLowerCase();
      }
    });
  });
}

/**
 * Within the JSON model structure under the element "intents" make sure that
 * there is no superfluous whitespace in all the entries with the name "phrases"
 *
 * In other words: you might want to trim redundant whitespace
 *
 * @param {*} model
 * @param {*} locale
 */
function assertNoSuperfluousWhitespaceInPhrases(
  model: any,
  locale: string
): void {
  const intents = model.intents;
  const phrasesMap: { [key: string]: string } = {};
  Object.keys(intents).forEach((intent) => {
    const phrases = model.intents[intent].phrases;
    phrases?.forEach((phrase: string) => {
      if (phrase !== phrase.trim()) {
        console.warn(
          `🔺 Warning: phrase '${phrase}' has superfluous whitespace in intent '${intent}' in '${locale}' model. `
        );
      }
      phrasesMap[phrase] = intent;
    });
  });
}

/**
 * Within the JSON model structure under the element "entityTypes" make sure that
 * there is no superfluous whitespace in synonyms and values
 *
 * In other words: you might want to trim redundant whitespace
 *
 * @param {*} model
 * @param {*} locale
 */
function assertNoSuperfluousWhitespaceInEntityTypes(
  model: any,
  locale: string
) {
  const entityTypes = model.entityTypes;
  if (entityTypes === undefined) {
    return;
  }

  Object.keys(entityTypes).forEach((entityType) => {
    const values = model.entityTypes[entityType].values;
    values?.forEach((value: any) => {
      if (typeof value === "object") {
        if (value.value !== value.value.trim()) {
          console.warn(
            `🔺 Warning: value '${value.value}' has superfluous whitespace in entity type '${entityType}' in '${locale}' model. `
          );
        }
        value.synonyms?.forEach((synonym: string) => {
          if (synonym !== synonym.trim()) {
            console.warn(
              `🔺 Warning: synonym/value '${synonym}' has superfluous whitespace in entity type '${entityType}' in '${locale}' model. `
            );
          }
        });
      } else {
        // entity type value is a plain string
        if (value !== value.trim()) {
          console.warn(
            `🔺 Warning: value '${value}' has superfluous whitespace in entity type '${entityType}' in '${locale}' model. `
          );
        }
      }
    });
  });
}

/**
 * Within the JSON model structure under the element "intents" make sure that within the example
 * phrases the curly brackets for variables are syntactically correct
 *
 * In other words: complain about expressions like "what is your {name" or "what is your {{name}"
 * or "what is your name}"
 *
 * @param {*} model
 * @param {*} locale
 */
function assertCorrectBracketsInPhrases(model: any, locale: string) {
  const intents = model.intents;
  Object.keys(intents).forEach((intent) => {
    const phrases = model.intents[intent].phrases;
    phrases?.forEach((phrase: string) => {
      let counter = 0;
      for (const character of [...phrase]) {
        if (character === "{") {
          counter++;
        } else if (character === "}") {
          counter--;
        }

        if (counter > 1) {
          console.warn(
            `🔺 Warning: missing closing bracket in phrase '${phrase}' in intent '${intent}' in '${locale}' model. `
          );
          break;
        }

        if (counter < 0) {
          console.warn(
            `🔺 Warning: missing opening bracket in phrase '${phrase}' in intent '${intent}' in '${locale}' model. `
          );
          break;
        }
      }
      if (counter === 1) {
        console.warn(
          `🔺 Warning: missing closing bracket in phrase '${phrase}' in intent '${intent}' in '${locale}' model. `
        );
      }
    });
  });
}
