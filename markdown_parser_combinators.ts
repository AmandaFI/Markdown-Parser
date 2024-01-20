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
	or4,
	andNot3,
	and3,
	any,
} from "./parser_combinators.ts";

// em um or por exemplo, é possivel ver o backtracking dos parsers. Considerando um or(parserA, parserB),
// primiero o ele tenta dar match com o parserA, caso não de ele se arrepende da decisão, retorna ao ponto
// de antes de usar o parserA e tenta com o parserB dessa vez, isso consite em backtracking.

const RIGHT_BAR = "/";
const ASTERISK = "*";

const LITERAL_LINE_BREAK = "/\n";
const LITERAL_TAB = "/\t";
const LITERAL_ASTERISK = "/*";
const LITERAL_RIGHT_BAR = "//";

const MARKDOWN_LINE_BREAK = "  \n";
const JUMP_LINE = "\n\n";

const literalLineBreak = specificCharSequence(LITERAL_LINE_BREAK);
const literalTab = specificCharSequence(LITERAL_TAB);
const literalAsterisk = specificCharSequence(LITERAL_ASTERISK);
const literalRightBar = specificCharSequence(LITERAL_RIGHT_BAR);
const asterisk = specificChar(ASTERISK);

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

const sentenceLineBreak = map(
	or3(and(concat(manyN(space, { min: 2 })), lineBreak), and(tabSequence, lineBreak), manyN(lineBreak, { min: 2 })),
	result => {
		return {
			type: "LineBreak",
		};
	}
);

const boldIndicator = concat(manyN(asterisk, { min: 2, max: 2 }));

export const textChars = concat(many1(allButSpecificChars([SPACE, LINE_BREAK, TAB, ASTERISK, RIGHT_BAR])));

export const textSpace = map(
	or3(
		andNot(space, and(spaceSequence, specificChar(LINE_BREAK))),
		andNot(tabSequence, specificChar(LINE_BREAK)),
		andNot(lineBreak, specificChar(LINE_BREAK))
	),
	_ => SPACE
);

export const literalSpecialChars = or4(
	map(literalLineBreak, _ => LINE_BREAK),
	map(literalTab, _ => TAB),
	map(literalAsterisk, _ => ASTERISK),
	map(literalRightBar, _ => RIGHT_BAR)
);

export const charsWithoutSpace = or(literalSpecialChars, textChars);
export const charsPrecededBySpace = map(and(textSpace, charsWithoutSpace), ([resultA, resultB]) => resultA.concat(resultB));

// testar melhor
export const literalAsteriscksChar = map(
	and(
		any(
			// and3(boldIndicator, many1(and(textChars, optional(charsPrecededBySpace))), boldIndicator),
			// and3(asterisk, many1(and(textChars, optional(charsPrecededBySpace))), asterisk)
			and3(boldIndicator, many1(and(charsWithoutSpace, optional(charsPrecededBySpace))), boldIndicator),
			and3(asterisk, many1(and(charsWithoutSpace, optional(charsPrecededBySpace))), asterisk)
		),
		concat(many1(asterisk))
	),
	result => ASTERISK.repeat(result[1].length)
);

export const italicText = map(
	delimitedBy(
		asterisk,
		many1(map(and(charsWithoutSpace, optional(charsPrecededBySpace)), ([resultA, resultB]) => resultA.concat(resultB))),
		asterisk
	),
	result => {
		return {
			type: "Italic" as const,
			result,
		};
	}
);

export const boldText = map(
	delimitedBy(
		boldIndicator,
		many1(or(and(charsWithoutSpace, optional(and(textSpace, or3(literalSpecialChars, italicText, textChars)))), italicText)),
		boldIndicator
	),
	result => {
		return {
			type: "Bold" as const,
			result,
		};
	}
);

const rawText = map(concat(many1(or4(literalSpecialChars, literalAsteriscksChar, textChars, textSpace))), result => {
	return result;
	// return {
	// 	type: "raw",
	// 	text,
	// };
});

const line = map(and(many1(or(boldText, rawText)), sentenceLineBreak), ([text, _]) => {
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

const charSequence = many1(or3(literalLineBreak, literalTab, rawText));

// Reveer heading
const heading = map(
	and(succeededBy(headingHashSequence, space), succeededBy(textChars, optional(or(jumpLine, lineBreak)))),
	([hashes, text]) => {
		return { type: "Heading" as const, hashCount: hashes.quantity, text };
	}
);

console.log(boldText("**abc**"));

console.log(boldText("**ab/*c**"));
console.log(boldText("**ab/\t/*c**"));
console.log(boldText("**ab	/*c**"));
console.log(boldText("**ab/*c**"));

console.log(italicText("*ab/* c*"));

console.log(boldText("***abc***"));

// console.log(boldText("** abc**"));
// console.log(boldText("**abc *"));
// console.log(boldText("**abc*"));
console.log(LITERAL_ASTERISK);
console.log("*");
