// https://yiou.me/blog/posts/how-does-markdown-parser-work
// https://marked.js.org/using_pro#lexer
// https://www.yongliangliu.com/blog/rmark/

type Heading = {
	type: "Heading";
	hashCount: number;
	text: string;
};

const EPACE = " ";
const MARKDOWN_LINE_BREAK = "  \n";
const JUMP_LINE = "\n\n";

// ---------------------------------------------------

type ParserResult<T> = [resultOrError: T | Error, rest: string];
type Parser<T> = (input: string) => ParserResult<T>;
type SingleChar = string;

const isError = <T>(result: T | Error): result is Error => result instanceof Error;

// Creates parsers
const satisfy =
	(matchFn: (char: SingleChar) => boolean): Parser<SingleChar> =>
	input =>
		input.length > 0 && matchFn(input[0]) ? [input[0], input.slice(1)] : [new Error("No match."), input];

// Recebe um parser de A, que tem como resultado positivo um valor do tipo A
// e recebe também uma função que recebe um valor do tipo A e transforma em um valor do tipo B
// Se map retorna uma funçao que recebe um input e retorna um result do tipo B, logo é uma função parser de B
const map =
	<A, B>(parserA: Parser<A>, mapFn: (value: A) => B): Parser<B> =>
	input => {
		const [result, rest] = parserA(input);

		return isError(result) ? [result, input] : [mapFn(result), rest];
	};

const and =
	<A, B>(parserA: Parser<A>, parserB: Parser<B>): Parser<[A, B]> =>
	input => {
		const [resultA, restA] = parserA(input);

		if (isError(resultA)) return [resultA, input];

		const [resultB, restB] = parserB(restA);

		return isError(resultB) ? [resultB, input] : [[resultA, resultB], restB];
	};

const and3 = <A, B, C>(parserA: Parser<A>, parserB: Parser<B>, parserC: Parser<C>) => and(and(parserA, parserB), parserC);

const or =
	<A, B>(parserA: Parser<A>, parserB: Parser<B>): Parser<A | B> =>
	input => {
		const [resultA, restA] = parserA(input);

		return isError(resultA) ? parserB(input) : [resultA, restA];
	};

const succeededBy = <A, B>(parserA: Parser<A>, parserB: Parser<B>): Parser<A> =>
	map(and(parserA, parserB), ([resultA, _resultB]) => resultA);

const precededBy = <A, B>(parserA: Parser<A>, parserB: Parser<B>): Parser<B> =>
	map(and(parserA, parserB), ([_resultA, resultB]) => resultB);

// const optional = <A>(parser: Parser<A>) =>

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

const specificChar = (char: SingleChar) => satisfy(input => input === char);
const anyChar = satisfy(_ => true);
const charSequence = concat(many1(anyChar));
const specificCharSequence = (charSequence: string) => input =>
	input.startsWith(charSequence) ? [charSequence, input.slice(charSequence.length)] : [new Error("No match"), input];

const space = specificChar(EPACE);
const lineBreak = specificCharSequence(MARKDOWN_LINE_BREAK);
const jumpLine = specificCharSequence(JUMP_LINE);
const headingHashSequence = concat(many1(specificChar("#"), 6));

const heading = map(and(succeededBy(headingHashSequence, space), charSequence), ([hashes, text]) => {
	return { type: "Heading" as const, hashCount: hashes.length, text };
});

const a = `## adsaed

dased`;
// console.log(heading("### Testando Heading"));
console.log(heading(a));

// Heading = # + ' ' + anything
