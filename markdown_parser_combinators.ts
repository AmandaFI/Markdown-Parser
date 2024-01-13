import {
	and,
	map,
	many1,
	manyN,
	specificCharSequence,
	space,
	lineBreak,
	specificChar,
	or,
	concat,
	andNot,
	or6,
	allButSpecificChars,
	SPACE,
	spaceSequence,
	TAB,
	tabSequence,
	LINE_BREAK,
	optional,
	or3,
	succeededBy,
	delimitedBy,
} from "./parser_combinators";

const ASTERISKS = "*";

const LITERAL_LINE_BREAK = "\\n";
const LITERAL_TAB = "\\t";

const MARKDOWN_LINE_BREAK = "  \n";
const JUMP_LINE = "\n\n";

const literalLineBreak = specificCharSequence(LITERAL_LINE_BREAK);
const literalTab = specificCharSequence(LITERAL_TAB);

const markdownLineBreak = and(manyN(space, { min: 2 }), lineBreak);

const jumpLine = map(many1(lineBreak), result => {
	return {
		type: "JumpLine",
	};
});

const headingHashSequence = map(many1(specificChar("#"), 6), result => {
	return {
		type: "Hash",
		quantity: result.length,
	};
});

const textChars = concat(many1(allButSpecificChars([SPACE, LINE_BREAK, TAB])));
const sentenceLineBreak = map(or(and(concat(manyN(space, { min: 2 })), lineBreak), and(tabSequence, lineBreak)), result => {
	return {
		type: "LineBreak",
	};
});

const text = map(
	concat(
		many1(
			or6(
				map(literalLineBreak, result => LINE_BREAK),
				map(literalTab, result => TAB),
				textChars,
				map(andNot(space, and(spaceSequence, specificChar(LINE_BREAK))), result => SPACE),
				map(andNot(tabSequence, specificChar(LINE_BREAK)), result => SPACE),
				map(andNot(lineBreak, specificChar(LINE_BREAK)), result => SPACE)
			)
		)
	),
	result => {
		return result;
		// return {
		// 	type: "raw",
		// 	text,
		// };
	}
);

const astersisks = specificChar(ASTERISKS);
const bold = map(delimitedBy(manyN(astersisks, { min: 2, max: 2 }), text, manyN(astersisks, { min: 2, max: 2 })), result => {
	return result;
	// return {
	// 	type: "bold",
	// 	text: result,
	// };
});

const line = map(and(or(bold, concat(many1(text))), optional(sentenceLineBreak)), ([text, _]) => {
	return {
		type: "Line" as const,
		text,
	};
});
const paragraph = map(and(many1(line), optional(many1(jumpLine))), ([lines, _]) => {
	return {
		type: "Paragraph" as const,
		lines,
	};
});

const charSequence = many1(or3(literalLineBreak, literalTab, text));

// Reveer heading
const heading = map(
	and(succeededBy(headingHashSequence, space), succeededBy(textChars, optional(or(jumpLine, lineBreak)))),
	([hashes, text]) => {
		return { type: "Heading" as const, hashCount: hashes.quantity, text };
	}
);

console.log(text("abc \\ndef\nhhh  \n"));
console.log(line("abc \\tdef\nhhh  \n"));
console.log(line("abc \\td**should be bold** aaf\nhhh  \n"));

// console.log(bold("**abc**"));
console.log(manyN(astersisks, { min: 2, max: 2 })("**abc***"));

console.log(paragraph("This is a test 1. This is a test 2.  \nThis is a test 3.  \n"));
