import { before, describe, it } from "node:test";
import assert from "assert";
import { readFile } from "fs/promises";
import { main } from "./main.js";

describe("main", () => {
  let fixtureDocument: string | undefined;

  before(async () => {
    fixtureDocument = await readFile("./examples/oliversalzburg.md", "utf8");
  });

  it("should generate a document matching the fixture", async () => {
    const document = await main("./examples/oliversalzburg.yml");
    assert.strictEqual(document, fixtureDocument);
  });
});
