
import { supabase } from '../lib/supabase';

export interface Project {
    id: string;
    name: string;
    created_at: string;
}

export const fetchProjects = async (): Promise<Project[]> => {
    const { data, error } = await supabase
        .from('projects')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching projects:', error);
        throw error;
    }

    return data || [];
};

export const createProject = async (name: string): Promise<Project | null> => {
    const { data, error } = await supabase
        .from('projects')
        .insert([{ name }])
        .select()
        .single();

    if (error) {
        console.error('Error creating project:', error);
        throw error;
    }

    return data;
};
