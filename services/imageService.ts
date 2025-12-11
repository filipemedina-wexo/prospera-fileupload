
import { supabase } from '../lib/supabase';

export interface ImageRecord {
    id: string;
    project_id: string | null;
    storage_path: string;
    public_url: string;
    name: string;
    created_at: string;
    // Join fields
    projects?: {
        name: string;
    };
}

export const uploadImageToSupabase = async (file: File, projectId?: string): Promise<ImageRecord> => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
    const filePath = `${fileName}`;

    // 1. Upload to Storage
    const { error: uploadError } = await supabase.storage
        .from('project-images')
        .upload(filePath, file);

    if (uploadError) {
        throw uploadError;
    }

    // 2. Get Public URL
    const { data: { publicUrl } } = supabase.storage
        .from('project-images')
        .getPublicUrl(filePath);

    // 3. Insert into Database
    const { data, error: dbError } = await supabase
        .from('images')
        .insert([
            {
                project_id: projectId || null,
                storage_path: filePath,
                public_url: publicUrl,
                name: file.name
            }
        ])
        .select()
        .single();

    if (dbError) {
        // Cleanup storage if db fails? For now, we prefer not to delete just in case.
        throw dbError;
    }

    return data;
};

export const fetchImages = async (projectId?: string): Promise<ImageRecord[]> => {
    let query = supabase
        .from('images')
        .select('*, projects(name)')
        .order('created_at', { ascending: false });

    if (projectId) {
        query = query.eq('project_id', projectId);
    }

    const { data, error } = await query;

    if (error) {
        console.error('Error fetching images:', error);
        throw error;
    }

    return data || [];
};
