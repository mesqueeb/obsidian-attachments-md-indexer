import {describe, expect, it} from 'vitest';
import {readFileSync} from 'fs';
import * as path from 'path';
import {convertCanvasToMd} from '../src/utils/canvasToMd';

const TEST_CANVAS_PATH = path.join(__dirname, '../test-data/Test.canvas');
const TEST_CANVAS = JSON.parse(readFileSync(TEST_CANVAS_PATH, 'utf-8'));

describe('canvasToMd', () => {
	it('returns only the transcript content blocks (no template wrapper)', () => {
		const result = convertCanvasToMd(JSON.stringify(TEST_CANVAS));

		// Contains canvas content sections
		expect(result).toContain('# Cards');
		expect(result).toContain('# Notes');
		expect(result).toContain('# Web Pages');
		expect(result).toContain('# Media');

		// Does NOT contain template wrapper elements
		expect(result).not.toContain('<!--auto-generate-content-below-->');
		expect(result).not.toContain('File:');
		expect(result).not.toContain('> Please note:');
	});

	it('returns empty string for canvas with no elements', () => {
		const result = convertCanvasToMd('{}');
		expect(result).toBe('');
	});
});
