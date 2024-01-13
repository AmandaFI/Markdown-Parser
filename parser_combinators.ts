// https://yiou.me/blog/posts/how-does-markdown-parser-work
// https://marked.js.org/using_pro#lexer
// https://www.yongliangliu.com/blog/rmark/

export const SPACE = " ";
const EMPTY = "";
export const TAB = "\t";
export const LINE_BREAK = "\n";

type ParserResult<T> = [resultOrError: T | Error, rest: string];
type Parser<T> = (input: string) => ParserResult<T>;
type SingleChar = string;
type EmptyString = typeof EMPTY; // outro jeito ?

const isError = <T>(result: T | Error): result is Error => result instanceof Error;
const error = (message: string) => new Error(message);

// Creates parsers
export const satisfy =
	(matchFn: (char: SingleChar) => boolean): Parser<SingleChar> =>
	input =>
		input.length > 0 && matchFn(input[0]) ? [input[0], input.slice(1)] : [error("No match. (satisfy)"), input];

// Recebe um parser de A, que tem como resultado positivo um valor do tipo A
// e recebe também uma função que recebe um valor do tipo A e transforma em um valor do tipo B
// Se map retorna uma funçao que recebe um input e retorna um result do tipo B, logo é uma função parser de B
export const map =
	<A, B>(parserA: Parser<A>, mapFn: (value: A) => B): Parser<B> =>
	input => {
		const [result, rest] = parserA(input);

		return isError(result) ? [result, input] : [mapFn(result), rest];
	};

export const and =
	<A, B>(parserA: Parser<A>, parserB: Parser<B>): Parser<[A, B]> =>
	input => {
		const [resultA, restA] = parserA(input);

		if (isError(resultA)) return [resultA, input];

		const [resultB, restB] = parserB(restA);

		return isError(resultB) ? [resultB, input] : [[resultA, resultB], restB];
	};

export const andNot =
	<A, B>(parserA: Parser<A>, parserB: Parser<B>): Parser<A> =>
	input => {
		const [resultA, restA] = parserA(input);

		if (isError(resultA)) return [resultA, input];

		const [resultB, restB] = parserB(restA);

		return isError(resultB) ? [resultA, restA] : [error("No match. (andNot)"), input];
	};

// export const andNot3 = <A, B, C>(parserA: Parser<A>, parserB: Parser<B>, parserC: Parser<C>): Parser<A> =>
// 	andNot(andNot(parserA, parserB), parserC);

export const andNot3 =
	<A, B, C>(parserA: Parser<A>, parserB: Parser<B>, parserC: Parser<C>): Parser<A> =>
	input => {
		const [resultA, restA] = parserA(input);

		if (isError(resultA)) return [resultA, input];

		const [resultB, restB] = parserB(restA);

		if (isError(resultB)) return [resultB, input];

		const [resultC, restC] = parserC(restB);

		return isError(resultC) ? [resultA, restA] : [error("No match. (andNot)"), input];
	};

export const and3 = <A, B, C>(parserA: Parser<A>, parserB: Parser<B>, parserC: Parser<C>): Parser<[A, B, C]> =>
	map(and(and(parserA, parserB), parserC), ([resultAB, resultC]) => [...resultAB, resultC]);

export const or =
	<A, B>(parserA: Parser<A>, parserB: Parser<B>): Parser<A | B> =>
	input => {
		const [resultA, restA] = parserA(input);

		return isError(resultA) ? parserB(input) : [resultA, restA];
	};

export const or3 = <A, B, C>(parserA: Parser<A>, parserB: Parser<B>, parserC: Parser<C>): Parser<A | B | C> =>
	or(or(parserA, parserB), parserC);

export const or4 = <A, B, C, D>(
	parserA: Parser<A>,
	parserB: Parser<B>,
	parserC: Parser<C>,
	parserD: Parser<D>
): Parser<A | B | C | D> => or(or3(parserA, parserB, parserC), parserD);

export const or5 = <A, B, C, D, E>(
	parserA: Parser<A>,
	parserB: Parser<B>,
	parserC: Parser<C>,
	parserD: Parser<D>,
	parserE: Parser<E>
): Parser<A | B | C | D | E> => or(or4(parserA, parserB, parserC, parserD), parserE);

export const or6 = <A, B, C, D, E, F>(
	parserA: Parser<A>,
	parserB: Parser<B>,
	parserC: Parser<C>,
	parserD: Parser<D>,
	parserE: Parser<E>,
	parserF: Parser<F>
): Parser<A | B | C | D | E | F> => or(or5(parserA, parserB, parserC, parserD, parserE), parserF);

export const manyN =
	<A>(parser: Parser<A>, { min = 0, max = Infinity } = {}): Parser<A[]> =>
	input => {
		if (max === 0) return [[], input];

		const [result, rest] = parser(input);

		if (isError(result)) return min > 0 ? [result, input] : [[], input];

		if (rest.length === input.length) return [[], input];

		return map(manyN(parser, { min: min - 1, max: max - 1 }), otherResults => [result, ...otherResults])(rest);
	};

export const many1 = <A>(parser: Parser<A>, max = Infinity): Parser<A[]> => manyN(parser, { min: 1, max });

export const succeededBy = <A, B>(parserA: Parser<A>, parserB: Parser<B>): Parser<A> =>
	map(and(parserA, parserB), ([resultA, _resultB]) => resultA);

export const precededBy = <A, B>(parserA: Parser<A>, parserB: Parser<B>): Parser<B> =>
	map(and(parserA, parserB), ([_resultA, resultB]) => resultB);

export const delimitedBy = <A, B, C>(parserA: Parser<A>, parserB: Parser<B>, parserC: Parser<C>): Parser<B> =>
	map(and3(parserA, parserB, parserC), ([_resultA, resultB, _resultC]) => resultB);

export const concat = (parser: Parser<string[]>): Parser<string> => map(parser, result => result.join(""));

const not =
	(parser: Parser<string>): Parser<string> =>
	input => {
		const [result, rest] = parser(input);

		return isError(result) ? ["", input] : [error("No match. (It did but it should not.)"), input];
	};

export const optional = <A>(parser: Parser<A>) => or(parser, empty);

export const specificChar = <T extends string>(char: T) => satisfy(input => input === char) as Parser<T>;
export const specificChars = (chars: SingleChar[]) => satisfy(input => chars.includes(input));

export const allButSpecificChar = (char: SingleChar) => satisfy(input => input !== char);
export const allButSpecificChars = (chars: SingleChar[]) => satisfy(input => !chars.includes(input));

export const specificCharSequence =
	(charSequence: string): Parser<string> =>
	input =>
		input.startsWith(charSequence) ? [charSequence, input.slice(charSequence.length)] : [error("No match (charSequence)"), input];

export const empty: Parser<EmptyString> = (input: string) => [EMPTY, input];

// ------------------- not yet tested ----------------
export const lineBreak = specificChar(LINE_BREAK);
export const space = specificChar(SPACE);
export const tab = specificChar(TAB);

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
