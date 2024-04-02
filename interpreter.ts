// Allow read files
// deno run --allow-read interpreter.ts
// Allow write files
// deno run --allow-write interpreter.ts
// Allow read and write
// deno run --allow-read --allow-write interpreter.ts


import { PartType } from "./ast_types.ts";
import { markdownDocument } from "./markdownParser.ts";
// remove .ts to run on vscode integrated terminal

const text = await Deno.readTextFile("./content.txt");

const buildAst = (text: string) => {
  const ast = markdownDocument(text)[0]
  if (ast instanceof Error) throw new Error("Invalid markdown sintax. Unable to interpret.")
  return ast
}

const blockQuoteStyle = `background-color:#f9f9f9;border-left: 10px solid #ccc;margin: 1.5em 10px;padding: 1em 10px .1em;`

// background: #f9f9f9;
//   border-left: 10px solid #ccc;
//   margin: 1.5em 10px;
//   padding: 1em 10px .1em;
//   quotes: "\201C""\201D""\2018""\2019";

const parseAst = (part: PartType): string => {
  // printObject(part)
  switch (part.type) {
    case "Document":
      return `<!DOCTYPE html><html>${part.result.reduce((acc, element) => acc.concat(parseAst(element)), "")}</html>`;
    case "Heading":
      return `<h${part.hashCount.toString()}>${parseAst(part.result)}</h${part.hashCount.toString()}>`
    case "UnorderedList":
      return `<ul>${part.result.reduce((acc: string, element) => acc.concat(parseAst(element)), "")}</ul>`
    case "UnorderedListItem":
      return `<li>${part.result.result.reduce((acc: string, element) => acc.concat(parseAst(element)), "")}</li>`
    case "OrderedList":
      return `<ol>${part.result.reduce((acc: string, element) => acc.concat(parseAst(element)), "")}</ol>`
    case "OrderedListItem":
      return `<li>${part.result.result.reduce((acc: string, element) => acc.concat(parseAst(element)), "")}</li>`
    case "BlockQuote":
      return `<blockquote style="${blockQuoteStyle}">${part.result.reduce((acc: string, element) => acc.concat(parseAst(element)), "")}</blockquote>`
    case "Image":
      return `<img src=${part.source} alt=${parseAst(part.altText)}></img>`
    case "Link":
      return `<a href=${part.url}>${parseAst(part.text)}</a>`
    case "Paragraph":
      return `<p>${part.result.reduce((acc: string, el) => acc.concat(parseAst(el)), "")}</p>`
    case "Line":
      return `${part.result.reduce((acc: string, el) => acc.concat(parseAst(el)), "")}<br/>`
    case "Bold":
      return `<strong>${part.result.reduce((acc: string, el) => acc.concat(parseAst(el)), "")}</strong>`
    case "Italic":
      return `<em>${parseAst(part.result)}</em>`
    case "Text":
      return part.result
    case "SpareBreakLine":
    case "SpareSpace":
      return ""
    default: {
      // https://www.typescriptlang.org/docs/handbook/2/narrowing.html#exhaustiveness-checking
      const exhaustiveCheck: never = part
      throw exhaustiveCheck
    }
  }
}

export const log = console.log

// deno-lint-ignore no-explicit-any
export const inspect = (value: any) =>
  Deno.inspect(value, {
    depth: 999,
    colors: true,
    strAbbreviateSize: Number.MAX_SAFE_INTEGER,
  }) as unknown as string
export const printObject = (value: object) => log(inspect(value))


const ast = buildAst(text)
// console.log(ast) 
printObject(ast)


console.log("Parsing...")
const html = parseAst(ast)
await Deno.writeTextFile("./result.html", html);
console.log("Done")

