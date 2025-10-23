import React, { useState } from 'react';
import type { PDFChunk } from '../types';
import { formatBytes } from '../utils/formatBytes';
import { DownloadIcon, FileIcon, SpinnerIcon } from './icons';

interface ChunkListProps {
  chunks: PDFChunk[];
  originalFileName: string;
  onReset: () => void;
}

export const ChunkList: React.FC<ChunkListProps> = ({ chunks, originalFileName, onReset }) => {
  const [isZipping, setIsZipping] = useState(false);

  const handleDownload = (chunk: PDFChunk) => {
    const url = URL.createObjectURL(chunk.blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = chunk.name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleDownloadAll = async () => {
    if (isZipping) return;
    setIsZipping(true);
    try {
      const { default: JSZip } = await import('https://cdn.skypack.dev/jszip');
      const zip = new JSZip();

      chunks.forEach((chunk) => {
        zip.file(chunk.name, chunk.blob);
      });

      const zipBlob = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(zipBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${originalFileName.replace(/\.pdf$/i, '')}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Failed to create zip file", error);
      // Optional: You could add a user-facing error message here.
    } finally {
      setIsZipping(false);
    }
  };


  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-slate-700">Файлы готовы к скачиванию</h2>
      <ul className="space-y-3">
        {chunks.map((chunk, index) => (
          <li key={index} className="border border-slate-200 rounded-lg p-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <FileIcon className="h-7 w-7 text-blue-500" />
              <div>
                <p className="font-medium text-slate-700 truncate">{chunk.name}</p>
                <p className="text-sm text-slate-500">{formatBytes(chunk.size)}</p>
              </div>
            </div>
            <button
              onClick={() => handleDownload(chunk)}
              className="flex items-center gap-2 bg-slate-100 text-slate-600 font-medium py-2 px-3 rounded-md hover:bg-slate-200 transition-colors duration-200"
            >
              <DownloadIcon className="h-4 w-4" />
              Скачать
            </button>
          </li>
        ))}
      </ul>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
        <button
            onClick={handleDownloadAll}
            disabled={isZipping}
            className="w-full bg-blue-600 text-white font-semibold py-3 px-6 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-300 flex items-center justify-center gap-2 disabled:bg-blue-400 disabled:cursor-not-allowed"
        >
            {isZipping ? (
                <SpinnerIcon className="h-5 w-5 animate-spin" />
            ) : (
                <DownloadIcon className="h-5 w-5" />
            )}
            <span>{isZipping ? 'Создание архива...' : 'Скачать все'}</span>
        </button>
        <button
            onClick={onReset}
            disabled={isZipping}
            className="w-full bg-slate-600 text-white font-semibold py-3 px-6 rounded-lg hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500 transition-colors duration-300 disabled:bg-slate-400 disabled:cursor-not-allowed"
        >
            Разделить другой файл
        </button>
      </div>
    </div>
  );
};