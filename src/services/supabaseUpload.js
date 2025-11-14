import { supabase } from '../config/supabase';

// Test Supabase connection and bucket access
export const testSupabaseConnection = async () => {
  try {
    console.log('🧪 Testing Supabase connection...');
    
    // Test 1: Check if we can list buckets
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
    
    if (bucketsError) {
      console.error('❌ Cannot list buckets:', bucketsError);
      return { success: false, error: bucketsError.message };
    }
    
    console.log('✅ Available buckets:', buckets?.map(b => b.name));
    
    // Test 2: Check if property-images bucket exists
    const bucketExists = buckets?.some(b => b.name === 'property-images');
    
    if (!bucketExists) {
      console.error('❌ Bucket "property-images" not found');
      return { 
        success: false, 
        error: 'Bucket "property-images" not found. Available buckets: ' + buckets?.map(b => b.name).join(', ') 
      };
    }
    
    console.log('✅ Bucket "property-images" exists');
    
    // Test 3: Try to list files in the bucket (tests SELECT policy)
    const { data: files, error: listError } = await supabase.storage
      .from('property-images')
      .list('properties', { limit: 1 });
    
    if (listError) {
      console.warn('⚠️ Cannot list files (might be policy issue):', listError.message);
    } else {
      console.log('✅ Can read from bucket');
    }
    
    return { success: true, message: 'Supabase connection successful' };
  } catch (error) {
    console.error('❌ Connection test failed:', error);
    return { success: false, error: error.message };
  }
};

export const supabaseUpload = {
  /**
   * Upload image to Supabase Storage
   * @param {File} file - The image file to upload
   * @param {string} folder - Folder path in Supabase (e.g., 'properties')
   * @param {string} propertyId - Property ID for unique naming
   * @returns {Promise<{url: string, path: string, success: boolean}>}
   */
  uploadImage: async (file, folder = 'properties', propertyId = null) => {
    try {
      console.log('📤 Starting Supabase upload...', { file: file.name, folder, propertyId });
      
      // Generate unique filename
      const fileExt = file.name.split('.').pop();
      const fileName = propertyId 
        ? `${propertyId}_${Date.now()}.${fileExt}`
        : `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
      
      const filePath = `${folder}/${fileName}`;
      console.log('📁 File path:', filePath);

      // Upload file to Supabase Storage
      // NOTE: Bucket name is case-sensitive! Must match exactly: 'property-images'
      console.log('📦 Attempting upload to bucket: property-images');
      console.log('🔐 Supabase client auth state:', {
        user: (await supabase.auth.getUser()).data?.user?.id || 'Not authenticated',
        session: (await supabase.auth.getSession()).data?.session ? 'Has session' : 'No session'
      });
      
      const { data, error } = await supabase.storage
        .from('property-images') // Your bucket name (case-sensitive)
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) {
        console.error('❌ Supabase upload error:', error);
        console.error('Error details:', {
          message: error.message,
          statusCode: error.statusCode,
          error: error.error,
          name: error.name
        });
        
        // Provide more helpful error messages
        if (error.message?.includes('Bucket not found') || error.message?.includes('does not exist')) {
          throw new Error('Storage bucket "property-images" not found. Please create it in Supabase dashboard.');
        } else if (error.message?.includes('new row violates row-level security') || 
                   error.message?.includes('row-level security') ||
                   error.message?.includes('policy') ||
                   error.statusCode === 403) {
          const detailedError = `Storage policy error. Please check your Supabase storage policies.\n\nError: ${error.message}\n\nMake sure you have:\n1. An INSERT policy for "authenticated" role\n2. Policy expression: bucket_id = 'property-images' or true\n3. WITH CHECK expression: true`;
          throw new Error(detailedError);
        } else if (error.message?.includes('JWT') || error.message?.includes('auth')) {
          throw new Error('Authentication error. Please check your Supabase API keys.');
        }
        
        throw new Error(error.message || 'Upload failed. Check browser console for details.');
      }

      console.log('✅ Upload successful:', data);

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('property-images')
        .getPublicUrl(filePath);

      const publicUrl = urlData.publicUrl;
      console.log('🔗 Public URL:', publicUrl);

      return {
        url: publicUrl,
        path: filePath,
        success: true
      };
    } catch (error) {
      console.error('❌ Supabase upload error:', error);
      throw error;
    }
  },

  /**
   * Upload multiple images
   * @param {File[]} files - Array of image files to upload
   * @param {string} folder - Folder path in Supabase
   * @param {string} propertyId - Property ID for unique naming
   * @returns {Promise<Array<{url: string, path: string, success: boolean}>>}
   */
  uploadImages: async (files, folder = 'properties', propertyId = null) => {
    const uploadPromises = files.map(file => 
      supabaseUpload.uploadImage(file, folder, propertyId)
    );
    
    return Promise.all(uploadPromises);
  },

  /**
   * Delete image from Supabase
   * @param {string} filePath - Path to the file in Supabase storage
   * @returns {Promise<{success: boolean}>}
   */
  deleteImage: async (filePath) => {
    try {
      const { error } = await supabase.storage
        .from('property-images')
        .remove([filePath]);

      if (error) throw error;
      return { success: true };
    } catch (error) {
      console.error('Supabase delete error:', error);
      throw error;
    }
  }
};

