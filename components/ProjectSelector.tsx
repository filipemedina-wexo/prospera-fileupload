
import React, { useState, useEffect } from 'react';
import { fetchProjects, createProject, Project } from '../services/projectService';

interface ProjectSelectorProps {
    selectedProjectId: string | null;
    onProjectSelect: (id: string | null) => void;
}

export const ProjectSelector: React.FC<ProjectSelectorProps> = ({ selectedProjectId, onProjectSelect }) => {
    const [projects, setProjects] = useState<Project[]>([]);
    const [isCreating, setIsCreating] = useState(false);
    const [newProjectName, setNewProjectName] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        loadProjects();
    }, []);

    const loadProjects = async () => {
        try {
            const data = await fetchProjects();
            setProjects(data);
        } catch (err) {
            console.error(err);
        }
    };

    const handleCreate = async () => {
        if (!newProjectName.trim()) return;
        setLoading(true);
        try {
            const newProject = await createProject(newProjectName);
            if (newProject) {
                setProjects([newProject, ...projects]);
                onProjectSelect(newProject.id);
                setIsCreating(false);
                setNewProjectName('');
            }
        } catch (err) {
            alert('Erro ao criar projeto');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <label className="block text-sm font-semibold text-slate-700 mb-2">
                Projeto Relacionado
            </label>

            {!isCreating ? (
                <div className="flex gap-2">
                    <select
                        value={selectedProjectId || ''}
                        onChange={(e) => onProjectSelect(e.target.value || null)}
                        className="flex-1 border border-slate-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition bg-white"
                    >
                        <option value="">-- Sem Projeto --</option>
                        {projects.map(p => (
                            <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                    </select>
                    <button
                        onClick={() => setIsCreating(true)}
                        className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 font-medium text-sm transition"
                    >
                        Novo
                    </button>
                </div>
            ) : (
                <div className="flex gap-2">
                    <input
                        type="text"
                        value={newProjectName}
                        onChange={(e) => setNewProjectName(e.target.value)}
                        placeholder="Nome do novo projeto..."
                        className="flex-1 border border-slate-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition"
                        autoFocus
                    />
                    <button
                        onClick={handleCreate}
                        disabled={loading}
                        className="px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 font-medium text-sm transition"
                    >
                        {loading ? '...' : 'Criar'}
                    </button>
                    <button
                        onClick={() => setIsCreating(false)}
                        className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 font-medium text-sm transition"
                    >
                        Cancelar
                    </button>
                </div>
            )}
        </div>
    );
};
