import { beforeEach, describe, expect, it } from 'vitest';
import { CanvasService } from '../../src/service/CanvasService';
import { PngConverterService } from '../../src/service/PngConverterService';
import { FileDaoImpl } from '../../src/dao/FileDaoImpl';
import { InMemoryFileAdapter } from '../dao/InMemoryFileAdapter';
import { ConversionStatusTracker } from '../../src/service/ConversionStatusTracker';
import { AttachmentParserService } from '../../src/service/AttachmentParserService';
import { createTestCanvasFile, createTestImageFile } from '../utils/testFileUtils';

const mockParser: AttachmentParserService = {
    validateApiKey: () => true,
    parseAttachmentContent: async () => 'Mock transcript',
};

describe('Integration: ConversionStatusTracker wired into converters', () => {
    let fileAdapter: InMemoryFileAdapter;
    let fileDao: FileDaoImpl;
    let tracker: ConversionStatusTracker;

    beforeEach(() => {
        fileAdapter = new InMemoryFileAdapter();
        fileDao = new FileDaoImpl(fileAdapter);
        tracker = new ConversionStatusTracker();
    });

    it('all source files are pending when run starts', async () => {
        const canvasService = new CanvasService(fileDao, { canvasPostfix: '.canvas.md', runOnStart: false, indexFolder: 'index' });
        canvasService.setStatusTracker(tracker);
        await createTestCanvasFile(fileDao, 'Test.canvas');
        await createTestCanvasFile(fileDao, 'Test-empty1.canvas');

        let pendingSnapshot: string[] = [];
        tracker.onChange(() => {
            const all = tracker.getAll();
            if (all.every(f => f.status === 'pending') && all.length === 2) {
                pendingSnapshot = all.map(f => f.path);
            }
        });

        await canvasService.convertFiles();

        expect(pendingSnapshot).toContain('Test.canvas');
        expect(pendingSnapshot).toContain('Test-empty1.canvas');
    });

    it('file that errors during conversion ends as error with message', async () => {
        const throwingParser: AttachmentParserService = {
            validateApiKey: () => true,
            parseAttachmentContent: async () => { throw new Error('Gemini rate limit'); },
        };
        const pngConverter = new PngConverterService(fileDao, 'index', throwingParser);
        pngConverter.setStatusTracker(tracker);
        await createTestImageFile(fileAdapter, 'test-image.png');

        await pngConverter.convertFiles();

        const file = tracker.getAll().find(f => f.path === 'test-image.png');
        expect(file?.status).toBe('error');
        expect(file?.errorMessage).toContain('Gemini rate limit');
    });

    it('skipped (up-to-date) file ends as done in tracker', async () => {
        const canvasService = new CanvasService(fileDao, { canvasPostfix: '.canvas.md', runOnStart: false, indexFolder: 'index' });
        canvasService.setStatusTracker(tracker);
        await createTestCanvasFile(fileDao, 'Test.canvas');

        // First run creates the index file
        await new Promise(resolve => setTimeout(resolve, 3));
        await canvasService.convertFiles();

        // Second run — source is older than index, file is skipped
        await new Promise(resolve => setTimeout(resolve, 3));
        await canvasService.convertFiles();

        const file = tracker.getAll().find(f => f.path === 'Test.canvas');
        expect(file?.status).toBe('done');
    });

    it('processed canvas file ends as done in tracker', async () => {
        const canvasService = new CanvasService(fileDao, { canvasPostfix: '.canvas.md', runOnStart: false, indexFolder: 'index' });
        canvasService.setStatusTracker(tracker);
        await createTestCanvasFile(fileDao, 'Test.canvas');

        await canvasService.convertFiles();

        const file = tracker.getAll().find(f => f.path === 'Test.canvas');
        expect(file?.status).toBe('done');
    });
});
