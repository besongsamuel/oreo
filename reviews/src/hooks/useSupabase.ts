import { supabase } from "../lib/supabaseClient";

/**
 * Custom hook to access the Supabase client
 *
 * @returns The Supabase client instance
 *
 * @example
 * ```tsx
 * import { useSupabase } from './hooks/useSupabase';
 *
 * function MyComponent() {
 *   const supabase = useSupabase();
 *
 *   // Fetch data
 *   const fetchData = async () => {
 *     const { data, error } = await supabase
 *       .from('your_table')
 *       .select('*');
 *   };
 *
 *   return <div>...</div>;
 * }
 * ```
 */
export const useSupabase = () => {
  return supabase;
};
