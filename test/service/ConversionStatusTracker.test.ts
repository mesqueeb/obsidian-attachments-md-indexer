import { describe, expect, it } from 'vitest';
import { ConversionStatusTracker } from '../../src/service/ConversionStatusTracker';

describe('ConversionStatusTracker', () => {
    it('initFiles clears previous state', () => {
        const tracker = new ConversionStatusTracker();
        tracker.initFiles(['old.pdf']);
        tracker.initFiles(['new.pdf']);

        const all = tracker.getAll();
        expect(all).toHaveLength(1);
        expect(all[0].path).toBe('new.pdf');
    });

    it('setStatus updates a file status', () => {
        const tracker = new ConversionStatusTracker();
        tracker.initFiles(['a.pdf']);
        tracker.setStatus('a.pdf', 'processing');

        expect(tracker.getAll().find(f => f.path === 'a.pdf')?.status).toBe('processing');
    });

    it('setStatus stores error message for error state', () => {
        const tracker = new ConversionStatusTracker();
        tracker.initFiles(['a.pdf']);
        tracker.setStatus('a.pdf', 'error', 'API rate limit exceeded');

        const file = tracker.getAll().find(f => f.path === 'a.pdf');
        expect(file?.status).toBe('error');
        expect(file?.errorMessage).toBe('API rate limit exceeded');
    });

    it('onChange fires when status changes', () => {
        const tracker = new ConversionStatusTracker();
        tracker.initFiles(['a.pdf']);

        let callCount = 0;
        tracker.onChange(() => callCount++);
        tracker.setStatus('a.pdf', 'processing');
        tracker.setStatus('a.pdf', 'done');

        expect(callCount).toBe(2);
    });

    it('unsubscribe stops further notifications', () => {
        const tracker = new ConversionStatusTracker();
        tracker.initFiles(['a.pdf']);

        let callCount = 0;
        const unsubscribe = tracker.onChange(() => callCount++);
        tracker.setStatus('a.pdf', 'processing');
        unsubscribe();
        tracker.setStatus('a.pdf', 'done');

        expect(callCount).toBe(1);
    });

    it('initFiles sets all paths to pending', () => {
        const tracker = new ConversionStatusTracker();
        tracker.initFiles(['a.pdf', 'b.png']);

        const all = tracker.getAll();
        expect(all).toHaveLength(2);
        expect(all.find(f => f.path === 'a.pdf')?.status).toBe('pending');
        expect(all.find(f => f.path === 'b.png')?.status).toBe('pending');
    });
});
