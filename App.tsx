
import React, { useState, useCallback } from 'react';
import type { PDFChunk } from './types';
import { FileUploader } from './components/FileUploader';
import { ChunkList } from './components/ChunkList';
import { Spinner } from './components/Spinner';
import { FileIcon, XIcon, LayersIcon, FileTextIcon } from './components/icons';
import { splitPdfBySize, splitPdfByPage } from './services/pdfSplitter';
import { formatBytes } from './utils/formatBytes';

const MAX_CHUNK_SIZE = 10 * 1024 * 1024; // 10 MB
type SplitMode = 'size' | 'page';

export default function App(): React.ReactElement {
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [chunks, setChunks] = useState<PDFChunk[]>([]);
  const [isSplitting, setIsSplitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [splitMode, setSplitMode] = useState<SplitMode | null>(null);


  const handleFileSelect = useCallback((file: File) => {
    if (file.type !== 'application/pdf') {
        setError('Пожалуйста, выберите файл в формате PDF.');
        return;
    }
    setPdfFile(file);
    setChunks([]);
    setError(null);
    setSplitMode(null);
  }, []);

  const handleSplitPdf = async () => {
    if (!pdfFile || !splitMode) return;

    setIsSplitting(true);
    setError(null);
    setChunks([]);

    try {
      let resultingChunks: PDFChunk[] = [];
      if (splitMode === 'size') {
        resultingChunks = await splitPdfBySize(pdfFile, MAX_CHUNK_SIZE);
      } else {
        resultingChunks = await splitPdfByPage(pdfFile);
      }
      
      if (resultingChunks.length === 0) {
          setError('Не удалось обработать PDF. Возможно, файл пуст или поврежден.');
      } else {
        setChunks(resultingChunks);
      }
    } catch (e) {
      console.error(e);
      setError('Произошла ошибка при обработке файла. Убедитесь, что это действительный PDF-файл.');
    } finally {
      setIsSplitting(false);
    }
  };
  
  const resetState = () => {
    setPdfFile(null);
    setChunks([]);
    setError(null);
    setIsSplitting(false);
    setSplitMode(null);
  };

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
      <main className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl shadow-slate-200 p-8 transition-all duration-300">
        <header className="text-center mb-8">
          <h1 className="text-3xl font-bold text-slate-800">Разделитель PDF</h1>
          <p className="text-slate-500 mt-2">
            Разделите большие PDF-файлы на части по размеру или постранично.
          </p>
        </header>

        {error && (
          <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6 rounded-md" role="alert">
            <p className="font-bold">Ошибка</p>
            <p>{error}</p>
          </div>
        )}

        {!pdfFile && <FileUploader onFileSelect={handleFileSelect} />}

        {pdfFile && !isSplitting && chunks.length === 0 && (
          <div className="space-y-6">
            <div className="border border-slate-200 rounded-lg p-4 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <FileIcon className="h-8 w-8 text-blue-500" />
                <div>
                  <p className="font-medium text-slate-700 truncate">{pdfFile.name}</p>
                  <p className="text-sm text-slate-500">{formatBytes(pdfFile.size)}</p>
                </div>
              </div>
              <button onClick={resetState} className="text-slate-400 hover:text-slate-600 p-1 rounded-full">
                <XIcon className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4 pt-2">
              <h3 className="text-lg font-semibold text-slate-700 text-center">Выберите режим разделения</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <button
                  onClick={() => setSplitMode('size')}
                  className={`flex flex-col items-center justify-center text-center p-6 border-2 rounded-lg cursor-pointer transition-all duration-200 ${
                    splitMode === 'size'
                      ? 'border-blue-600 bg-blue-50 shadow-md ring-2 ring-blue-500'
                      : 'border-slate-300 bg-slate-50 hover:border-slate-400 hover:bg-slate-100'
                  }`}
                >
                  <LayersIcon className="h-10 w-10 mb-3 text-blue-600" />
                  <span className="font-semibold text-slate-800">По размеру</span>
                  <span className="text-sm text-slate-500 mt-1">Части до 10 МБ</span>
                </button>
                <button
                  onClick={() => setSplitMode('page')}
                  className={`flex flex-col items-center justify-center text-center p-6 border-2 rounded-lg cursor-pointer transition-all duration-200 ${
                    splitMode === 'page'
                      ? 'border-blue-600 bg-blue-50 shadow-md ring-2 ring-blue-500'
                      : 'border-slate-300 bg-slate-50 hover:border-slate-400 hover:bg-slate-100'
                  }`}
                >
                  <FileTextIcon className="h-10 w-10 mb-3 text-blue-600" />
                  <span className="font-semibold text-slate-800">Постранично</span>
                  <span className="text-sm text-slate-500 mt-1">Каждая страница - новый файл</span>
                </button>
              </div>
            </div>

            <button
              onClick={handleSplitPdf}
              disabled={!splitMode}
              className="w-full bg-blue-600 text-white font-semibold py-3 px-6 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-300 disabled:bg-blue-300 disabled:cursor-not-allowed"
            >
              Разделить файл
            </button>
          </div>
        )}

        {isSplitting && (
            <div className="text-center space-y-4 p-8">
                <Spinner />
                <p className="text-slate-600 font-medium">Разделяем ваш файл...</p>
                <p className="text-slate-500 text-sm">Это может занять некоторое время для больших файлов.</p>
            </div>
        )}

        {chunks.length > 0 && !isSplitting && (
            <ChunkList chunks={chunks} originalFileName={pdfFile?.name || 'file.pdf'} onReset={resetState} />
        )}
      </main>
    </div>
  );
}
