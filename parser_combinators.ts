// https://yiou.me/blog/posts/how-does-markdown-parser-work
// https://marked.js.org/using_pro#lexer
// https://www.yongliangliu.com/blog/rmark/

type Heading = {
	type: "Heading";
	hashCount: number;
	text: string;
};

const SPACE = " ";
const EMPTY = "";

const LITERAL_LINE_BREAK = "\\n";
const LITERAL_TAB = "\\t";

const LINE_BREAK = "\n";
const MARKDOWN_LINE_BREAK = "  \n";
const JUMP_LINE = "\n\n";
const TAB = "\t";

// ---------------------------------------------------

type ParserResult<T> = [resultOrError: T | Error, rest: string];
type Parser<T> = (input: string) => ParserResult<T>;
type SingleChar = string;

const isError = <T>(result: T | Error): result is Error => result instanceof Error;

// Creates parsers
const satisfy =
	(matchFn: (char: SingleChar) => boolean): Parser<SingleChar> =>
	input =>
		input.length > 0 && matchFn(input[0]) ? [input[0], input.slice(1)] : [new Error("No match. (satisfy)"), input];

// Recebe um parser de A, que tem como resultado positivo um valor do tipo A
// e recebe também uma função que recebe um valor do tipo A e transforma em um valor do tipo B
// Se map retorna uma funçao que recebe um input e retorna um result do tipo B, logo é uma função parser de B
const map =
	<A, B>(parserA: Parser<A>, mapFn: (value: A) => B): Parser<B> =>
	input => {
		const [result, rest] = parserA(input);

		return isError(result) ? [result, input] : [mapFn(result), rest];
	};

const both =
	<A, B>(parserA: Parser<A>, parserB: Parser<B>): Parser<[A, B]> =>
	input => {
		const [resultA, restA] = parserA(input);

		if (isError(resultA)) return [resultA, input];

		const [resultB, restB] = parserB(input);

		return isError(resultB) ? [resultB, input] : [[resultA, resultB], restB];
	};

const and =
	<A, B>(parserA: Parser<A>, parserB: Parser<B>): Parser<[A, B]> =>
	input => {
		const [resultA, restA] = parserA(input);

		if (isError(resultA)) return [resultA, input];

		const [resultB, restB] = parserB(restA);

		return isError(resultB) ? [resultB, input] : [[resultA, resultB], restB];
	};

const and3 = <A, B, C>(parserA: Parser<A>, parserB: Parser<B>, parserC: Parser<C>): Parser<[A, B, C]> =>
	map(and(and(parserA, parserB), parserC), ([resultAB, resultC]) => [...resultAB, resultC]);

const or =
	<A, B>(parserA: Parser<A>, parserB: Parser<B>): Parser<A | B> =>
	input => {
		const [resultA, restA] = parserA(input);

		return isError(resultA) ? parserB(input) : [resultA, restA];
	};

const or3 = <A, B, C>(parserA: Parser<A>, parserB: Parser<B>, parserC: Parser<C>): Parser<A | B | C> =>
	or(or(parserA, parserB), parserC);

const or4 = <A, B, C, D>(parserA: Parser<A>, parserB: Parser<B>, parserC: Parser<C>, parserD: Parser<D>): Parser<A | B | C | D> =>
	or(or3(parserA, parserB, parserC), parserD);

const manyN =
	<A>(parser: Parser<A>, { min = 0, max = Infinity }): Parser<A[]> =>
	input => {
		if (max === 0) return [[], input];

		const [result, rest] = parser(input);

		if (isError(result)) return min > 0 ? [result, input] : [[], input];

		if (rest.length === input.length) return [[], input];

		return map(manyN(parser, { min: min - 1, max: max - 1 }), otherResults => [result, ...otherResults])(rest);
	};

const many1 = <A>(parser: Parser<A>, max = Infinity): Parser<A[]> => manyN(parser, { min: 1, max });

const concat = (parser: Parser<string[]>): Parser<string> => map(parser, result => result.join(""));

const succeededBy = <A, B>(parserA: Parser<A>, parserB: Parser<B>): Parser<A> =>
	map(and(parserA, parserB), ([resultA, _resultB]) => resultA);

const precededBy = <A, B>(parserA: Parser<A>, parserB: Parser<B>): Parser<B> =>
	map(and(parserA, parserB), ([_resultA, resultB]) => resultB);

const delimitedBy = <A, B, C>(parserA: Parser<A>, parserB: Parser<B>, parserC: Parser<C>): Parser<B> =>
	map(and3(parserA, parserB, parserC), ([_resultA, resultB, _resultC]) => resultB);

const not =
	(parser: Parser<string>): Parser<string> =>
	input => {
		const [result, rest] = parser(input);

		return isError(result) ? ["", input] : [new Error("No match. (It did but it should not.)"), input];
	};

const specificChar = <T extends string>(char: T) => satisfy(input => input === char) as Parser<T>;
const specificChars = (chars: SingleChar[]) => satisfy(input => chars.includes(input));

const allButSpecificChar = (char: SingleChar) => satisfy(input => input !== char);
const allButSpecificChars = (chars: SingleChar[]) => satisfy(input => !chars.includes(input));

const specificCharSequence =
	(charSequence: string): Parser<string> =>
	input =>
		input.startsWith(charSequence)
			? [charSequence, input.slice(charSequence.length)]
			: [new Error("No match (charSequence)"), input];

type EmptyString = "";
const empty: Parser<EmptyString> = (input: string) => [EMPTY, input];

const optional = <A>(parser: Parser<A>) => or(parser, empty);

const literalLineBreak = specificCharSequence(LITERAL_LINE_BREAK);
const literalTab = specificCharSequence(LITERAL_TAB);

// const charSequence = concat(many1(anyChar));

const space = specificChar(SPACE);
const spaceSequence = map(many1(space), result => {
	return {
		type: "Space" as const,
		quantity: result.length,
	};
});

const tab = specificChar(TAB);
const tabSequence = map(many1(tab), result => {
	return {
		type: "Tab" as const,
		quantity: result.length,
	};
});

const lineBreak = specificChar(LINE_BREAK);

const markdownLineBreak = and(manyN(space, { min: 2 }), lineBreak);
const jumpLine = manyN(lineBreak, { min: 2 });

const headingHashSequence = concat(many1(specificChar("#"), 6));

const textChars = concat(many1(allButSpecificChars([SPACE, LINE_BREAK, TAB])));
const sentenceLineBreak = or(and(manyN(space, { min: 2 }), lineBreak), and(tabSequence, lineBreak));

const text = many1(
	or4(
		textChars,
		and(spaceSequence, concat(and(allButSpecificChar(SPACE), allButSpecificChar(LINE_BREAK)))),
		and(tabSequence, allButSpecificChar(LINE_BREAK)),
		and(lineBreak, allButSpecificChar(LINE_BREAK))
	)
);

const sentence = and(many1(text), optional(sentenceLineBreak));
const paragraph = and(many1(sentence), optional(jumpLine));

const charSequence = many1(or3(literalLineBreak, literalTab, text));

const heading = map(
	and(succeededBy(headingHashSequence, space), succeededBy(charSequence, optional(or(jumpLine, lineBreak)))),
	([hashes, text]) => {
		return { type: "Heading" as const, hashCount: hashes.length, text };
	}
);

console.log(text("abc def	 \nhhh  \n"));
// console.log(sentence("abc def		\nhhh  \n"));
// console.log(paragraph("abc def		\nhhh  \n\n\n"));
