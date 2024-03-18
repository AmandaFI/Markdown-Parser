// Allow read files
// deno run --allow-read interpreter.ts
// Allow write files
// deno run --allow-write interpreter.ts
// Allow read and write
// deno run --allow-read --allow-write interpreter.ts

import { PartType } from "./ast_types.ts";
import { markdownDocument } from "./markdown_parser_combinators.ts";
// remove .ts to run on vscode integrated terminal

const text = await Deno.readTextFile("./content.txt");

const buildAst = (text: string) => {
  const ast = markdownDocument(text)[0]
  if (ast instanceof Error) throw new Error("Invalid markdown sintax. Unable to interpret.")
  return ast
}

const parseAst = (part: PartType): string => {
  switch (part.type) {
    case "Document":
      return part.result.reduce((acc, element) => acc.concat(parseAst(element)), "");
    case "Heading":
      return `<h${part.hashCount.toString()}>${parseAst(part.result)}</h${part.hashCount.toString()}>`
    case "UnorderedList":
      return `<ul>${part.result.reduce((acc: string, element) => acc.concat(parseAst(element)), "")}</ul>`
    case "UnorderedListItem":
      // return `<li>${part.result.reduce((acc: string, element) => acc.concat(parseAst(element)), "")}</li>`
      return `<li>${part.result.result.reduce((acc: string, element) => acc.concat(parseAst(element)), "")}</li>`

    case "OrderedList":
      return `<ol>${part.result.reduce((acc: string, element) => acc.concat(parseAst(element)), "")}</ol>`
    case "OrderedListItem":
      return `<li>${part.result.result.reduce((acc: string, element) => acc.concat(parseAst(element)), "")}</li>`
      // return `<li>${part.result.reduce((acc: string, element) => acc.concat(parseAst(element)), "")}</li>`
    case "BlockQuote":
      return `<blockquote>${part.result.reduce((acc: string, element) => acc.concat(parseAst(element)), "")}</blockquote>`
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
      return ""
  }
}

const ast = buildAst(text)
// console.log(ast)

console.log("Parsing...")
const html = parseAst(ast)
await Deno.writeTextFile("./result.html", html);
console.log("Done")
console.log(ast)

