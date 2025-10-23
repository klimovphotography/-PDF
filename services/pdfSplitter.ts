
import { PDFDocument } from 'https://cdn.skypack.dev/pdf-lib@^1.17.1';
import type { PDFChunk } from '../types';

export const splitPdf = async (file: File, maxChunkSize: number): Promise<PDFChunk[]> => {
    const fileBuffer = await file.arrayBuffer();
    const originalPdf = await PDFDocument.load(fileBuffer);
    const totalPages = originalPdf.getPageCount();
    const chunks: PDFChunk[] = [];
    let chunkIndex = 1;

    if (totalPages === 0) {
        return [];
    }
    
    let pagesForCurrentChunk: number[] = [];

    for (let i = 0; i < totalPages; i++) {
        // Create a temporary document to test the size with the new page
        const tempPdf = await PDFDocument.create();
        const pagesToCopyToTemp = [...pagesForCurrentChunk, i];
        
        const copiedPages = await tempPdf.copyPages(originalPdf, pagesToCopyToTemp);
        copiedPages.forEach(page => tempPdf.addPage(page));
        
        const tempBytes = await tempPdf.save();
        
        // If it's too big and there are already pages in the current chunk, finalize the previous chunk
        if (tempBytes.byteLength > maxChunkSize && pagesForCurrentChunk.length > 0) {
            // Save the current chunk *without* the new page
            const finalChunkPdf = await PDFDocument.create();
            const copiedFinalPages = await finalChunkPdf.copyPages(originalPdf, pagesForCurrentChunk);
            copiedFinalPages.forEach(page => finalChunkPdf.addPage(page));
            
            const chunkBytes = await finalChunkPdf.save();
            const chunkBlob = new Blob([chunkBytes], { type: 'application/pdf' });
            chunks.push({
                name: `${file.name.replace(/\.pdf$/i, '')}-part-${chunkIndex++}.pdf`,
                blob: chunkBlob,
                size: chunkBlob.size,
            });
            
            // Start a new chunk with the current page
            pagesForCurrentChunk = [i];
        } else {
            // Otherwise, add the current page index to our list for the current chunk
            pagesForCurrentChunk.push(i);
        }
    }

    // Save the last remaining chunk
    if (pagesForCurrentChunk.length > 0) {
        const lastChunkPdf = await PDFDocument.create();
        const copiedLastPages = await lastChunkPdf.copyPages(originalPdf, pagesForCurrentChunk);
        copiedLastPages.forEach(page => lastChunkPdf.addPage(page));

        const chunkBytes = await lastChunkPdf.save();
        const chunkBlob = new Blob([chunkBytes], { type: 'application/pdf' });
        chunks.push({
            name: `${file.name.replace(/\.pdf$/i, '')}-part-${chunkIndex++}.pdf`,
            blob: chunkBlob,
            size: chunkBlob.size,
        });
    }

    return chunks;
};
