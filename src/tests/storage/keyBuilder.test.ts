import { describe, expect, it } from 'vitest';
import {
    buildOriginalKey,
    buildPreviewKey,
} from '../../storage/media/keyBuilder';

describe('storage/media/keyBuilder', () => {
    it('buildOriginalKey: no ext -> original/<hash>', () => {
        expect(buildOriginalKey('abc')).toBe('original/abc');
        expect(buildOriginalKey('abc', '')).toBe('original/abc');
        expect(buildOriginalKey('abc', undefined)).toBe('original/abc');
    });

    it('buildOriginalKey: sanitizes ext (alnum only + lower)', () => {
        expect(buildOriginalKey('h', 'PNG')).toBe('original/h.png');
        expect(buildOriginalKey('h', '.JpG')).toBe('original/h.jpg');
        expect(buildOriginalKey('h', 'tar.gz')).toBe('original/h.targz');
        expect(buildOriginalKey('h', 'w e b p')).toBe('original/h.webp');
        expect(buildOriginalKey('h', '😈png')).toBe('original/h.png');
        expect(buildOriginalKey('h', '!!!')).toBe('original/h');
    });

    it('buildPreviewKey: default ext = webp', () => {
        expect(buildPreviewKey('abc')).toBe('preview/abc.webp');
    });

    it('buildPreviewKey: custom ext used as-is', () => {
        expect(buildPreviewKey('abc', 'png')).toBe('preview/abc.png');
    });
});
