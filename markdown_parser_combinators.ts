import { Bold, Heading, HtmlDocument, Italic, Line, OrderedList, OrderedListItem, Paragraph, Text, UnorderedList, UnorderedListItem } from "./ast_types.ts";
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
	precededBy,
	or5,
	allButSpecificChar,
	not,
	specificChars,
	or6,
} from "./parser_combinators.ts";
// remove .ts to run using vscode terminal e add .ts to run on normal terminal



// em um or por exemplo, é possivel ver o backtracking dos parsers. Considerando um or(parserA, parserB),
// primiero o ele tenta dar match com o parserA, caso não de ele se arrepende da decisão, retorna ao ponto
// de antes de usar o parserA e tenta com o parserB dessa vez, isso consite em backtracking.

const RIGHT_BAR = "/";
const ASTERISK = "*";

const LITERAL_LINE_BREAK = "/\n";
const LITERAL_TAB = "/\t";
const LITERAL_ASTERISK = "/*";
const LITERAL_RIGHT_BAR = "//";
const LITERAL_MINUS_SIGN = "/-"
const HASH = "#"
const MINUS_SIGN = "-"
const POINT = "."

const MARKDOWN_LINE_BREAK = "  \n";
const JUMP_LINE = "\n\n";

const literalLineBreak = specificCharSequence(LITERAL_LINE_BREAK);
const literalTab = specificCharSequence(LITERAL_TAB);
const literalAsterisk = specificCharSequence(LITERAL_ASTERISK);
const literalRightBar = specificCharSequence(LITERAL_RIGHT_BAR);
const literalMinusSign = specificCharSequence(LITERAL_MINUS_SIGN);

const asterisk = specificChar(ASTERISK);
const hash = specificChar(HASH)
const minusSign = specificChar(MINUS_SIGN)
const point = specificChar(POINT)

const normalLineBreak = specificChar(LINE_BREAK)

const markdownLineBreak = and(manyN(space, { min: 2 }), lineBreak);

const jumpLine = map(many1(lineBreak), result => {
	return {
		type: "JumpLine",
	};
});

const headingHashSequence = map(many1(hash, 6), result => {
	return {
		type: "Hash",
		quantity: result.length,
	};
});

const sentenceLineBreak = map(
	or(and(concat(manyN(space, { min: 2 })), lineBreak), and(tabSequence, lineBreak)),
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

export const normalSpace = specificChar(SPACE)


export const numbers = specificChars(["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"])

export const orderedListMarker = map(and(concat(many1(numbers)), point), result => result.join())

const literalOrderedListMarker = precededBy(specificChar(RIGHT_BAR), orderedListMarker)

export const literalSpecialChars = or6(
	map(literalLineBreak, _ => LINE_BREAK),
	map(literalTab, _ => TAB),
	map(literalAsterisk, _ => ASTERISK),
	map(literalRightBar, _ => RIGHT_BAR),
	map(literalMinusSign, _ => MINUS_SIGN),
	map(literalOrderedListMarker, result => result)
);

export const charsWithoutSpace = or(literalSpecialChars, textChars);
export const charsPrecededBySpace = map(and(concat(many1(textSpace)), charsWithoutSpace), ([resultA, resultB]) => resultA.concat(resultB));
export const charsOptionallyPrecededBySpace = map(and(concat(manyN(textSpace)), charsWithoutSpace), ([resultA, resultB]) => resultA.concat(resultB));




// não mais necessário
// export const literalAsteriscksChar = map(
// 	and(
// 		any(
// 			// and3(boldIndicator, many1(and(textChars, optional(charsPrecededBySpace))), boldIndicator),
// 			// and3(asterisk, many1(and(textChars, optional(charsPrecededBySpace))), asterisk)
// 			and3(boldIndicator, many1(and(charsWithoutSpace, optional(charsPrecededBySpace))), boldIndicator),
// 			and3(asterisk, many1(and(charsWithoutSpace, optional(charsPrecededBySpace))), asterisk)
// 		),
// 		concat(many1(asterisk))
// 	),
// 	result => ASTERISK.repeat(result[1].length)
// );

export const innerItalicText = map(map(and(charsWithoutSpace, concat(manyN(charsPrecededBySpace))), ([resultA, resultB]) => resultA.concat(resultB)),
(result): Text => {
	return {
		type: "Text",
		result
	}
}
)

export const italicText = map(delimitedBy(asterisk, innerItalicText, asterisk), (result): Italic => {
		return {
			type: "Italic",
			result,
		};
	}
);

export const innerBoldText = map(
	and(
		or(
			map(charsWithoutSpace, (result): Text => {
				return {
					type: "Text",
					result
				}
			}),
			italicText
		),
		manyN(
			or(
				map(concat(many1(charsOptionallyPrecededBySpace)), (result): Text => {
					return {
						type: "Text",
						result
					}
				}), 
				map(and(optional(concat(manyN(textSpace))), italicText), ([resultA, resultB]): Italic => {
					return {
						type: "Italic",
						result: {
							type: "Text",
							result: resultA.concat(resultB.result.result)
						}
					}
				})
			)
		)
	),
	result => result.flat()
)

export const boldText = map(delimitedBy(boldIndicator, innerBoldText, boldIndicator),
	(result): Bold => {
		return {
			type: "Bold",
			result,
		};
	}
);

export const rawText = map(concat(many1(or(charsWithoutSpace, textSpace))), (result): Text => {
	return {
		type: "Text",
		result
	};
});


export const line = map(and3(not(or3(minusSign, orderedListMarker, lineBreak)), many1(or3(boldText, italicText, rawText)), optional(sentenceLineBreak)), ([_, result, __]): Line => {
	return {
		type: "Line",
		result
	};
});

export const paragraph = map(and(many1(line), optional(many1(jumpLine))), ([result, _]): Paragraph => {
// export const paragraph = map(precededBy(optional(many1(jumpLine)), and(many1(line), optional(jumpLine))), ([result, _]): Paragraph => {

	return {
		type: "Paragraph",
		result,
	};
});

export const heading = map(
	and(
		succeededBy(
			andNot(headingHashSequence, many1(hash)), 
			many1(space)
		), 
		succeededBy(
			concat(many1(
				map(and(
					textChars,
					concat(manyN(space))
				), ([resultA, resultB]) => resultA.concat(resultB))
			)),
			optional(
				or(jumpLine, lineBreak)
			)
		)
	),
	([hashes, text]): Heading => {
		return {
			type: "Heading",
			hashCount: hashes.quantity,
			result: {
				type: "Text",
				result: text
			}
		}
	}
);

export const charsPrecededByBreakLine = map(and(lineBreak, many1(or3(boldText, italicText, rawText))), ([resultA, resultB]) => resultB);

export const listItemLine = and(many1(or3(boldText, italicText, rawText)), manyN(charsPrecededByBreakLine))

export const unorderedListItem = map(precededBy(minusSign, precededBy(many1(textSpace), many1(line))), (result): UnorderedListItem => {
	return {
		type: "UnorderedListItem",
		result
	}
})

export const unorderedList = map(succeededBy(many1(unorderedListItem), many1(lineBreak)), (result): UnorderedList => {
	return {
		type: "UnorderedList",
		result
	}
})

export const orderedListItem = map(precededBy(and(orderedListMarker, many1(textSpace)), many1(line)), (result): OrderedListItem => {
	return {
		type: "OrderedListItem",
		result
	}
})

export const orderedList = map(succeededBy(many1(orderedListItem), many1(lineBreak)), (result): OrderedList => {
	return {
		type: "OrderedList",
		result
	}
})

export const markdownDocument = map(many1(or4(heading, unorderedList, orderedList, paragraph)), (result): HtmlDocument => {
	return {
		type: "Document",
		result
	}
})


// -----------------------------------------------------------------------------------------

// Obs:

// Para usar caracteres especiais de forma literal deve-se colocar / antes, como mostrado nos literalSpecialChars
// para mudar de ideia teria que reativar o literalAsteriscksChar e incluir em todos os parsers de Text (bold, italic, raw)

// o paragrafo entende que é para pular de linha os havera 2 ou mais \n, o primeiro vira no final de uma line
// e sera lido pelo parser de line, o segundo e os demais serão lidos pelo parser de paragraph

// um parágrafo é formado por várias linhas que são formadas pela combinação de textos em negrito, itálico e normal

// um documento markdown será formado por vários dos elementos markdown como parágrafos e headings

// TODO

// - Criar testes para os parsers de parágrafo
// - Implementar outros elementos como links
// - testar melhor as listas ordenadas e não ordenadas
// - criar teste para unordered e ordered list and items
// - fazer testes para os parsers intermediarios (number, charsWithoutSpace, ...)

// -----------------------------------------------------------------------------------------


// console.log(listItem("\n- first item  \n mmmm  \n- second item"))
// console.log(listItem("  \n"))
// console.log(unorderedList("- this is a list item  \nwith multiple lines"))
// console.log(listItem("- this is a list item"))

// console.log(markdownDocument("- this is a list item  \n- this is another list item  \n\n\nabcd"))
console.log(orderedListItem("13. abcdcd"))
console.log(orderedList("1. abcdcd  \n2. desdsed  \n32. desdda  \n\n"))


// console.log(and3(not(minusSign), map(and(many1(or3(boldText, italicText, rawText)), optional(manyN(charsPrecededByBreakLine))), ([resultA, resultB]) => [resultA, ...resultB]), lineBreak)("abcdbffef\n\n"))
// console.log(listItemLine("\n"))
// console.log(listItemLine("ab c \nabv"))

// console.log(listItemLine("**abc**"))
// console.log(listItemLine("*abc*"))


// console.log(list("- this is a list item  - this is another list item"))




// console.log(list("- item 1\n- item 2")[0][0][1].result)

// console.log(boldText("**ab	/*c**")[0]);
// console.log(boldText("**ab/*c**"));

// console.log(italicText("*ab/* c*"));

// console.log(boldText("***abc***")[0]);

// // console.log(boldText("** abc**"));
// // console.log(boldText("**abc *"));
// // console.log(boldText("**abc*"));
// console.log(LITERAL_ASTERISK);
// console.log("*");
// console.log(italicText("*acd cd    d hh*")) 
// console.log(italicText("*acd*"))


// console.log(innerBoldText2("abc"))
// console.log(innerBoldText2("a    b c"))
// console.log(innerBoldText2("a *b*c"))
// console.log(innerBoldText2("a *b* c"))

// console.log(map(and(allButSpecificChar(MINUS_SIGN), and(many1(or3(boldText, italicText, rawText)), optional(sentenceLineBreak))), ([resultA, resultB]) => resultB[0].unshift({
// 	type: "Text",
// 	result: resultA
// }))("abcd efe ded"))
// console.log(map(and(allButSpecificChar(MINUS_SIGN), and(many1(or3(boldText, italicText, rawText)), optional(sentenceLineBreak))), ([resultA, resultB]) => resultA)("abcd efe ded"))
// console.log(line("abcd ef-e ded"))

// console.log(allButSpecificChar(MINUS_SIGN)("abc"))


// console.log(boldText("**a  bdgcd d *c v b* cded d**"))
// console.log(boldText("**a**"))


// console.log(boldText("**a    b**"))

// console.log(boldText("**a*b*c**"))

// console.log(boldText("**a*b*c**"))

// console.log(boldText("**a *b* c **"))
// console.log(boldText("** a *b* c**"))

// console.log(line("*teste* **teste2** abcd  cdc /*  \n"))
// console.log(line("*teste* **teste2** abcd  cdc /*  fasfsae"))

// console.log(paragraph("*teste* **teste2** abcd  cdc /*  \n*teste* **teste2** abcd  cdc /*  \n\n\n*teste* **teste2** abcd  cdc /*  \n*teste* **teste2** abcd  cdc /*"))

// console.log(markdownDocument("*This* **is** the /*  \n*first* **paragraph** abcd  cdc /*  \n\n\n*This* **is** the  second /*  \n*paragraph* **teste2** abcd  cdc /*"))



// console.log(heading("titulo um"))
// console.log(heading("### titulo um"))
// console.log(heading("######titulo um"))
// console.log(heading("### titulo um\nfasefas"))
