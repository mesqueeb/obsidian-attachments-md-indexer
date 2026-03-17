import {extractElements, isNode, parseCanvasContent} from './fileUtils'; // Import parseCanvasContent
import {constructBlock} from './blockUtils';
import {CARD_TEMPLATE, MEDIA_TEMPLATE, NOTE_TEMPLATE, WEBPAGE_TEMPLATE} from './constants';
import { CanvasJson } from './fileUtils'; // Import CanvasJson and CanvasNode from fileUtils

function getCards(json: CanvasJson): string[] {
	return extractElements(json, "text", "text");
}

function getNotes(json: CanvasJson): string[] {
	return extractElements(json, "file", "file")
		.filter(isNode)
		.map((notePath: string) => {
			return notePath.replace(/\.md$/, '').split('/').pop() || notePath;
		});
}

function getWebPages(json: CanvasJson): string[] {
	return extractElements(json, "link", "url")
		.sort((a, b) => a.localeCompare(b));
}

function getMediaFiles(json: CanvasJson): string[] {
	return extractElements(json, "file", "file")
		.filter((filePath: string) => !isNode(filePath));
}

function buildContentBlocks(cards: string[], notes: string[], webPages: string[], medias: string[]): string {
	const cardsBlock = constructBlock("Cards", CARD_TEMPLATE, cards, "\n\n");
	const notesBlock = constructBlock("Notes", NOTE_TEMPLATE, notes, "\n\n<br/>\n\n");
	const webPagesBlock = constructBlock("Web Pages", WEBPAGE_TEMPLATE, webPages, "\n\n<br/>\n\n");
	const mediaBlock = constructBlock("Media", MEDIA_TEMPLATE, medias, "\n\n<br/>\n\n");

	return cardsBlock + notesBlock + webPagesBlock + mediaBlock;
}

export function convertCanvasToMd(content: string): string {
	const parsedJson = parseCanvasContent(content);
	if (parsedJson === null) {
		return '';
	}

	const json = parsedJson as CanvasJson;
	const cards = getCards(json);
	const notes = getNotes(json);
	const webPages = getWebPages(json);
	const medias = getMediaFiles(json);

	return buildContentBlocks(cards, notes, webPages, medias);
}
