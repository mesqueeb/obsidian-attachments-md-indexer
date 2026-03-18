import { FileStatus, ConversionStatus } from '../service/ConversionStatusTracker';

const SECTION_ORDER: ConversionStatus[] = ['error', 'processing', 'pending', 'done'];
const SECTION_LABELS: Record<ConversionStatus, string> = {
    error: 'Error',
    processing: 'Processing',
    pending: 'Pending',
    done: 'Done',
};

function splitPath(filePath: string): { folder: string; name: string } {
    const lastSlash = filePath.lastIndexOf('/');
    if (lastSlash === -1) return { folder: '', name: filePath };
    return {
        folder: filePath.slice(0, lastSlash),
        name: filePath.slice(lastSlash + 1),
    };
}

function groupByFolder(files: FileStatus[]): { folder: string; files: FileStatus[] }[] {
    const order: string[] = [];
    const map = new Map<string, FileStatus[]>();
    for (const file of files) {
        const { folder } = splitPath(file.path);
        if (!map.has(folder)) {
            order.push(folder);
            map.set(folder, []);
        }
        map.get(folder)!.push(file);
    }
    return order.map(folder => ({ folder, files: map.get(folder)! }));
}

export function renderStatusContent(files: FileStatus[]): string {
    if (files.length === 0) {
        return '<p class="indexer-empty">No files tracked yet. Run the converter to see status.</p>';
    }

    const grouped = new Map<ConversionStatus, FileStatus[]>();
    for (const status of SECTION_ORDER) grouped.set(status, []);
    for (const file of files) grouped.get(file.status)?.push(file);

    const isProcessing = (grouped.get('processing')?.length ?? 0) > 0;

    let rows = '';
    for (const status of SECTION_ORDER) {
        const group = grouped.get(status)!;
        if (group.length === 0) continue;

        const spinner = (status === 'processing' && isProcessing)
            ? '<span class="indexer-spinner"></span>'
            : '';

        rows += `<tr class="indexer-section-header">
            <td colspan="2">${SECTION_LABELS[status]} (${group.length})${spinner}</td>
        </tr>`;

        for (const { folder, files: folderFiles } of groupByFolder(group)) {
            folderFiles.forEach((file, i) => {
                const { name } = splitPath(file.path);
                const errorMsg = file.errorMessage
                    ? `<span class="indexer-error-msg">${file.errorMessage}</span>`
                    : '';
                if (i === 0) {
                    rows += `<tr>
                        <td class="indexer-folder" rowspan="${folderFiles.length}">
                            <div class="indexer-folder-sticky">${folder}</div>
                        </td>
                        <td class="indexer-filename">${name}${errorMsg}</td>
                    </tr>`;
                } else {
                    rows += `<tr><td class="indexer-filename">${name}${errorMsg}</td></tr>`;
                }
            });
        }
    }

    return `<div class="indexer-scroll-wrapper">
        <table class="indexer-status-table"><tbody>${rows}</tbody></table>
    </div>`;
}
