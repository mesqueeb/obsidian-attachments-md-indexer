import { describe, expect, it } from 'vitest';
import { renderStatusContent } from '../../src/utils/renderStatusContent';
import { FileStatus } from '../../src/service/ConversionStatusTracker';

describe('renderStatusContent', () => {
    it('shows error message inline under errored file', () => {
        const files: FileStatus[] = [
            { path: 'a.pdf', status: 'error', errorMessage: 'API rate limit' },
        ];
        const html = renderStatusContent(files);
        expect(html).toContain('Error');
        expect(html).toContain('a.pdf');
        expect(html).toContain('API rate limit');
    });

    it('does not render sections with no files', () => {
        const files: FileStatus[] = [
            { path: 'a.pdf', status: 'done' },
        ];
        const html = renderStatusContent(files);
        expect(html).not.toContain('Processing');
        expect(html).not.toContain('Pending');
        expect(html).not.toContain('Error');
        expect(html).toContain('Done');
    });

    it('shows count in section heading', () => {
        const files: FileStatus[] = [
            { path: 'a.pdf', status: 'done' },
            { path: 'b.pdf', status: 'done' },
        ];
        const html = renderStatusContent(files);
        expect(html).toContain('Done (2)');
    });

    it('renders sections in order: Error, Processing, Pending, Done', () => {
        const files: FileStatus[] = [
            { path: 'a.pdf', status: 'done' },
            { path: 'b.pdf', status: 'error', errorMessage: 'fail' },
            { path: 'c.pdf', status: 'pending' },
            { path: 'd.pdf', status: 'processing' },
        ];
        const html = renderStatusContent(files);
        const errorIdx = html.indexOf('Error');
        const processingIdx = html.indexOf('Processing');
        const pendingIdx = html.indexOf('Pending');
        const doneIdx = html.indexOf('Done');
        expect(errorIdx).toBeLessThan(processingIdx);
        expect(processingIdx).toBeLessThan(pendingIdx);
        expect(pendingIdx).toBeLessThan(doneIdx);
    });

    it('splits path into folder and filename columns', () => {
        const files: FileStatus[] = [
            { path: 'Research/attachments/paper.pdf', status: 'done' },
        ];
        const html = renderStatusContent(files);
        expect(html).toContain('Research/attachments');
        expect(html).toContain('paper.pdf');
    });

    it('groups files from same folder with rowspan', () => {
        const files: FileStatus[] = [
            { path: 'folder/a.pdf', status: 'done' },
            { path: 'folder/b.pdf', status: 'done' },
            { path: 'folder/c.pdf', status: 'done' },
        ];
        const html = renderStatusContent(files);
        expect(html).toContain('rowspan="3"');
        // folder cell appears only once
        const folderCount = (html.match(/indexer-folder-sticky/g) || []).length;
        expect(folderCount).toBe(1);
    });

    it('uses separate folder cells for files in different folders', () => {
        const files: FileStatus[] = [
            { path: 'folder-a/x.pdf', status: 'done' },
            { path: 'folder-b/y.pdf', status: 'done' },
        ];
        const html = renderStatusContent(files);
        expect(html).toContain('folder-a');
        expect(html).toContain('folder-b');
        const folderCount = (html.match(/indexer-folder-sticky/g) || []).length;
        expect(folderCount).toBe(2);
    });

    it('shows spinner element when files are processing', () => {
        const files: FileStatus[] = [
            { path: 'a.pdf', status: 'processing' },
        ];
        const html = renderStatusContent(files);
        expect(html).toContain('<span class="indexer-spinner">');
    });

    it('does not show spinner element when no files are processing', () => {
        const files: FileStatus[] = [
            { path: 'a.pdf', status: 'done' },
        ];
        const html = renderStatusContent(files);
        expect(html).not.toContain('<span class="indexer-spinner">');
    });
});
