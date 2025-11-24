import { useCallback, useEffect, useState } from "react";
import {
    ActionPlan,
    ActionPlanFilters,
    ActionPlanItem,
    ActionPlanItemNote,
    ActionPlansService,
} from "../services/actionPlansService";
import { useSupabase } from "./useSupabase";

export const useActionPlans = (
    companyId: string | undefined,
    filters?: ActionPlanFilters
) => {
    const supabase = useSupabase();
    const [actionPlans, setActionPlans] = useState<ActionPlan[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    const service = new ActionPlansService(supabase);

    const fetchActionPlans = useCallback(async () => {
        if (!companyId) {
            setActionPlans([]);
            setLoading(false);
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const data = await service.getActionPlans(companyId, filters);
            setActionPlans(data);
        } catch (err) {
            console.error("Error fetching action plans:", err);
            setError(err instanceof Error ? err : new Error(String(err)));
            setActionPlans([]);
        } finally {
            setLoading(false);
        }
    }, [companyId, supabase, JSON.stringify(filters)]);

    useEffect(() => {
        fetchActionPlans();
    }, [fetchActionPlans]);

    const getActionPlan = useCallback(
        async (id: string): Promise<ActionPlan | null> => {
            try {
                return await service.getActionPlan(id);
            } catch (err) {
                const error = err instanceof Error
                    ? err
                    : new Error(String(err));
                setError(error);
                throw error;
            }
        },
        [service],
    );

    const updateItemStatus = useCallback(
        async (
            itemId: string,
            status: "new" | "in_progress" | "completed"
        ): Promise<void> => {
            try {
                await service.updateActionPlanItemStatus(itemId, status);
                // Refresh action plans to get updated status
                await fetchActionPlans();
            } catch (err) {
                const error = err instanceof Error
                    ? err
                    : new Error(String(err));
                setError(error);
                throw error;
            }
        },
        [service, fetchActionPlans],
    );

    const addNote = useCallback(
        async (
            itemId: string,
            note: string,
            userId: string
        ): Promise<ActionPlanItemNote> => {
            try {
                const newNote = await service.addActionPlanItemNote(
                    itemId,
                    note,
                    userId
                );
                // Refresh action plans to get new note
                await fetchActionPlans();
                return newNote;
            } catch (err) {
                const error = err instanceof Error
                    ? err
                    : new Error(String(err));
                setError(error);
                throw error;
            }
        },
        [service, fetchActionPlans],
    );

    const updateNote = useCallback(
        async (noteId: string, note: string): Promise<void> => {
            try {
                await service.updateActionPlanItemNote(noteId, note);
                // Refresh action plans to get updated note
                await fetchActionPlans();
            } catch (err) {
                const error = err instanceof Error
                    ? err
                    : new Error(String(err));
                setError(error);
                throw error;
            }
        },
        [service, fetchActionPlans],
    );

    const deleteNote = useCallback(
        async (noteId: string): Promise<void> => {
            try {
                await service.deleteActionPlanItemNote(noteId);
                // Refresh action plans to reflect deleted note
                await fetchActionPlans();
            } catch (err) {
                const error = err instanceof Error
                    ? err
                    : new Error(String(err));
                setError(error);
                throw error;
            }
        },
        [service, fetchActionPlans],
    );

    const refreshActionPlans = useCallback(() => {
        return fetchActionPlans();
    }, [fetchActionPlans]);

    return {
        actionPlans,
        loading,
        error,
        getActionPlan,
        updateItemStatus,
        addNote,
        updateNote,
        deleteNote,
        refreshActionPlans,
    };
};

