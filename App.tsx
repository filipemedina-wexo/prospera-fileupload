
import React, { useState, useRef, useCallback, useEffect } from 'react';
import { FileUploadItem, UploadStatus } from './types';
import { FileItem } from './components/FileItem';
import { ProjectSelector } from './components/ProjectSelector';
import { ImageExplorer } from './components/ImageExplorer';
import { uploadImageToSupabase } from './services/imageService';

// Supabase URL for validation
const SUPABASE_CONFIGURED = import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY;

export default function App() {
  const [activeTab, setActiveTab] = useState<'upload' | 'explorer'>('upload');
  const [files, setFiles] = useState<FileUploadItem[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);

  // Refs for inputs
  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);

  const generateId = () => Math.random().toString(36).substr(2, 9);

  const handleFilesAdded = (addedFiles: FileList | null) => {
    if (!addedFiles) return;

    const newFiles: FileUploadItem[] = Array.from(addedFiles).map(file => ({
      id: generateId(),
      file,
      progress: 0,
      status: UploadStatus.IDLE
    }));

    setFiles(prev => [...prev, ...newFiles]);
  };

  const uploadFile = useCallback(async (item: FileUploadItem) => {
    if (!SUPABASE_CONFIGURED) {
      alert("Supabase não está configurado. Verifique o arquivo .env");
      return;
    }

    setFiles(prev => prev.map(f => f.id === item.id ? { ...f, status: UploadStatus.UPLOADING, progress: 0, errorMessage: undefined } : f));

    try {
      // Create a fake progress interval since Supabase fetch upload doesn't support progress events easily 
      // without XMLHttpRequest, but we are using the simpler client method.
      // Ideally we would use TUS or similar for progress, but for simplicity:
      const progressInterval = setInterval(() => {
        setFiles(prev => {
          const current = prev.find(f => f.id === item.id);
          if (current && current.status === UploadStatus.UPLOADING && current.progress < 90) {
            return prev.map(f => f.id === item.id ? { ...f, progress: f.progress + 10 } : f);
          }
          return prev;
        });
      }, 200);

      const result = await uploadImageToSupabase(item.file, selectedProjectId || undefined);

      clearInterval(progressInterval);

      setFiles(prev => prev.map(f => f.id === item.id ? {
        ...f,
        status: UploadStatus.SUCCESS,
        progress: 100,
        publicUrl: result.public_url
      } : f));

    } catch (error: any) {
      console.error(error);
      setFiles(prev => prev.map(f => f.id === item.id ? {
        ...f,
        status: UploadStatus.ERROR,
        errorMessage: error.message || 'Erro no upload'
      } : f));
    }
  }, [selectedProjectId]);

  const handleStartUpload = () => {
    // Check if user should select a project? Maybe optional.
    // But user asked to choose "to which project it refers".
    // We will allow null (no project).
    files.forEach(file => {
      if (file.status === UploadStatus.IDLE || file.status === UploadStatus.ERROR) {
        uploadFile(file);
      }
    });
  };

  const handleRemove = (id: string) => {
    setFiles(prev => prev.filter(f => f.id !== id));
  };

  const handleRetry = (id: string) => {
    const file = files.find(f => f.id === id);
    if (file) uploadFile(file);
  };

  // Drag and Drop
  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };
  const onDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };
  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (activeTab === 'upload') {
      handleFilesAdded(e.dataTransfer.files);
    }
  };

  // Derived state
  const successfulFiles = files.filter(f => f.status === UploadStatus.SUCCESS && f.publicUrl);
  const allUrls = successfulFiles.map(f => f.publicUrl).join('\n');
  const pendingCount = files.filter(f => f.status === UploadStatus.IDLE).length;
  const uploadingCount = files.filter(f => f.status === UploadStatus.UPLOADING).length;

  const copyToClipboard = () => {
    if (successfulFiles.length === 0) return;

    // Generate Markdown Table
    const header = "| Nome da Imagem | URL |\n|---|---|\n";
    const rows = successfulFiles.map(f => `| ${f.file.name} | ${f.publicUrl} |`).join('\n');
    const result = header + rows;

    navigator.clipboard.writeText(result);
    alert('Lista de URLs copiada como Markdown (Tabela)!');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">

      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-brand-600 rounded-lg flex items-center justify-center text-white">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <h1 className="font-bold text-xl text-slate-800">Prospera File Upload</h1>
          </div>

          {/* Tabs */}
          <div className="flex bg-slate-100 p-1 rounded-lg">
            <button
              onClick={() => setActiveTab('upload')}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition ${activeTab === 'upload' ? 'bg-white text-brand-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              Upload
            </button>
            <button
              onClick={() => setActiveTab('explorer')}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition ${activeTab === 'explorer' ? 'bg-white text-brand-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              Explorer
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 w-full max-w-6xl mx-auto px-4 py-8 space-y-8">

        {!SUPABASE_CONFIGURED && (
          <div className="bg-amber-50 border border-amber-200 text-amber-800 px-4 py-3 rounded-lg flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <span>Configuração do Supabase ausente. Verifique o arquivo .env</span>
          </div>
        )}

        {/* Upload View */}
        {activeTab === 'upload' && (
          <div className="space-y-6 animate-in fade-in duration-300">

            <section>
              <ProjectSelector
                selectedProjectId={selectedProjectId}
                onProjectSelect={setSelectedProjectId}
              />
            </section>

            {/* Drop Zone */}
            <section
              onDragOver={onDragOver}
              onDragLeave={onDragLeave}
              onDrop={onDrop}
              className={`
                        border-2 border-dashed rounded-xl p-10 text-center transition-all duration-200 ease-in-out cursor-pointer
                        ${isDragging ? 'border-brand-500 bg-brand-50 scale-[1.01]' : 'border-slate-300 hover:border-brand-400 hover:bg-slate-50'}
                    `}
              onClick={() => fileInputRef.current?.click()}
            >
              <div className="flex flex-col items-center justify-center space-y-4 pointer-events-none">
                <div className={`p-4 rounded-full ${isDragging ? 'bg-white text-brand-600' : 'bg-slate-100 text-slate-400'}`}>
                  <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                </div>
                <div>
                  <p className="text-lg font-medium text-slate-700">
                    Arraste imagens para upload
                  </p>
                  <p className="text-sm text-slate-500 mt-1">
                    Projeto Selecionado: {selectedProjectId ? 'Sim' : 'Nenhum'}
                  </p>
                </div>
              </div>

              <input
                type="file"
                ref={fileInputRef}
                multiple
                className="hidden"
                onChange={(e) => handleFilesAdded(e.target.files)}
              />
            </section>

            {/* Actions Bar */}
            <div className="flex flex-wrap gap-3 justify-center md:justify-start">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="px-4 py-2 bg-white border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 font-medium text-sm transition shadow-sm"
              >
                Adicionar Arquivos
              </button>
              <button
                onClick={() => folderInputRef.current?.click()}
                className="px-4 py-2 bg-white border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 font-medium text-sm transition shadow-sm"
              >
                Adicionar Pasta
              </button>

              <input
                type="file"
                ref={folderInputRef}
                className="hidden"
                // @ts-ignore
                webkitdirectory=""
                directory=""
                multiple
                onChange={(e) => handleFilesAdded(e.target.files)}
              />

              {files.length > 0 && pendingCount + uploadingCount > 0 && (
                <button
                  onClick={handleStartUpload}
                  disabled={!SUPABASE_CONFIGURED || uploadingCount > 0}
                  className={`
                                ml-auto px-6 py-2 rounded-lg font-medium text-sm transition shadow-md flex items-center gap-2
                                ${!SUPABASE_CONFIGURED ? 'bg-slate-300 text-slate-500 cursor-not-allowed' : 'bg-brand-600 text-white hover:bg-brand-700'}
                            `}
                >
                  {uploadingCount > 0 ? (
                    <>
                      <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Enviando...
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                      </svg>
                      Iniciar Upload ({pendingCount})
                    </>
                  )}
                </button>
              )}

              {files.length > 0 && pendingCount + uploadingCount === 0 && (
                <button
                  onClick={() => setFiles([])}
                  className="ml-auto px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg text-sm font-medium transition"
                >
                  Limpar Lista
                </button>
              )}
            </div>

            {/* Results Section (URLs) */}
            {successfulFiles.length > 0 && (
              <section className="bg-slate-900 rounded-xl overflow-hidden shadow-lg border border-slate-800">
                <div className="bg-slate-800 px-6 py-3 flex items-center justify-between border-b border-slate-700">
                  <h2 className="text-slate-100 font-medium text-sm flex items-center gap-2">
                    <svg className="w-4 h-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                    </svg>
                    URLs Geradas ({successfulFiles.length})
                  </h2>
                  <button
                    onClick={copyToClipboard}
                    className="text-xs bg-brand-600 hover:bg-brand-500 text-white px-3 py-1.5 rounded transition flex items-center gap-1"
                  >
                    Copiar Todas
                  </button>
                </div>
                <div className="p-0">
                  <textarea
                    readOnly
                    className="w-full h-32 bg-slate-950 text-slate-300 p-4 text-xs font-mono outline-none resize-y border-none"
                    value={allUrls}
                  />
                </div>
              </section>
            )}

            {/* File List */}
            {files.length > 0 && (
              <section className="space-y-3 pb-20">
                <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider ml-1">Arquivos</h3>
                {files.map(file => (
                  <FileItem
                    key={file.id}
                    item={file}
                    onRemove={handleRemove}
                    onRetry={handleRetry}
                  />
                ))}
              </section>
            )}
          </div>
        )}

        {/* Explorer View */}
        {activeTab === 'explorer' && (
          <div className="animate-in fade-in duration-300">
            <ImageExplorer />
          </div>
        )}

      </main>
    </div>
  );
}