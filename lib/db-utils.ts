import { createClient } from '@/lib/supabase/server';
import { 
  CreditTransaction, 
  License, 
  Music, 
  Notification, 
  Plan, 
  Profile, 
  Song, 
  Subscription, 
  UserActivity, 
  UserSubscription 
} from '@/types/database.types';

// Generic type for API responses
type ApiResponse<T> = {
  data: T | null;
  error: string | null;
};

export async function getUserSongs(userId: string): Promise<ApiResponse<Song[]>> {
  const supabase = await createClient();
  
  try {
    const { data, error } = await supabase
      .from('songs')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    
    return { data, error: null };
  } catch (error) {
    console.error('Error fetching songs:', error);
    return { data: null, error: 'Failed to fetch songs' };
  }
}

export async function createSong(songData: Omit<Song, 'id' | 'created_at' | 'updated_at'>): Promise<ApiResponse<Song>> {
  const supabase = await createClient();
  
  try {
    const { data, error } = await supabase
      .from('songs')
      .insert([songData])
      .select()
      .single();

    if (error) throw error;
    
    return { data, error: null };
  } catch (error) {
    console.error('Error creating song:', error);
    return { data: null, error: 'Failed to create song' };
  }
}

// Add more utility functions for other tables as needed
export async function getUserProfile(userId: string): Promise<ApiResponse<Profile>> {
  const supabase = await createClient();
  
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) throw error;
    
    return { data, error: null };
  } catch (error) {
    console.error('Error fetching profile:', error);
    return { data: null, error: 'Failed to fetch profile' };
  }
}

// Update the songs API route to use these utilities
export async function updateSong(
  songId: string, 
  updates: Partial<Omit<Song, 'id' | 'user_id' | 'created_at'>>
): Promise<ApiResponse<Song>> {
  const supabase = await createClient();
  
  try {
    const { data, error } = await supabase
      .from('songs')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', songId)
      .select()
      .single();

    if (error) throw error;
    
    return { data, error: null };
  } catch (error) {
    console.error('Error updating song:', error);
    return { data: null, error: 'Failed to update song' };
  }
}
