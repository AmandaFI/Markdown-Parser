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

const buildAst = (text: string) =>  markdownDocument(text)[0]

const parseAst = (part: PartType): string => {
  switch (part.type) {
    case "Document":
      return part.result.reduce((acc, element) => acc.concat(parseAst(element)), "");
    case "Paragraph":
      return typeof part.result === "string" ? part.result : `<p>${part.result.reduce((acc: string, el) => acc.concat(parseAst(el)), "")}</p>`
    case "Line":
      return typeof part.result === "string" ? part.result : `${part.result.reduce((acc: string, el) => acc.concat(parseAst(el)), "")}<br/>`
    case "Bold":
      return `<b>${part.result.reduce((acc: string, el) => acc.concat(parseAst(el)), "")}</b>`
    case "Italic":
      return `<i>${parseAst(part.result)}</i>`
    case "Raw":
      return part.result.result
    case "Text":
      return part.result
  }
}

const ast = buildAst(text)
// console.log(ast)

if (ast instanceof Error) console.log("Error")
else {
  console.log("Parsing...")
  const html = parseAst(ast)
  await Deno.writeTextFile("./result.html", html);
  console.log("Done")
}

