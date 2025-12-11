
import React, { useState, useEffect } from 'react';
import { fetchImages, ImageRecord } from '../services/imageService';
import { fetchProjects, Project } from '../services/projectService';

export const ImageExplorer: React.FC = () => {
    const [images, setImages] = useState<ImageRecord[]>([]);
    const [projects, setProjects] = useState<Project[]>([]);
    const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        loadProjects();
    }, []);

    useEffect(() => {
        loadImages();
    }, [selectedProjectId]);

    const loadProjects = async () => {
        const data = await fetchProjects();
        setProjects(data);
    };

    const loadImages = async () => {
        setLoading(true);
        try {
            const data = await fetchImages(selectedProjectId || undefined);
            setImages(data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        alert('URL copiada!');
    };

    return (
        <div className="space-y-6">
            {/* Filters */}
            <div className="flex items-center gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                <span className="text-sm font-semibold text-slate-700">Filtrar por Projeto:</span>
                <select
                    value={selectedProjectId || ''}
                    onChange={(e) => setSelectedProjectId(e.target.value || null)}
                    className="border border-slate-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition bg-white"
                >
                    <option value="">Todas as Imagens</option>
                    {projects.map(p => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                </select>
                <button
                    onClick={() => loadImages()}
                    className="ml-auto text-sm text-brand-600 hover:text-brand-700 font-medium"
                >
                    Atualizar
                </button>
            </div>

            {/* Grid */}
            {loading ? (
                <div className="text-center py-20 text-slate-400">Carregando imagens...</div>
            ) : images.length === 0 ? (
                <div className="text-center py-20 text-slate-400">Nenhuma imagem encontrada.</div>
            ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {images.map(img => (
                        <div key={img.id} className="group relative bg-white rounded-lg border border-slate-200 overflow-hidden hover:shadow-md transition">
                            <div className="aspect-square bg-slate-100 relative overflow-hidden">
                                <img
                                    src={img.public_url}
                                    alt={img.name}
                                    className="w-full h-full object-cover transition duration-300 group-hover:scale-105"
                                />
                                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-2">
                                    <button
                                        onClick={() => window.open(img.public_url, '_blank')}
                                        className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-full backdrop-blur-sm transition"
                                        title="Abrir"
                                    >
                                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                        </svg>
                                    </button>
                                    <button
                                        onClick={() => copyToClipboard(img.public_url)}
                                        className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-full backdrop-blur-sm transition"
                                        title="Copiar Link"
                                    >
                                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                                        </svg>
                                    </button>
                                </div>
                            </div>
                            <div className="p-3">
                                <p className="font-medium text-slate-800 text-sm truncate" title={img.name}>{img.name}</p>
                                <div className="flex justify-between items-center mt-1">
                                    <p className="text-xs text-slate-500 truncate">
                                        {img.projects?.name || 'Sem projeto'}
                                    </p>
                                    <span className="text-[10px] text-slate-400">
                                        {new Date(img.created_at).toLocaleDateString()}
                                    </span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};
