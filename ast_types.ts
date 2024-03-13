export type Heading = {
	type: "Heading";
	hashCount: number;
	text: string;
};

export type Text = {
	type: "Text",
	result: string
}

export type Raw = {
	type: "Raw",
	result: Text
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
	result: Array<Raw | Italic | Bold>
}

export type Paragraph = {
	type: "Paragraph",
	result: Array<Line>
}

export type HtmlDocument = {
	type: "Document",
	result: Array<Paragraph>
}


export type PartType = Text | Raw | Italic | Bold | Line | Paragraph | HtmlDocument