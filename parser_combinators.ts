type Heading = {
	type: "Heading";
	size: number;
	text: string;
};

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

const chain =
	<A, B>(parserA: Parser<A>, parserB: Parser<B>): Parser<[A, B]> =>
	input => {
		const [resultA, restA] = parserA(input);

		if (isError(resultA)) return [resultA, input];

		const [resultB, restB] = parserB(restA);

		return isError(resultB) ? [resultB, input] : [[resultA, resultB], restB];
	};

// const and =
// 	<A, B>(parserA: Parser<A>, parserB: Parser<B>): Parser<[A, B]> =>
// 	input => {
// 		const [resultA, restA] = parserA(input);

// 		if (isError(resultA)) return [resultA, input];

// 		const [resultB, restB] = parserB(input);

// 		return isError(resultB) ? [resultB, input] : [resultA, resultB];
// 	};

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

const specificChar = (char: SingleChar) => satisfy(input => input === char);
const anyChar = satisfy(_ => true);
const charSequence = many1(anyChar);

const space = specificChar(" ");
const hashSequence = many1(specificChar("#"));

const heading = input => chain(chain(hashSequence, space), charSequence)(input);

console.log(heading("## Testando Heading"));

// Heading = # + ' ' + anything
