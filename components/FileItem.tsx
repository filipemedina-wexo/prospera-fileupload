import React from 'react';
import { FileUploadItem, UploadStatus } from '../types';
import { ProgressBar } from './ProgressBar';

interface FileItemProps {
  item: FileUploadItem;
  onRemove: (id: string) => void;
  onRetry: (id: string) => void;
}

export const FileItem: React.FC<FileItemProps> = ({ item, onRemove, onRetry }) => {
  const isImage = item.file.type.startsWith('image/');

  return (
    <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-100 flex items-center gap-4 transition-all hover:shadow-md">
      {/* Thumbnail or Icon */}
      <div className="w-12 h-12 flex-shrink-0 bg-slate-100 rounded-md overflow-hidden flex items-center justify-center border border-slate-200">
        {isImage ? (
          <img 
            src={URL.createObjectURL(item.file)} 
            alt="Preview" 
            className="w-full h-full object-cover opacity-80"
          />
        ) : (
          <span className="text-xs text-slate-500 font-mono">{item.file.name.split('.').pop()}</span>
        )}
      </div>

      {/* Info & Progress */}
      <div className="flex-1 min-w-0">
        <div className="flex justify-between mb-1">
          <p className="text-sm font-medium text-slate-900 truncate pr-2" title={item.file.name}>
            {item.file.name}
          </p>
          <span className="text-xs text-slate-500 flex-shrink-0">
            {(item.file.size / 1024).toFixed(1)} KB
          </span>
        </div>

        {item.status === UploadStatus.UPLOADING && (
          <div className="space-y-1">
             <ProgressBar progress={item.progress} />
             <p className="text-xs text-brand-600 text-right">{item.progress}%</p>
          </div>
        )}

        {item.status === UploadStatus.IDLE && (
          <p className="text-xs text-slate-400">Aguardando...</p>
        )}

        {item.status === UploadStatus.SUCCESS && (
          <p className="text-xs text-emerald-600 font-medium flex items-center">
            <svg className="w-3 h-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            Enviado com sucesso
          </p>
        )}

        {item.status === UploadStatus.ERROR && (
          <p className="text-xs text-red-500 font-medium flex items-center">
            <svg className="w-3 h-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
            Erro: {item.errorMessage || "Falha no envio"}
          </p>
        )}
      </div>

      {/* Actions */}
      <div className="flex-shrink-0 flex gap-2">
        {item.status === UploadStatus.ERROR && (
            <button 
                onClick={() => onRetry(item.id)}
                className="p-2 text-slate-400 hover:text-brand-600 hover:bg-slate-50 rounded-full transition-colors"
                title="Tentar novamente"
            >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
            </button>
        )}
        <button 
          onClick={() => onRemove(item.id)}
          className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
          title="Remover"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </div>
    </div>
  );
};