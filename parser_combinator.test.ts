import { assertEquals, assertArrayIncludes, assertThrows } from "https://deno.land/std@0.212.0/assert/mod.ts";
import { afterEach, beforeEach, describe, it, beforeAll } from "https://deno.land/std@0.201.0/testing/bdd.ts";
import { satisfy, and, or, map } from "./parser_combinators.ts";

describe("Satisfy:", () => {
	const parserA = satisfy(char => char === "a");
	it(() => {
		assertArrayIncludes(parserA("abc"), ["a", "bc"]);
	});
	it(() => {
		assertArrayIncludes(parserA("bca"), [new Error(), "bca"]);
	});
});

describe("And:", () => {
	const parserA = satisfy(char => char === "a");
	const parserB = satisfy(char => char === "b");

	it(() => {
		assertArrayIncludes(and(parserA, parserB)("abc"), [["a", "b"], "c"]);
	});
	it(() => {
		assertArrayIncludes(and(parserA, parserB)("acb"), [new Error(), "acb"]);
	});
	it(() => {
		assertArrayIncludes(and(parserA, parserB)("cab"), [new Error(), "cab"]);
	});
});

describe("Or:", () => {
	const parserA = satisfy(char => char === "a");
	const parserB = satisfy(char => char === "b");

	it(() => {
		assertArrayIncludes(or(parserA, parserB)("abc"), ["a", "bc"]);
	});
	it(() => {
		assertArrayIncludes(or(parserA, parserB)("bca"), ["b", "ca"]);
	});
	it(() => {
		assertArrayIncludes(or(parserA, parserB)("cab"), [new Error(), "cab"]);
	});
});

describe("Map:", () => {
	const parserA = satisfy(char => char === "a");

	it(() => {
		assertArrayIncludes(map(parserA, result => result.toUpperCase())("abc"), ["A", "bc"]);
	});
	it(() => {
		assertArrayIncludes(map(parserA, result => result.toUpperCase())("bca"), [new Error(), "bca"]);
	});
});
