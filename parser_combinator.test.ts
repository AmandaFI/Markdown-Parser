import { assertEquals, assertArrayIncludes, assertThrows, assertObjectMatch } from "https://deno.land/std@0.212.0/assert/mod.ts";
import { afterEach, beforeEach, describe, it, beforeAll } from "https://deno.land/std@0.201.0/testing/bdd.ts";
import {
	satisfy,
	and,
	or,
	map,
	manyN,
	many1,
	succeededBy,
	precededBy,
	delimitedBy,
	optional,
	andNot,
	and3,
	or3,
	or4,
	or5,
	or6,
	specificChar,
	allButSpecificChars,
	allButSpecificChar,
	specificChars,
	concat,
	specificCharSequence,
	empty,
	andNot3,
} from "./parser_combinators.ts";

import { boldText, italicText, literalSpecialChars, textChars, textSpace, rawText, line } from "./markdown_parser_combinators.ts";

// deno test parser_combinator.test.ts

describe("Level 1 parsers:", () => {
	const parserA = satisfy(char => char === "a");
	const parserB = satisfy(char => char === "b");
	const parserC = satisfy(char => char === "c");
	const parserD = satisfy(char => char === "d");
	const parserE = satisfy(char => char === "e");
	const parserF = satisfy(char => char === "f");

	const toUp = (char: string) => char.toUpperCase();

	describe("Satisfy:", () => {
		it(() => {
			assertArrayIncludes(parserA("abc"), ["a", "bc"]);
		});
		it(() => {
			assertArrayIncludes(parserA("bca"), [new Error(), "bca"]);
		});
	});

	describe("And:", () => {
		it(() => {
			assertArrayIncludes(and(parserA, parserB)("abc"), [["a", "b"], "c"]);
		});
		it(() => {
			assertArrayIncludes(and(parserA, parserB)("acb"), [new Error(), "acb"]);
		});
		it(() => {
			assertArrayIncludes(and(parserA, parserB)("cab"), [new Error(), "cab"]);
		});
		it("And3", () => {
			assertArrayIncludes(and3(parserA, parserB, parserC)("abc"), [["a", "b", "c"], ""]);
			assertArrayIncludes(and3(parserA, parserB, parserC)("abbc"), [new Error(), "abbc"]);
		});
	});

	describe("Or:", () => {
		it(() => {
			assertArrayIncludes(or(parserA, parserB)("abc"), ["a", "bc"]);
		});
		it(() => {
			assertArrayIncludes(or(parserA, parserB)("bca"), ["b", "ca"]);
		});
		it(() => {
			assertArrayIncludes(or(parserA, parserB)("cab"), [new Error(), "cab"]);
		});
		it("or3", () => {
			assertArrayIncludes(or3(parserA, parserB, parserC)("abc"), ["a", "bc"]);
			assertArrayIncludes(or3(parserA, parserB, parserC)("bca"), ["b", "ca"]);
			assertArrayIncludes(or3(parserA, parserB, parserC)("cab"), ["c", "ab"]);
			assertArrayIncludes(or3(parserA, parserB, parserC)("dcab"), [new Error(), "dcab"]);
		});
		it("or4", () => {
			assertArrayIncludes(or4(parserA, parserB, parserC, parserD)("abc"), ["a", "bc"]);
			assertArrayIncludes(or4(parserA, parserB, parserC, parserD)("bca"), ["b", "ca"]);
			assertArrayIncludes(or4(parserA, parserB, parserC, parserD)("cab"), ["c", "ab"]);
			assertArrayIncludes(or4(parserA, parserB, parserC, parserD)("dcab"), ["d", "cab"]);
			assertArrayIncludes(or4(parserA, parserB, parserC, parserD)("edcab"), [new Error(), "edcab"]);
		});
		it("or5", () => {
			assertArrayIncludes(or5(parserA, parserB, parserC, parserD, parserE)("abc"), ["a", "bc"]);
			assertArrayIncludes(or5(parserA, parserB, parserC, parserD, parserE)("bca"), ["b", "ca"]);
			assertArrayIncludes(or5(parserA, parserB, parserC, parserD, parserE)("cab"), ["c", "ab"]);
			assertArrayIncludes(or5(parserA, parserB, parserC, parserD, parserE)("dcab"), ["d", "cab"]);
			assertArrayIncludes(or5(parserA, parserB, parserC, parserD, parserE)("edcab"), ["e", "dcab"]);
			assertArrayIncludes(or5(parserA, parserB, parserC, parserD, parserE)("fedcab"), [new Error(), "fedcab"]);
		});
		it("or6", () => {
			assertArrayIncludes(or6(parserA, parserB, parserC, parserD, parserE, parserF)("abc"), ["a", "bc"]);
			assertArrayIncludes(or6(parserA, parserB, parserC, parserD, parserE, parserF)("bca"), ["b", "ca"]);
			assertArrayIncludes(or6(parserA, parserB, parserC, parserD, parserE, parserF)("cab"), ["c", "ab"]);
			assertArrayIncludes(or6(parserA, parserB, parserC, parserD, parserE, parserF)("dcab"), ["d", "cab"]);
			assertArrayIncludes(or6(parserA, parserB, parserC, parserD, parserE, parserF)("edcab"), ["e", "dcab"]);
			assertArrayIncludes(or6(parserA, parserB, parserC, parserD, parserE, parserF)("fedcab"), ["f", "edcab"]);
			assertArrayIncludes(or6(parserA, parserB, parserC, parserD, parserE, parserF)("gfedcab"), [new Error(), "gfedcab"]);
		});
	});

	describe("Map:", () => {
		it(() => {
			assertArrayIncludes(map(parserA, toUp)("abc"), ["A", "bc"]);
		});
		it(() => {
			assertArrayIncludes(map(parserA, toUp)("bca"), [new Error(), "bca"]);
		});
	});

	describe("Many:", () => {
		it(() => {
			assertArrayIncludes(manyN(parserA)("bcd"), [[], "bcd"]);
		});
		it(() => {
			assertArrayIncludes(manyN(parserA)("aaabcd"), [["a", "a", "a"], "bcd"]);
		});
		it(() => {
			assertArrayIncludes(manyN(parserA, { min: 1, max: 2 })("aaabcd"), [["a", "a"], "abcd"]);
		});
		it(() => {
			assertArrayIncludes(manyN(parserA, { min: 1 })("bcd"), [new Error(), "bcd"]);
		});
		it("Many1", () => {
			assertArrayIncludes(many1(parserA)("aaabcd"), [["a", "a", "a"], "bcd"]);
			assertArrayIncludes(many1(parserA, 2)("aaabcd"), [["a", "a"], "abcd"]);
			assertArrayIncludes(many1(parserA)("bcd"), [new Error(), "bcd"]);
		});
	});

	describe("SucceededBy:", () => {
		it(() => {
			assertArrayIncludes(succeededBy(parserA, parserB)("abc"), ["a", "c"]);
		});
		it(() => {
			assertArrayIncludes(succeededBy(parserA, parserB)("bca"), [new Error(), "bca"]);
		});
	});

	describe("PrecededBy:", () => {
		it(() => {
			assertArrayIncludes(precededBy(parserA, parserB)("abc"), ["b", "c"]);
		});
		it(() => {
			assertArrayIncludes(precededBy(parserA, parserB)("cba"), [new Error(), "cba"]);
		});
	});

	describe("DelimitedBy:", () => {
		it(() => {
			assertArrayIncludes(delimitedBy(parserA, parserB, parserC)("abcd"), ["b", "d"]);
		});
		it(() => {
			assertArrayIncludes(delimitedBy(parserA, parserB, parserC)("cba"), [new Error(), "cba"]);
		});
	});

	describe("Optional:", () => {
		it(() => {
			assertArrayIncludes(optional(parserA)("a"), ["a", ""]);
		});
		it(() => {
			assertArrayIncludes(optional(parserA)("bc"), ["", "bc"]);
		});
		it(() => {
			assertArrayIncludes(optional(parserA)(""), ["", ""]);
		});
	});

	describe("AndNot:", () => {
		it(() => {
			assertArrayIncludes(andNot(parserA, parserB)("acd"), ["a", "cd"]);
		});
		it(() => {
			assertArrayIncludes(andNot(parserA, parserB)("abc"), [new Error(), "abc"]);
		});
		it(() => {
			assertArrayIncludes(andNot(parserA, parserB)("bca"), [new Error(), "bca"]);
		});
		it("AndNot3", () => {
			assertArrayIncludes(andNot3(parserA, parserB, parserC)("abc"), [new Error(), "abc"]);
			assertArrayIncludes(andNot3(parserA, parserB, parserC)("adbc"), ["a", "dbc"]);
			assertArrayIncludes(andNot3(parserA, parserB, parserC)("abdc"), ["a", "bdc"]);
		});
	});
	describe("Empty:", () => {
		it(() => {
			assertArrayIncludes(empty("a"), ["", "a"]);
		});
		it(() => {
			assertArrayIncludes(empty(""), ["", ""]);
		});
	});
});

describe("Level 2 parsers:", () => {
	const parserA = satisfy(char => char === "a");

	describe("SpecificChar", () => {
		it(() => {
			assertArrayIncludes(specificChar("a")("acd"), ["a", "cd"]);
		});
		it(() => {
			assertArrayIncludes(specificChar("a")("cda"), [new Error(), "cda"]);
		});
	});
	describe("SpecificChars", () => {
		it(() => {
			assertArrayIncludes(specificChars(["a", "b"])("acd"), ["a", "cd"]);
		});
		it(() => {
			assertArrayIncludes(specificChars(["a", "b"])("cda"), [new Error(), "cda"]);
		});
	});
	describe("AllButSpecificChar", () => {
		it(() => {
			assertArrayIncludes(allButSpecificChar("a")("cda"), ["c", "da"]);
		});
		it(() => {
			assertArrayIncludes(allButSpecificChar("a")("abc"), [new Error(), "abc"]);
		});
	});
	describe("AllButSpecificChars", () => {
		it(() => {
			assertArrayIncludes(allButSpecificChars(["a", "b"])("cda"), ["c", "da"]);
		});
		it(() => {
			assertArrayIncludes(allButSpecificChars(["a", "b"])("bac"), [new Error(), "bac"]);
		});
	});
	describe("SpecificCharSequence", () => {
		it(() => {
			assertArrayIncludes(specificCharSequence("abc")("abcdef"), ["abc", "def"]);
		});
		it(() => {
			assertArrayIncludes(specificCharSequence("abc")("fabcde"), [new Error(), "fabcde"]);
		});
	});
	describe("Concat", () => {
		it(() => {
			assertArrayIncludes(concat(many1(parserA))("aaabc"), ["aaa", "bc"]);
		});
		it(() => {
			assertArrayIncludes(concat(many1(parserA))("baaabc"), [new Error(), "baaabc"]);
		});
	});
});

describe("Markdown parsers:", () => {
	describe("TextChars:", () => {
		it(() => {
			assertArrayIncludes(textChars("azAZ09!@#$%&()_-+={[]}.,:;|\\?'"), ["azAZ09!@#$%&()_-+={[]}.,:;|\\?'", ""]);
		});
		it("No space.", () => {
			assertArrayIncludes(textChars("ab c"), ["ab", " c"]);
		});
		it("No tab.", () => {
			assertArrayIncludes(textChars("a	bc"), ["a", "	bc"]);
		});
		it("No *.", () => {
			assertArrayIncludes(textChars("ab*c"), ["ab", "*c"]);
		});
		it("No \n", () => {
			assertArrayIncludes(textChars("abc\n"), ["abc", "\n"]);
		});
		it(() => {
			assertArrayIncludes(textChars(" abc"), [new Error(), " abc"]);
			assertArrayIncludes(textChars("	abc"), [new Error(), "	abc"]);
			assertArrayIncludes(textChars("*abc"), [new Error(), "*abc"]);
			assertArrayIncludes(textChars("\nabc"), [new Error(), "\nabc"]);
		});
	});
	describe("TextSpace:", () => {
		it(() => {
			assertArrayIncludes(textSpace(" abc"), [" ", "abc"]);
		});
		it("space + space* + \n", () => {
			assertArrayIncludes(textSpace("  \nabc"), [new Error(), "  \nabc"]);
		});
		it("space + tab* + \n", () => {
			assertArrayIncludes(textSpace("	\nabc"), [new Error(), "	\nabc"]);
		});
		it("space + \n + \n*", () => {
			assertArrayIncludes(textSpace("\n\nabc"), [new Error(), "\n\nabc"]);
		});
	});

	describe("LiteralSpecialChars:", () => {
		assertArrayIncludes(literalSpecialChars("/\nabc"), ["\n", "abc"]);
		assertArrayIncludes(literalSpecialChars("/\tabc"), ["\t", "abc"]);
		assertArrayIncludes(literalSpecialChars("/*abc"), ["*", "abc"]);
		assertArrayIncludes(literalSpecialChars("//abc"), ["/", "abc"]);

		assertArrayIncludes(literalSpecialChars("\nabc"), [new Error(), "\nabc"]);
		assertArrayIncludes(literalSpecialChars("\tabc"), [new Error(), "\tabc"]);
	});

	// describe("LiteralAsteriscksChar:", () => {
	// 	assertArrayIncludes(literalAsteriscksChar("*abc"), ["*", "abc"]);
	// 	assertArrayIncludes(literalAsteriscksChar("* abc"), ["*", " abc"]);
	// 	assertArrayIncludes(literalAsteriscksChar("**abc"), ["**", "abc"]);
	// 	assertArrayIncludes(literalAsteriscksChar("** abc"), ["**", " abc"]);
	// 	assertArrayIncludes(literalAsteriscksChar("**abc*"), ["**", "abc*"]);
	// 	assertArrayIncludes(literalAsteriscksChar("**abc **"), ["**", "abc **"]);
	// 	assertArrayIncludes(literalAsteriscksChar("** abc**"), ["**", " abc**"]);
	// 	assertArrayIncludes(literalAsteriscksChar("*abc*"), [new Error(), "*abc*"]);
	// 	assertArrayIncludes(literalAsteriscksChar("**abc**"), [new Error(), "**abc**"]);
	// });

	describe("RawText:", () => {
		assertArrayIncludes(rawText("abc  ef /*"), [{
			type: "Text",
			result: "abc  ef *",
		}, ""]);
		assertArrayIncludes(rawText("*abc*"), [new Error(), "*abc*"]);
		assertArrayIncludes(rawText("**abc**"), [new Error(), "**abc**"]);
		assertArrayIncludes(rawText("*"), [new Error(), "*"]);

	});

	describe("ItalicText:", () => {
		assertArrayIncludes(italicText("*abc*"), [{
			type: "Italic",
			result: {
				type: "Text",
				result: "abc",
			},
		}, ""]);
		assertArrayIncludes(italicText("* abc*"), [new Error(), "* abc*"]);
		assertArrayIncludes(italicText("*abc *"), [new Error(), "*abc *"]);
		assertArrayIncludes(italicText("* abc *"), [new Error(), "* abc *"]);

	});

	describe("BoldText:", () => {
		assertArrayIncludes(boldText("**abc**"), [{
			type: "Bold",
			result: [{
				type: "Text",
				result: "abc",
			}],
		}, ""]);
		assertArrayIncludes(boldText("**a  *b*  c**"), [{
			type: "Bold",
			result: [
				{
					type: "Text",
					result: "a",
				},
				{
					type: "Italic",
					result: {
						type: "Text",
						result: "  b",
					},
				},
				{
					type: "Text",
					result: "  c",
				}
			],
		}, ""]);
		assertArrayIncludes(boldText("**ab/\t/*c**"), [{
			type: "Bold",
			result: [
				{
					type: "Text",
					result: "ab",
				},
				{
					type: "Text",
					result: "\t*c",
				}
			],
		}, ""]);
		assertArrayIncludes(boldText("** abc**"), [new Error(), "** abc**"]);
		assertArrayIncludes(boldText("**abc **"), [new Error(), "**abc **"]);
		assertArrayIncludes(boldText("** abc **"), [new Error(), "** abc **"]);

	});
	describe("Line", () => {
		assertArrayIncludes(line("This is a text line."), [{
			type: "Line",
			result: [
				{
					type: "Text",
					result: "This is a text line."
				}
			],
		}, ""]);
		assertArrayIncludes(line("Text line with markdown *line break* in the **end.**  \n"), [{
			type: "Line",
			result: [
				{
					type: "Text",
					result: "Text line with markdown "
				},
				{
					type: "Italic",
					result:
						{
							type: "Text",
							result: "line break"
						},
				},
				{
					type: "Text",
					result: " in the "
				},
				{
					type: "Bold",
					result: [
						{
							type: "Text",
							result: "end."
						}
					]
				}
			],
		}, ""]);
		assertArrayIncludes(line("This is a text line.  \nThis is another line."), [{
			type: "Line",
			result: [
				{
					type: "Text",
					result: "This is a text line."
				}
			],
		}, "This is another line."]);
	});
});
