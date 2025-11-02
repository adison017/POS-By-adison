// Supabase Storage Service for handling image uploads
import { supabase } from '../supabaseClient';

// Upload to Supabase Storage
export async function uploadToSupabaseStorage(file, folder = 'menu') {
  try {
    // Create a unique filename
    const fileExt = file.name.split('.').pop();
    const fileName = `${folder}/${Date.now()}_${Math.random().toString(36).substr(2, 9)}.${fileExt}`;
    
    // Upload the file to Supabase Storage
    const { data, error } = await supabase
      .storage
      .from('POS')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (error) {
      console.error('Supabase Storage upload failed:', error);
      
      // Handle specific error cases
      if (error.message.includes('row-level security')) {
        throw new Error('Storage upload failed due to permissions. Please check your Supabase Storage bucket policies.');
      }
      
      throw error;
    }

    // Get the public URL for the uploaded file
    const { data: { publicUrl } } = supabase
      .storage
      .from('POS')
      .getPublicUrl(fileName);

    return {
      publicUrl,
      path: fileName
    };
  } catch (error) {
    console.error('Supabase Storage upload failed:', error);
    throw error;
  }
}

// Delete a file from Supabase Storage
export async function deleteFromSupabaseStorage(filePath) {
  try {
    const { error } = await supabase
      .storage
      .from('POS')
      .remove([filePath]);

    if (error) {
      console.error('Supabase Storage delete failed:', error);
      
      // Handle specific error cases
      if (error.message.includes('row-level security')) {
        throw new Error('Storage delete failed due to permissions. Please check your Supabase Storage bucket policies.');
      }
      
      throw error;
    }

    return true;
  } catch (error) {
    console.error('Supabase Storage delete failed:', error);
    throw error;
  }
}

export default { uploadToSupabaseStorage, deleteFromSupabaseStorage };