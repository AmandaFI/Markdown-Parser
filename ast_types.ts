export type Text = {
	type: "Text",
	result: string
}

export type Italic = {
	type: "Italic",
	result: Text
}

export type Bold = {
	type: "Bold",
	result: Array<Text | Italic>
}

export type Line = {
	type: "Line",
	result: Array<Text | Italic | Bold>
}

export type Paragraph = {
	type: "Paragraph",
	result: Array<Line>
}

export type Heading = {
	type: "Heading";
	hashCount: number;
	result: Text;
};

export type HtmlDocument = {
	type: "Document",
	result: Array<Heading | Paragraph>
}


export type PartType = Text | Italic | Bold | Line | Paragraph | HtmlDocument | Heading