/** Collection CRUD (user goal grouping). AGENTS.md §4.1, §15.3. */

import { getUserId } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import type { Collection } from '@/models';

type CollectionRow = {
  id: string;
  user_id: string;
  name: string;
  color: string | null;
  created_at: string;
};

function mapCollection(row: CollectionRow): Collection {
  return { id: row.id, name: row.name, color: row.color ?? undefined };
}

export const collectionService = {
  async list(): Promise<Collection[]> {
    const { data, error } = await supabase
      .from('collections')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return (data as CollectionRow[]).map(mapCollection);
  },

  async create(name: string, color?: string): Promise<Collection> {
    const userId = await getUserId();
    if (!userId) throw new Error('Not signed in.');
    const { data, error } = await supabase
      .from('collections')
      .insert({ user_id: userId, name, color: color ?? null })
      .select()
      .single();
    if (error) throw error;
    return mapCollection(data as CollectionRow);
  },

  async rename(id: string, name: string): Promise<Collection> {
    const { data, error } = await supabase
      .from('collections')
      .update({ name })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return mapCollection(data as CollectionRow);
  },

  /** Deletes the collection; goals are ungrouped (FK set null), not deleted. */
  async remove(id: string): Promise<void> {
    const { error } = await supabase.from('collections').delete().eq('id', id);
    if (error) throw error;
  },
};
