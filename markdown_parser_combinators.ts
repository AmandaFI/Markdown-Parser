import { BlockQuote, Bold, Heading, HtmlDocument, Image, Italic, Line, Link, OrderedList, OrderedListItem, Paragraph, SpareBreakLine, SpareSpace, Text, UnorderedList, UnorderedListItem } from "./ast_types.ts";
import {
	allButSpecificChars,
	and,
	and3,
	andNot,
	concat,
	delimitedBy,
	many1,
	manyN,
	map,
	not,
	optional,
	or,
	or3,
	or4,
	or5,
	or6,
	precededBy,
	specificChar,
	specificCharSequence,
	specificChars,
	succeededBy,
} from "./parser_combinators.ts";
// remove .ts to run using vscode terminal e add .ts to run on normal terminal

// em um or por exemplo, é possivel ver o backtracking dos parsers. Considerando um or(parserA, parserB),
// primiero o ele tenta dar match com o parserA, caso não de ele se arrepende da decisão, retorna ao ponto
// de antes de usar o parserA e tenta com o parserB dessa vez, isso consite em backtracking.

const ESCAPE_CHARACTER = "/"

const SPACE = " ";
const TAB = "\t";
const LINE_BREAK = "\n";
const RIGHT_BAR = "/";
const ASTERISK = "*";
const HASH = "#"
const MINUS_SIGN = "-"
const POINT = "."
const GREATER_THAN_SIGN = ">" 
const OPEN_BRACKET = "["
const CLOSE_BRACKET = "]"
const OPEN_PARENTHESIS = "("
const CLOSE_PARENTHESIS = ")"
const EXCLAMATION_POINT = "!"

const literalLineBreak = specificCharSequence(ESCAPE_CHARACTER.concat(LINE_BREAK));
const literalTab = specificCharSequence(ESCAPE_CHARACTER.concat(TAB));
const literalAsterisk = specificCharSequence(ESCAPE_CHARACTER.concat(ASTERISK));
const literalHash = specificCharSequence(ESCAPE_CHARACTER.concat(HASH))
const literalRightBar = specificCharSequence(ESCAPE_CHARACTER.concat(RIGHT_BAR));
const literalMinusSign = specificCharSequence(ESCAPE_CHARACTER.concat(MINUS_SIGN));
const literalGreaterThanSign = specificCharSequence(ESCAPE_CHARACTER.concat(GREATER_THAN_SIGN));
const literalOpenBracket = specificCharSequence(ESCAPE_CHARACTER.concat(OPEN_BRACKET))
const literalCloseBracket = specificCharSequence(ESCAPE_CHARACTER.concat(CLOSE_BRACKET))
const literalOpenParenthesis = specificCharSequence(ESCAPE_CHARACTER.concat(OPEN_PARENTHESIS))
const literalCloseParenthesis = specificCharSequence(ESCAPE_CHARACTER.concat(CLOSE_PARENTHESIS))
const literalExclamationPoint = specificCharSequence(ESCAPE_CHARACTER.concat(EXCLAMATION_POINT))

const lineBreak = specificChar(LINE_BREAK);
const space = specificChar(SPACE);
const tab = specificChar(TAB);
const asterisk = specificChar(ASTERISK);
const hash = specificChar(HASH)
const minusSign = specificChar(MINUS_SIGN)
const point = specificChar(POINT)
const greatherThanSign = specificChar(GREATER_THAN_SIGN)
const openBracket = specificChar(OPEN_BRACKET)
const closeBracket = specificChar(CLOSE_BRACKET)
const openParenthesis = specificChar(OPEN_PARENTHESIS)
const closeParenthesis = specificChar(CLOSE_PARENTHESIS)
const exclamationPoint = specificChar(EXCLAMATION_POINT)

const toTexType = (result: string): Text => ({
	type: "Text",
	result
})


export const spaceSequence = map(many1(space), result => {
	return {
		type: "Space" as const,
		quantity: result.length,
	};
});

export const tabSequence = map(many1(tab), result => {
	return {
		type: "Tab" as const,
		quantity: result.length,
	};
});

const headingHashSequence = map(many1(hash, 6), result => {
	return {
		type: "Hash" as const,
		quantity: result.length,
	};
});

const jumpLine = many1(lineBreak)

const sentenceLineBreak = or(and(concat(manyN(space, { min: 2 })), lineBreak), and(tabSequence, lineBreak))

const boldIndicator = concat(manyN(asterisk, { min: 2, max: 2 }));

export const textChars = concat(many1(allButSpecificChars([SPACE, LINE_BREAK, TAB, ASTERISK, RIGHT_BAR, OPEN_BRACKET, CLOSE_BRACKET, OPEN_PARENTHESIS, CLOSE_PARENTHESIS])));

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

export const literalIsolationChars = or4(
	map(literalOpenParenthesis, _ => OPEN_PARENTHESIS),
	map(literalCloseParenthesis, _ => CLOSE_PARENTHESIS),
	map(literalOpenBracket, _ => OPEN_BRACKET),
	map(literalCloseBracket, _ => CLOSE_BRACKET)
)

export const literalMathOperators = or3(
	map(literalMinusSign, _ => MINUS_SIGN),
	map(literalAsterisk, _ => ASTERISK),
	map(literalGreaterThanSign, _ => GREATER_THAN_SIGN),
)

export const literalPontuationSymbols = or3(
	map(literalRightBar, _ => RIGHT_BAR),
	map(literalExclamationPoint, _ => EXCLAMATION_POINT),
	map(literalHash, _ => HASH)
)

export const literalSpecialChars = or6(
	map(literalLineBreak, _ => LINE_BREAK),
	map(literalTab, _ => TAB),
	literalPontuationSymbols,
	literalMathOperators,
	literalIsolationChars,
	literalOrderedListMarker
);

export const charsWithoutSpace = or(literalSpecialChars, textChars);
export const charsPrecededBySpace = map(and(concat(many1(textSpace)), charsWithoutSpace), ([resultA, resultB]) => resultA.concat(resultB));
export const charsOptionallyPrecededBySpace = map(and(concat(manyN(textSpace)), charsWithoutSpace), ([resultA, resultB]) => resultA.concat(resultB));

export const innerItalicText = map(and(charsWithoutSpace, concat(manyN(charsPrecededBySpace))), ([resultA, resultB]) => toTexType(resultA.concat(resultB)))

export const italicText = map(delimitedBy(asterisk, innerItalicText, asterisk), (result): Italic => ({
		type: "Italic",
		result,
	})
);

export const innerBoldText = map(
	and(
		or(
			map(charsWithoutSpace, toTexType),
			italicText
		),
		manyN(
			or(
				map(concat(many1(charsOptionallyPrecededBySpace)), toTexType), 
				map(and(optional(concat(manyN(textSpace))), italicText), ([resultA, resultB]): Italic => ({
						type: "Italic",
						result: toTexType(resultA.concat(resultB.result.result))
					})
				)
			)
		)
	),
	result => result.flat()
)

export const boldText = map(delimitedBy(boldIndicator, innerBoldText, boldIndicator),
	(result): Bold => ({
		type: "Bold",
		result,
	})
);

export const rawText = map(concat(many1(or(charsWithoutSpace, textSpace))), toTexType);

const ref_text = delimitedBy(openBracket, or3(rawText, italicText, boldText), closeBracket)

// If ref contains special characters (()[]*->/) it will be necessary to use the / as literal indicator
const ref = delimitedBy(openParenthesis, concat(many1(charsWithoutSpace)), closeParenthesis)

export const link = map(and(ref_text, ref), ([text, url]): Link => {
	return {
		type: "Link",
		text,
		url
	}
})

export const image = map(and3(exclamationPoint, ref_text, ref), ([_, text, source]): Image => ({
	type: "Image",
	altText: text,
	source
}))


export const isolationChars = or4(openParenthesis, closeParenthesis, openBracket, closeBracket)
export const mathOperators = or(minusSign, greatherThanSign)
export const ponctuationChars = or(exclamationPoint, literalHash)

export const possibleLineStarters = map(not(or5(mathOperators, orderedListMarker, isolationChars, ponctuationChars, lineBreak)), toTexType)

export const line = map(and3(or(link, possibleLineStarters), manyN(or4(boldText, italicText, rawText, link)), optional(sentenceLineBreak)), ([resultA, resultB, __]): Line => ({
		type: "Line",
		result: resultA.type != "Text" ? [resultA, ...resultB] : resultB
	})
);

export const paragraph = map(and(many1(line), optional(lineBreak)), ([result, _]): Paragraph => {
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
	([hashes, text]): Heading => ({
			type: "Heading",
			hashCount: hashes.quantity,
			result: toTexType(text)
	})
);

export const charsPrecededByBreakLine = map(and(lineBreak, many1(or3(boldText, italicText, rawText))), ([_resultA, resultB]) => resultB);

export const listItem = precededBy(many1(textSpace), paragraph)

export const unorderedListItem = map(precededBy(minusSign, listItem), (result): UnorderedListItem => ({
		type: "UnorderedListItem",
		result
	})
)

export const unorderedList = map(succeededBy(many1(unorderedListItem), optional(lineBreak)), (result): UnorderedList => ({
		type: "UnorderedList",
		result
	})
)

export const orderedListItem = map(precededBy(orderedListMarker, listItem), (result): OrderedListItem => {
	return {
		type: "OrderedListItem",
		result
	}
})

export const orderedList = map(succeededBy(many1(orderedListItem), optional(lineBreak)), (result): OrderedList => ({
		type: "OrderedList",
		result
	})
)

export const list = or(unorderedList, orderedList)

export const blockQuote = map(succeededBy(precededBy(and(greatherThanSign, manyN(space)), many1(or3(heading, list, paragraph))), optional(lineBreak)), (result): BlockQuote => {
	return {
		type: "BlockQuote",
		result
	}
})

export const spareBrekLine = map(lineBreak, (_): SpareBreakLine => ({type: "SpareBreakLine" }))

export const spareSpace = map(space, (_): SpareSpace => ({type: "SpareSpace" }))

export const spareChars = or(spareBrekLine, spareSpace)


export const markdownDocument = map(many1(or6(image, heading, list, paragraph, blockQuote, spareChars)), (result): HtmlDocument => {
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

// - Talvez implementar listas dentro de listas e blockquotes dentro de blockquotes
// - Implementar outros elementos como code
// - testar melhor as listas ordenadas e não ordenadas
// - fazer testes para os parsers intermediarios (number, charsWithoutSpace, ...)

// -----------------------------------------------------------------------------------------


// console.log(listItem("\n- first item  \n mmmm  \n- second item"))
// console.log(listItem("  \n"))
// console.log(unorderedList("- this is a list item  \nwith multiple lines"))
// console.log(listItem("- this is a list item"))

// console.log(markdownDocument("- this is a list item  \n- this is another list item  \n\n\nabcd"))
// console.log(orderedListItem("13. abcdcd"))
// console.log(orderedList("1. abcdcd  \n2. desdsed  \n32. desdda  \n\n"))

// console.log(blockQuote("> this is a blockquote  \nabcd  \n## with a heading  \n- and a unordered list  \n\n\n\n"))

// ![Nuerônio Biológico](./biological_neuron.png)
console.log(image("![tests](https:////www.eafsef.com)"))




// console.log(and3(not(minusSign), map(and(many1(or3(boldText, italicText, rawText)), optional(manyN(charsPrecededByBreakLine))), ([resultA, resultB]) => [resultA, ...resultB]), lineBreak)("abcdbffef\n\n"))

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
