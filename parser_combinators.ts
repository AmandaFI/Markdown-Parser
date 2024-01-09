type ParserResult<T> = [resultOrError: T | Error, rest: string];
type Parser<T> = (input: string) => ParserResult<T>;

type SingleChar = string;
const isError = <T>(result: T | Error): result is Error => result instanceof Error;

// Creates parsers
const satisfy =
	(matchFn: (char: SingleChar) => boolean): Parser<SingleChar> =>
	input =>
		input.length > 0 && matchFn(input[0]) ? [input[0], input.slice(1)] : [new Error("No match."), input];

const map =
	<A, B>(parserA: Parser<A>, mapFn: (value: A) => B): Parser<B> =>
	input => {
		const [result, rest] = parserA(input);

		return isError(result) ? [result, input] : [mapFn(result), rest];
	};

const specificChar = (char: SingleChar) => satisfy(input => input === char);
const anyChar = satisfy(_ => true);
