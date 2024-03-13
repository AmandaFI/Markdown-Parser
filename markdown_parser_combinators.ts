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
result => {
	return {
		type: "Text" as const,
		result
	}
}
)

export const italicText = map(delimitedBy(asterisk, innerItalicText, asterisk), result => {
		return {
			type: "Italic" as const,
			result,
		};
	}
);

export const innerBoldText = map(
	and(
		or(
			map(charsWithoutSpace, result => {
				return {
					type: "Text" as const,
					result
				}
			}),
			italicText
		),
		manyN(
			or(
				map(concat(many1(charsOptionallyPrecededBySpace)), result => {
					return {
						type: "Text" as const,
						result
					}
				}), 
				map(and(optional(concat(manyN(textSpace))), italicText), ([resultA, resultB]) => {
					return {
						type: "Italic" as const,
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
	result => {
		return {
			type: "Bold" as const,
			result,
		};
	}
);

export const rawText = map(concat(many1(or(charsWithoutSpace, textSpace))), result => {
	return {
		type: "Raw" as const,
		result: {
			type: "Text" as const,
			result
		},
	};
});


export const line = map(and(many1(or3(boldText, italicText, rawText)), optional(sentenceLineBreak)), ([result, _]) => {
	return {
		type: "Line" as const,
		result,
	};
});
const paragraph = map(and(many1(line), optional(many1(jumpLine))), ([lines, _]) => {
	return {
		type: "Paragraph" as const,
		lines,
	};
});

const markdownDocument = map(many1(paragraph), result => {
	return {
		type: "Document",
		result
	}
})

const charSequence = many1(or3(literalLineBreak, literalTab, rawText));

// Reveer heading
const heading = map(
	and(succeededBy(headingHashSequence, optional(space)), succeededBy(many1(and(textChars, manyN(space))), optional(or(jumpLine, lineBreak)))),
	([hashes, text]) => {
		return { type: "Heading" as const, hashCount: hashes.quantity, text };
	}
);

// -----------------------------------------------------------------------------------------

// Obs:

// Para usar caracteres especiais de forma literal deve-se colocar / antes, como mostrado nos literalSpecialChars
// para mudar de ideia teria que reativar o literalAsteriscksChar e incluir em todos os parsers de Text (bold, italic, raw)

// o paragrafo entende que é para pular de linha ois havera 2 ou mais \n, o primeiro vira no final de uma line
// e sera lido pelo parser de line, o segundo e os demais serão lidos pelo parser de paragraph

// um parágrafo é formado por várias linhas que são formadas pela combinação de textos em negrito, itálico e normal

// um documento markdown será formado por vários dos elementos markdown como parágrafos e headings

// TODO

// - Criar testes para os parsers de linha e parágrafo
// -  Criar tipos para os retornos dos maps mais importantes para remover o as const
// - Iniciar o script que le a ast/objeto construido e gera o html
// - Revisar elemento heading
// - Implementar outros elementos como listas

// -----------------------------------------------------------------------------------------


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




// console.log(boldText("**a  bdgcd d *c v b* cded d**"))
// console.log(boldText("**a**"))


// console.log(boldText("**a    b**"))

// console.log(boldText("**a*b*c**"))

// console.log(boldText("**a*b*c**"))

// console.log(boldText("**a *b* c **"))
// console.log(boldText("** a *b* c**"))

// console.log(and(charsWithoutSpace, manyN(optional(charsPrecededBySpace)))("abcd ef dcdc"))
// console.log(map(and(charsWithoutSpace, optional(concat(manyN(charsPrecededBySpace)))), ([resultA, resultB]) => resultA.concat(resultB))("abcd ef dcdc"))


// console.log(rawText("abcd  cdc /*"))
// console.log(rawText("**a**"))
// console.log(rawText("*a*"))

// console.log(line("*teste* **teste2** abcd  cdc /*  \n"))
// console.log(line("*teste* **teste2** abcd  cdc /*  fasfsae"))

// console.log(paragraph("*teste* **teste2** abcd  cdc /*  \n*teste* **teste2** abcd  cdc /*  \n\n\n*teste* **teste2** abcd  cdc /*  \n*teste* **teste2** abcd  cdc /*"))

// console.log(markdownDocument("*teste* **teste2** abcd  cdc /*  \n*teste* **teste2** abcd  cdc /*  \n\n\n*teste* **teste2** abcd  cdc /*  \n*teste* **teste2** abcd  cdc /*"))




