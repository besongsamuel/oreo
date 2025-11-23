import { SupabaseClient } from "@supabase/supabase-js";

export interface Objective {
    id: string;
    company_id: string;
    name: string;
    description?: string;
    start_date: string;
    end_date: string;
    target_rating?: number;
    target_sentiment_score?: number;
    priority: "high" | "medium" | "low";
    status: "not_started" | "in_progress" | "achieved" | "overdue";
    created_at: string;
    updated_at: string;
    created_by?: string;
    progress?: number;
    targets?: ObjectiveTarget[];
}

export interface ObjectiveTarget {
    id: string;
    objective_id: string;
    target_type: "keyword" | "topic";
    target_id: string;
    target_rating: number;
    created_at: string;
    // Enriched data
    keyword?: {
        id: string;
        text: string;
        category: string;
    };
    topic?: {
        id: string;
        name: string;
        category: string;
        description?: string;
    };
    current_rating?: number;
}

export interface CreateObjectiveInput {
    company_id: string;
    name: string;
    description?: string;
    start_date: string;
    end_date: string;
    target_rating?: number;
    target_sentiment_score?: number;
    priority: "high" | "medium" | "low";
    targets?: Array<{
        target_type: "keyword" | "topic";
        target_id: string;
        target_rating: number;
    }>;
}

export interface UpdateObjectiveInput {
    name?: string;
    description?: string;
    start_date?: string;
    end_date?: string;
    target_rating?: number;
    target_sentiment_score?: number;
    priority?: "high" | "medium" | "low";
}

export class ObjectivesService {
    constructor(private supabase: SupabaseClient) {}

    /**
     * Get all objectives for a company
     */
    async getObjectives(companyId: string): Promise<Objective[]> {
        const { data, error } = await this.supabase
            .from("company_objectives")
            .select("*")
            .eq("company_id", companyId)
            .order("created_at", { ascending: false });

        if (error) {
            throw new Error(`Failed to fetch objectives: ${error.message}`);
        }

        const objectives = (data || []) as Objective[];

        // Fetch targets and progress for each objective
        const objectivesWithProgress = await Promise.all(
            objectives.map(async (objective) => {
                const targets = await this.getObjectiveTargets(objective.id);
                const progress = await this.calculateProgress(objective.id);
                return {
                    ...objective,
                    targets,
                    progress,
                };
            }),
        );

        console.log("objectivesWithProgress", objectivesWithProgress);

        return objectivesWithProgress;
    }

    /**
     * Get a single objective by ID
     */
    async getObjective(objectiveId: string): Promise<Objective | null> {
        const { data, error } = await this.supabase
            .from("company_objectives")
            .select("*")
            .eq("id", objectiveId)
            .single();

        if (error) {
            if (error.code === "PGRST116") {
                return null;
            }
            throw new Error(`Failed to fetch objective: ${error.message}`);
        }

        const objective = data as Objective;
        const targets = await this.getObjectiveTargets(objectiveId);
        const progress = await this.calculateProgress(objectiveId);

        return {
            ...objective,
            targets,
            progress,
        };
    }

    /**
     * Get targets for an objective
     */
    async getObjectiveTargets(objectiveId: string): Promise<ObjectiveTarget[]> {
        const { data, error } = await this.supabase
            .from("objective_targets")
            .select("*")
            .eq("objective_id", objectiveId)
            .order("created_at", { ascending: true });

        if (error) {
            throw new Error(`Failed to fetch targets: ${error.message}`);
        }

        const targets = (data || []) as ObjectiveTarget[];

        // Enrich with keyword/topic data
        const enrichedTargets = await Promise.all(
            targets.map(async (target) => {
                if (target.target_type === "keyword") {
                    const { data: keywordData } = await this.supabase
                        .from("keywords")
                        .select("id, text, category")
                        .eq("id", target.target_id)
                        .single();

                    return {
                        ...target,
                        keyword: keywordData || undefined,
                    };
                } else {
                    const { data: topicData } = await this.supabase
                        .from("topics")
                        .select("id, name, category, description")
                        .eq("id", target.target_id)
                        .single();

                    return {
                        ...target,
                        topic: topicData || undefined,
                    };
                }
            }),
        );

        return enrichedTargets;
    }

    /**
     * Calculate progress for an objective
     */
    async calculateProgress(objectiveId: string): Promise<number> {
        const { data, error } = await this.supabase.rpc(
            "calculate_objective_progress",
            {
                p_objective_id: objectiveId,
            },
        );

        if (error) {
            console.error("Error calculating progress:", error);
            return 0;
        }

        return data || 0;
    }

    /**
     * Create a new objective
     */
    async createObjective(input: CreateObjectiveInput): Promise<Objective> {
        // Get current user
        const {
            data: { user },
        } = await this.supabase.auth.getUser();

        // Create objective
        const { data: objectiveData, error: objectiveError } = await this
            .supabase
            .from("company_objectives")
            .insert({
                company_id: input.company_id,
                name: input.name,
                description: input.description,
                start_date: input.start_date,
                end_date: input.end_date,
                target_rating: input.target_rating,
                target_sentiment_score: input.target_sentiment_score,
                priority: input.priority,
                created_by: user?.id,
            })
            .select()
            .single();

        if (objectiveError) {
            throw new Error(
                `Failed to create objective: ${objectiveError.message}`,
            );
        }

        const objective = objectiveData as Objective;

        // Create targets if provided
        if (input.targets && input.targets.length > 0) {
            const { error: targetsError } = await this.supabase
                .from("objective_targets")
                .insert(
                    input.targets.map((target) => ({
                        objective_id: objective.id,
                        target_type: target.target_type,
                        target_id: target.target_id,
                        target_rating: target.target_rating,
                    })),
                );

            if (targetsError) {
                // Rollback: delete the objective if targets fail
                await this.supabase
                    .from("company_objectives")
                    .delete()
                    .eq("id", objective.id);
                throw new Error(
                    `Failed to create targets: ${targetsError.message}`,
                );
            }
        }

        // Fetch complete objective with targets and progress
        const completeObjective = await this.getObjective(objective.id);
        return completeObjective!;
    }

    /**
     * Update an objective
     */
    async updateObjective(
        objectiveId: string,
        input: UpdateObjectiveInput & {
            targets?: Array<{
                target_type: "keyword" | "topic";
                target_id: string;
                target_rating: number;
            }>;
        },
    ): Promise<Objective> {
        const { targets, ...objectiveInput } = input;

        // Update objective fields
        const { error } = await this.supabase
            .from("company_objectives")
            .update(objectiveInput)
            .eq("id", objectiveId);

        if (error) {
            throw new Error(`Failed to update objective: ${error.message}`);
        }

        // Update targets if provided
        if (targets !== undefined) {
            // Delete existing targets
            const { error: deleteError } = await this.supabase
                .from("objective_targets")
                .delete()
                .eq("objective_id", objectiveId);

            if (deleteError) {
                throw new Error(
                    `Failed to delete existing targets: ${deleteError.message}`,
                );
            }

            // Insert new targets
            if (targets.length > 0) {
                const { error: insertError } = await this.supabase
                    .from("objective_targets")
                    .insert(
                        targets.map((target) => ({
                            objective_id: objectiveId,
                            target_type: target.target_type,
                            target_id: target.target_id,
                            target_rating: target.target_rating,
                        })),
                    );

                if (insertError) {
                    throw new Error(
                        `Failed to create targets: ${insertError.message}`,
                    );
                }
            }
        }

        const updatedObjective = await this.getObjective(objectiveId);
        if (!updatedObjective) {
            throw new Error("Objective not found after update");
        }

        return updatedObjective;
    }

    /**
     * Delete an objective
     */
    async deleteObjective(objectiveId: string): Promise<void> {
        const { error } = await this.supabase
            .from("company_objectives")
            .delete()
            .eq("id", objectiveId);

        if (error) {
            throw new Error(`Failed to delete objective: ${error.message}`);
        }
    }

    /**
     * Add a target to an objective
     */
    async addTarget(
        objectiveId: string,
        targetType: "keyword" | "topic",
        targetId: string,
        targetRating: number,
    ): Promise<ObjectiveTarget> {
        const { data, error } = await this.supabase
            .from("objective_targets")
            .insert({
                objective_id: objectiveId,
                target_type: targetType,
                target_id: targetId,
                target_rating: targetRating,
            })
            .select()
            .single();

        if (error) {
            throw new Error(`Failed to add target: ${error.message}`);
        }

        return data as ObjectiveTarget;
    }

    /**
     * Remove a target from an objective
     */
    async removeTarget(targetId: string): Promise<void> {
        const { error } = await this.supabase
            .from("objective_targets")
            .delete()
            .eq("id", targetId);

        if (error) {
            throw new Error(`Failed to remove target: ${error.message}`);
        }
    }

    /**
     * Get keywords with current ratings for a company
     */
    async getKeywordsWithRatings(
        companyId: string,
        startDate?: string,
        endDate?: string,
    ): Promise<
        Array<{
            id: string;
            text: string;
            category: string;
            current_rating: number;
        }>
    > {
        // Get locations for this company
        const { data: locations, error: locationsError } = await this.supabase
            .from("locations")
            .select("id")
            .eq("company_id", companyId);

        if (locationsError) {
            throw new Error(
                `Failed to fetch locations: ${locationsError.message}`,
            );
        }

        const locationIds = locations?.map((l) => l.id) || [];

        if (locationIds.length === 0) {
            return [];
        }

        // Get platform connections for these locations
        const { data: platformConnections, error: pcError } = await this
            .supabase
            .from("platform_connections")
            .select("id")
            .in("location_id", locationIds);

        if (pcError) {
            throw new Error(
                `Failed to fetch platform connections: ${pcError.message}`,
            );
        }

        const platformConnectionIds = platformConnections?.map((pc) => pc.id) ||
            [];

        if (platformConnectionIds.length === 0) {
            return [];
        }

        // Get all keywords used in reviews for this company
        const { data: keywordsData, error: keywordsError } = await this.supabase
            .from("review_keywords")
            .select(
                `
        keywords:keyword_id (
          id,
          text,
          category
        )
      `,
            )
            .in("platform_connection_id", platformConnectionIds)
            .limit(1000);

        if (keywordsError) {
            throw new Error(
                `Failed to fetch keywords: ${keywordsError.message}`,
            );
        }

        // Get unique keywords
        const keywordMap = new Map<
            string,
            { id: string; text: string; category: string }
        >();
        keywordsData?.forEach((item: any) => {
            if (item.keywords) {
                keywordMap.set(item.keywords.id, {
                    id: item.keywords.id,
                    text: item.keywords.text,
                    category: item.keywords.category || "other",
                });
            }
        });

        // Calculate current ratings for each keyword
        const keywordsWithRatings = await Promise.all(
            Array.from(keywordMap.values()).map(async (keyword) => {
                const { data: ratingData } = await this.supabase.rpc(
                    "get_keyword_current_rating",
                    {
                        p_company_id: companyId,
                        p_keyword_id: keyword.id,
                        p_start_date: startDate || "2000-01-01",
                        p_end_date: endDate ||
                            new Date().toISOString().split("T")[0],
                    },
                );

                return {
                    ...keyword,
                    current_rating: ratingData || 0,
                };
            }),
        );

        // Filter out keywords with no ratings and sort by current rating
        return keywordsWithRatings
            .filter((kw) => kw.current_rating > 0)
            .sort((a, b) => b.current_rating - a.current_rating);
    }

    /**
     * Get topics with current ratings for a company
     */
    async getTopicsWithRatings(
        companyId: string,
        startDate?: string,
        endDate?: string,
    ): Promise<
        Array<{
            id: string;
            name: string;
            category: string;
            description?: string;
            current_rating: number;
        }>
    > {
        // Get all topics for this company
        const { data: topicsData, error: topicsError } = await this.supabase
            .from("topics")
            .select("id, name, category, description")
            .eq("company_id", companyId)
            .eq("is_active", true);

        if (topicsError) {
            throw new Error(`Failed to fetch topics: ${topicsError.message}`);
        }

        // Calculate current ratings for each topic
        const topicsWithRatings = await Promise.all(
            (topicsData || []).map(async (topic) => {
                const { data: ratingData } = await this.supabase.rpc(
                    "get_topic_current_rating",
                    {
                        p_company_id: companyId,
                        p_topic_id: topic.id,
                        p_start_date: startDate || "2000-01-01",
                        p_end_date: endDate ||
                            new Date().toISOString().split("T")[0],
                    },
                );

                return {
                    ...topic,
                    current_rating: ratingData || 0,
                };
            }),
        );

        // Filter out topics with no ratings and sort by current rating
        return topicsWithRatings
            .filter((topic) => topic.current_rating > 0)
            .sort((a, b) => b.current_rating - a.current_rating);
    }
}
