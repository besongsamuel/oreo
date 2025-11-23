import { useCallback, useEffect, useState } from "react";
import {
    CreateObjectiveInput,
    Objective,
    ObjectivesService,
    UpdateObjectiveInput,
} from "../services/objectivesService";
import { useSupabase } from "./useSupabase";

export const useObjectives = (companyId: string | undefined) => {
    const supabase = useSupabase();
    const [objectives, setObjectives] = useState<Objective[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    const service = new ObjectivesService(supabase);

    const fetchObjectives = useCallback(async () => {
        if (!companyId) {
            setObjectives([]);
            setLoading(false);
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const data = await service.getObjectives(companyId);
            setObjectives(data);
        } catch (err) {
            console.error("Error fetching objectives:", err);
            setError(err instanceof Error ? err : new Error(String(err)));
            setObjectives([]);
        } finally {
            setLoading(false);
        }
    }, [companyId, supabase]);

    useEffect(() => {
        fetchObjectives();
    }, [fetchObjectives]);

    const createObjective = useCallback(
        async (input: CreateObjectiveInput): Promise<Objective> => {
            try {
                const newObjective = await service.createObjective(input);
                await fetchObjectives();
                return newObjective;
            } catch (err) {
                const error = err instanceof Error
                    ? err
                    : new Error(String(err));
                setError(error);
                throw error;
            }
        },
        [service, fetchObjectives],
    );

    const updateObjective = useCallback(
        async (
            objectiveId: string,
            input: UpdateObjectiveInput,
        ): Promise<Objective> => {
            try {
                const updatedObjective = await service.updateObjective(
                    objectiveId,
                    input,
                );
                await fetchObjectives();
                return updatedObjective;
            } catch (err) {
                const error = err instanceof Error
                    ? err
                    : new Error(String(err));
                setError(error);
                throw error;
            }
        },
        [service, fetchObjectives],
    );

    const deleteObjective = useCallback(
        async (objectiveId: string): Promise<void> => {
            try {
                await service.deleteObjective(objectiveId);
                await fetchObjectives();
            } catch (err) {
                const error = err instanceof Error
                    ? err
                    : new Error(String(err));
                setError(error);
                throw error;
            }
        },
        [service, fetchObjectives],
    );

    const refreshObjectives = useCallback(() => {
        return fetchObjectives();
    }, [fetchObjectives]);

    return {
        objectives,
        loading,
        error,
        createObjective,
        updateObjective,
        deleteObjective,
        refreshObjectives,
    };
};
