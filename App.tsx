import React, { useState, useRef, useCallback, useEffect } from 'react';
import { FileUploadItem, UploadStatus, N8nResponse } from './types';
import { FileItem } from './components/FileItem';

export default function App() {
  const [webhookUrl, setWebhookUrl] = useState<string>(() => {
    return localStorage.getItem('n8n_webhook_url') || '';
  });
  
  const [files, setFiles] = useState<FileUploadItem[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  
  // Refs for inputs
  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);

  // Persist URL
  useEffect(() => {
    localStorage.setItem('n8n_webhook_url', webhookUrl);
  }, [webhookUrl]);

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
    if (!webhookUrl) {
      alert("Por favor, configure a URL do Webhook do n8n primeiro.");
      return;
    }

    setFiles(prev => prev.map(f => f.id === item.id ? { ...f, status: UploadStatus.UPLOADING, progress: 0, errorMessage: undefined } : f));

    const formData = new FormData();
    formData.append('file', item.file);

    const xhr = new XMLHttpRequest();

    xhr.upload.addEventListener('progress', (event) => {
      if (event.lengthComputable) {
        const percentComplete = Math.round((event.loaded / event.total) * 100);
        setFiles(prev => prev.map(f => f.id === item.id ? { ...f, progress: percentComplete } : f));
      }
    });

    xhr.addEventListener('load', () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const response: N8nResponse = JSON.parse(xhr.responseText);
          // Try to find the URL in common fields, otherwise check if response is just a string
          let publicUrl = response.publicUrl || response.url || response.link || response.data?.url;
          
          // If response is just a string starting with http
          if (!publicUrl && typeof JSON.parse(xhr.responseText) === 'string' && xhr.responseText.includes('http')) {
              publicUrl = JSON.parse(xhr.responseText);
          }

          if (publicUrl) {
            setFiles(prev => prev.map(f => f.id === item.id ? { ...f, status: UploadStatus.SUCCESS, progress: 100, publicUrl } : f));
          } else {
             // Fallback: If no explicit URL found but success, maybe show a generic success or try to dump the response
             setFiles(prev => prev.map(f => f.id === item.id ? { ...f, status: UploadStatus.SUCCESS, progress: 100, publicUrl: "URL não encontrada na resposta JSON" } : f));
          }
        } catch (e) {
          // If response isn't JSON, but status is OK, maybe the body IS the URL?
          if (xhr.responseText.startsWith('http')) {
             setFiles(prev => prev.map(f => f.id === item.id ? { ...f, status: UploadStatus.SUCCESS, progress: 100, publicUrl: xhr.responseText } : f));
          } else {
             setFiles(prev => prev.map(f => f.id === item.id ? { ...f, status: UploadStatus.ERROR, errorMessage: 'Resposta inválida do servidor' } : f));
          }
        }
      } else {
        setFiles(prev => prev.map(f => f.id === item.id ? { ...f, status: UploadStatus.ERROR, errorMessage: `Erro HTTP: ${xhr.statusText}` } : f));
      }
    });

    xhr.addEventListener('error', () => {
      setFiles(prev => prev.map(f => f.id === item.id ? { ...f, status: UploadStatus.ERROR, errorMessage: 'Erro de conexão' } : f));
    });

    xhr.open('POST', webhookUrl);
    xhr.send(formData);

  }, [webhookUrl]);

  const handleStartUpload = () => {
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
    handleFilesAdded(e.dataTransfer.files);
  };

  // Derived state
  const successfulFiles = files.filter(f => f.status === UploadStatus.SUCCESS && f.publicUrl && !f.publicUrl.includes('URL não encontrada'));
  const allUrls = successfulFiles.map(f => f.publicUrl).join('\n');
  const pendingCount = files.filter(f => f.status === UploadStatus.IDLE).length;
  const uploadingCount = files.filter(f => f.status === UploadStatus.UPLOADING).length;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(allUrls);
    alert('URLs copiadas para a área de transferência!');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
            <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-brand-600 rounded-lg flex items-center justify-center text-white">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                </div>
                <h1 className="font-bold text-xl text-slate-800">N8N Uploader</h1>
            </div>
            <div className="text-xs text-slate-400">
                v1.0.0
            </div>
        </div>
      </header>

      <main className="flex-1 w-full max-w-5xl mx-auto px-4 py-8 space-y-8">

        {/* Configuration Section */}
        <section className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <label className="block text-sm font-semibold text-slate-700 mb-2">
                URL do Webhook (N8N)
            </label>
            <div className="flex gap-2">
                <input 
                    type="url" 
                    value={webhookUrl}
                    onChange={(e) => setWebhookUrl(e.target.value)}
                    placeholder="https://seu-n8n.com/webhook/..."
                    className="flex-1 border border-slate-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition"
                />
            </div>
            <p className="text-xs text-slate-500 mt-2">
                Este webhook deve aceitar método <code>POST</code>, receber um arquivo binário no campo <code>file</code> e retornar um JSON com a propriedade <code>url</code> ou <code>publicUrl</code>.
            </p>
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
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                </div>
                <div>
                    <p className="text-lg font-medium text-slate-700">
                        Arraste imagens ou clique para selecionar
                    </p>
                    <p className="text-sm text-slate-500 mt-1">
                        Suporta PNG, JPG, GIF e outros formatos.
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
                Selecionar Arquivos
            </button>
            <button 
                onClick={() => folderInputRef.current?.click()}
                className="px-4 py-2 bg-white border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 font-medium text-sm transition shadow-sm"
            >
                Selecionar Pasta
            </button>
            
            {/* Hack to allow folder selection */}
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
                    disabled={!webhookUrl || uploadingCount > 0}
                    className={`
                        ml-auto px-6 py-2 rounded-lg font-medium text-sm transition shadow-md flex items-center gap-2
                        ${!webhookUrl ? 'bg-slate-300 text-slate-500 cursor-not-allowed' : 'bg-brand-600 text-white hover:bg-brand-700'}
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
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                        </svg>
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

        {files.length === 0 && !isDragging && (
             <div className="text-center text-slate-400 py-10">
                <p>Nenhum arquivo selecionado.</p>
             </div>
        )}

      </main>
    </div>
  );
}