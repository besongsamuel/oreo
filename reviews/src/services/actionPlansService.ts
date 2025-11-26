import { SupabaseClient } from "@supabase/supabase-js";

export interface ActionPlan {
    id: string;
    company_id: string;
    source_type: "objective" | "sentiment";
    source_id: string | null;
    name: string;
    description: string;
    plan_markdown: string;
    input_hash: string;
    metadata: Record<string, any>;
    status: "new" | "in_progress" | "completed";
    created_at: string;
    updated_at: string;
    items?: ActionPlanItem[];
}

export interface ActionPlanItem {
    id: string;
    action_plan_id: string;
    topic: string;
    title: string;
    description: string;
    status: "new" | "in_progress" | "completed";
    order_index: number;
    created_at: string;
    updated_at: string;
    notes?: ActionPlanItemNote[];
}

export interface ActionPlanItemNote {
    id: string;
    action_plan_item_id: string;
    note: string;
    created_by: string | null;
    created_at: string;
    updated_at: string;
    created_by_profile?: {
        full_name: string | null;
        email: string;
    };
}

export interface ActionPlanFilters {
    source_type?: "objective" | "sentiment";
    status?: "new" | "in_progress" | "completed";
}

export class ActionPlansService {
    constructor(private supabase: SupabaseClient) {}

    /**
     * Get all action plans for a company
     */
    async getActionPlans(
        companyId: string,
        filters?: ActionPlanFilters
    ): Promise<ActionPlan[]> {
        let query = this.supabase
            .from("action_plans")
            .select("*")
            .eq("company_id", companyId)
            .order("created_at", { ascending: false });

        if (filters?.source_type) {
            query = query.eq("source_type", filters.source_type);
        }

        if (filters?.status) {
            query = query.eq("status", filters.status);
        }

        const { data, error } = await query;

        if (error) {
            throw new Error(`Failed to fetch action plans: ${error.message}`);
        }

        return (data || []) as ActionPlan[];
    }

    /**
     * Get a single action plan with items and notes
     */
    async getActionPlan(id: string): Promise<ActionPlan | null> {
        // Fetch action plan
        const { data: plan, error: planError } = await this.supabase
            .from("action_plans")
            .select("*")
            .eq("id", id)
            .single();

        if (planError) {
            if (planError.code === "PGRST116") {
                return null; // Not found
            }
            throw new Error(`Failed to fetch action plan: ${planError.message}`);
        }

        // Fetch items
        const { data: items, error: itemsError } = await this.supabase
            .from("action_plan_items")
            .select("*")
            .eq("action_plan_id", id)
            .order("topic", { ascending: true })
            .order("order_index", { ascending: true });

        if (itemsError) {
            throw new Error(`Failed to fetch action plan items: ${itemsError.message}`);
        }

        // Fetch notes for all items
        const itemIds = (items || []).map((item) => item.id);
        let notes: ActionPlanItemNote[] = [];

        if (itemIds.length > 0) {
            const { data: notesData, error: notesError } = await this.supabase
                .from("action_plan_item_notes")
                .select("*")
                .in("action_plan_item_id", itemIds)
                .order("created_at", { ascending: false });

            if (notesError) {
                console.error("Error fetching notes:", notesError);
                // Don't throw, just continue without notes
            } else {
                // Fetch profile data for notes that have created_by
                const userIds = Array.from(
                    new Set(
                        (notesData || [])
                            .map((n) => n.created_by)
                            .filter((id): id is string => id !== null)
                    )
                );

                let profilesMap: Record<string, { full_name: string | null; email: string }> = {};
                if (userIds.length > 0) {
                    const { data: profilesData } = await this.supabase
                        .from("profiles")
                        .select("id, full_name, email")
                        .in("id", userIds);

                    if (profilesData) {
                        profilesMap = profilesData.reduce(
                            (acc, profile) => {
                                acc[profile.id] = {
                                    full_name: profile.full_name,
                                    email: profile.email,
                                };
                                return acc;
                            },
                            {} as Record<string, { full_name: string | null; email: string }>
                        );
                    }
                }

                notes = (notesData || []).map((note) => ({
                    ...note,
                    created_by_profile: note.created_by && profilesMap[note.created_by]
                        ? profilesMap[note.created_by]
                        : undefined,
                })) as ActionPlanItemNote[];
            }
        }

        // Group notes by item
        const itemsWithNotes = (items || []).map((item) => ({
            ...item,
            notes: notes.filter((note) => note.action_plan_item_id === item.id),
        })) as ActionPlanItem[];

        return {
            ...plan,
            items: itemsWithNotes,
        } as ActionPlan;
    }

    /**
     * Update action plan item status
     */
    async updateActionPlanItemStatus(
        itemId: string,
        status: "new" | "in_progress" | "completed"
    ): Promise<void> {
        const { error } = await this.supabase
            .from("action_plan_items")
            .update({ status, updated_at: new Date().toISOString() })
            .eq("id", itemId);

        if (error) {
            throw new Error(
                `Failed to update action plan item status: ${error.message}`
            );
        }
    }

    /**
     * Add a note to an action plan item
     */
    async addActionPlanItemNote(
        itemId: string,
        note: string,
        userId: string
    ): Promise<ActionPlanItemNote> {
        const { data, error } = await this.supabase
            .from("action_plan_item_notes")
            .insert({
                action_plan_item_id: itemId,
                note,
                created_by: userId,
            })
            .select("*")
            .single();

        if (error) {
            throw new Error(`Failed to add note: ${error.message}`);
        }

        // Fetch profile data
        let created_by_profile: { full_name: string | null; email: string } | undefined;
        if (data.created_by) {
            const { data: profileData } = await this.supabase
                .from("profiles")
                .select("full_name, email")
                .eq("id", data.created_by)
                .single();

            if (profileData) {
                created_by_profile = {
                    full_name: profileData.full_name,
                    email: profileData.email,
                };
            }
        }

        return {
            ...data,
            created_by_profile,
        } as ActionPlanItemNote;
    }

    /**
     * Update an action plan item note
     */
    async updateActionPlanItemNote(
        noteId: string,
        note: string
    ): Promise<void> {
        const { error } = await this.supabase
            .from("action_plan_item_notes")
            .update({
                note,
                updated_at: new Date().toISOString(),
            })
            .eq("id", noteId);

        if (error) {
            throw new Error(`Failed to update note: ${error.message}`);
        }
    }

    /**
     * Delete an action plan item note
     */
    async deleteActionPlanItemNote(noteId: string): Promise<void> {
        const { error } = await this.supabase
            .from("action_plan_item_notes")
            .delete()
            .eq("id", noteId);

        if (error) {
            throw new Error(`Failed to delete note: ${error.message}`);
        }
    }

    /**
     * Delete an action plan (cascade will handle items and notes)
     */
    async deleteActionPlan(planId: string): Promise<void> {
        const { error } = await this.supabase
            .from("action_plans")
            .delete()
            .eq("id", planId);

        if (error) {
            throw new Error(`Failed to delete action plan: ${error.message}`);
        }
    }
}

