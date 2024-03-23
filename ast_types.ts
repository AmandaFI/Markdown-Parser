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
	result: Array<Text | Italic | Bold | Link>
}

export type ListItemLine = {
	type: "ListItemLine",
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

export type UnorderedListItem = {
	type: "UnorderedListItem",
	result: Paragraph
}

export type UnorderedList = {
	type: "UnorderedList",
	result: Array<UnorderedListItem>
}

export type OrderedListItem = {
	type: "OrderedListItem",
	// result: Array<Line>
	result: Paragraph

}

export type OrderedList = {
	type: "OrderedList",
	result: Array<OrderedListItem>
}

export type BlockQuote = {
	type: "BlockQuote",
	result: Array<Heading | UnorderedList | OrderedList | Paragraph>
}

export type Link = {
	type: "Link",
	text: Text,
	url: string
}

export type SpareBreakLine = {
	type: "SpareBreakLine"
}

export type HtmlDocument = {
	type: "Document",
	result: Array<Heading | UnorderedList | OrderedList | Paragraph | BlockQuote | SpareBreakLine>
}



export type PartType = Text | Italic | Bold | Line | Paragraph | HtmlDocument | Heading | UnorderedListItem | UnorderedList | OrderedListItem | OrderedList | BlockQuote | SpareBreakLine | Link