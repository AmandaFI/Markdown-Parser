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
	or4,
	andNot3,
	and3,
	any,
} from "./parser_combinators.ts";

// em um or por exemplo, é possivel ver o backtracking dos parsers. Considerando um or(parserA, parserB),
// primiero o ele tenta dar match com o parserA, caso não de ele se arrepende da decisão, retorna ao ponto
// de antes de usar o parserA e tenta com o parserB dessa vez, isso consite em backtracking.

const ASTERISKS = "*";

const LITERAL_LINE_BREAK = "\\n";
const LITERAL_TAB = "\\t";

const MARKDOWN_LINE_BREAK = "  \n";
const JUMP_LINE = "\n\n";

const literalLineBreak = specificCharSequence(LITERAL_LINE_BREAK);
const literalTab = specificCharSequence(LITERAL_TAB);
const astersisks = specificChar(ASTERISKS);

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

export const textChars = concat(many1(allButSpecificChars([SPACE, LINE_BREAK, TAB, ASTERISKS])));

const boldIndicator = concat(manyN(astersisks, { min: 2, max: 2 }));

export const textSpace = map(
	or3(
		andNot(space, and(spaceSequence, specificChar(LINE_BREAK))),
		andNot(tabSequence, specificChar(LINE_BREAK)),
		andNot(lineBreak, specificChar(LINE_BREAK))
	),
	_ => SPACE
);

export const literalSpecialChars = or(
	map(literalLineBreak, _ => LINE_BREAK),
	map(literalTab, _ => TAB)
);

export const literalAsteriscksChar = map(
	and(
		any(
			and3(boldIndicator, many1(and(textChars, optional(and(textSpace, or(textChars, literalSpecialChars))))), boldIndicator),
			// andNot(
			// 	astersisks,
			// 	or(astersisks, and(many1(and(textChars, optional(and(textSpace, or(textChars, literalSpecialChars))))), astersisks))
			// )
			and3(astersisks, many1(and(textChars, optional(and(textSpace, or(textChars, literalSpecialChars))))), astersisks)
		),
		concat(many1(astersisks))
	),
	result => ASTERISKS.repeat(result[1].length)
);

// CASO DE TER LITERAL * DENTRO DO BOLD E DO ITALIC
export const italicText = delimitedBy(
	astersisks,
	many1(and(textChars, optional(and(textSpace, or(textChars, literalSpecialChars))))),
	astersisks
);

export const boldText = delimitedBy(
	boldIndicator,
	many1(or(and(textChars, optional(and(textSpace, or(textChars, literalSpecialChars)))), italicText)),
	boldIndicator
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

// console.log(rawText("abc \\ndef\nhhh  \n"));
// console.log(line("abc \\tdef\nhhh  \n"));
// console.log(line("abc \\td**should be bold** aaf\nhhh  \n"));

// // console.log(bold("**abc**"));
// console.log(manyN(astersisks, { min: 2, max: 2 })("**abc***"));

// console.log(paragraph("This is a test 1. This is a test 2.  \nThis is a test 3.  \n"));

// console.log(boldIndicator("**"));
// console.log(boldText("**abc**"));

// console.log(rawText("abcdde* aedaklfe"));

// console.log(line("abcd **bold** efg  \n"));
// console.log(line("abcd**bold**efg  \n"));
// console.log(line("abcd** bold** efg  \n"));
// console.log(line("abcd**bold ** efg  \n"));

// console.log(literalAsteriscksChar("**bold **"));

// console.log(
// 	and3(
// 		boldIndicator,
// 		many1(and(textChars, optional(and(textSpace, or(textChars, literalSpecialChars))))),
// 		boldIndicator
// 	)("**bold jn**")
// );

// console.log(
// 	andNot3(
// 		boldIndicator,
// 		many1(and(textChars, optional(and(textSpace, or(textChars, literalSpecialChars))))),
// 		boldIndicator
// 	)("**is bold **")
// );

// console.log(italicText("*ab *c*"));
// console.log(italicText("***abc***"));

// console.log(italicText("* abc*"));
// console.log(italicText("*abc *"));

console.log(boldText("**abc**"));
console.log(boldText("***abc***"));

// console.log(boldText("** abc**"));
// console.log(boldText("**abc *"));
// console.log(boldText("**abc*"));
