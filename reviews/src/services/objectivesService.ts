import { SupabaseClient } from "@supabase/supabase-js";
import { getTimespanDates, Timespan } from "../utils/objectivesUtils";

export interface EnrichedReview {
    id: string;
    rating: number;
    keywords: Array<{
        id: string;
        text: string;
        category: string;
    }>;
    topics: Array<{
        id: string;
        name: string;
        category: string;
        description?: string;
    }>;
    published_at: string;
    sentiment_analysis?: {
        sentiment: string;
        sentiment_score: number;
        emotions?: any;
    } | null;
}

export interface Objective {
    id: string;
    company_id: string;
    name: string;
    description?: string;
    target_rating?: number;
    target_sentiment_score?: number;
    pass_score?: number;
    priority: "high" | "medium" | "low";
    status: "not_started" | "in_progress" | "achieved" | "overdue" | "failed";
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
    target_rating?: number;
    target_sentiment_score?: number;
    pass_score?: number;
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
    target_rating?: number;
    target_sentiment_score?: number;
    pass_score?: number;
    priority?: "high" | "medium" | "low";
}

export interface ObjectiveStatusDetail {
    target_rating?: number;
    current_rating?: number;
    target_sentiment_score?: number;
    current_sentiment_score?: number;
    keyword_targets?: Array<{
        id: string;
        keyword_id: string;
        keyword_text: string;
        target_rating: number;
        current_rating: number;
        progress_percentage: number;
    }>;
    topic_targets?: Array<{
        id: string;
        topic_id: string;
        topic_name: string;
        target_rating: number;
        current_rating: number;
        progress_percentage: number;
    }>;
    overall_progress: number;
    status_indicator: "on_track" | "close" | "off_track" | "far";
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

        // Fetch targets for each objective (progress is now calculated client-side)
        const objectivesWithTargets = await Promise.all(
            objectives.map(async (objective) => {
                const targets = await this.getObjectiveTargets(objective.id);
                return {
                    ...objective,
                    targets,
                    progress: 0, // Progress will be calculated client-side
                };
            }),
        );

        console.log("objectivesWithTargets", objectivesWithTargets);

        return objectivesWithTargets;
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

        return {
            ...objective,
            targets,
            progress: 0, // Progress will be calculated client-side
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
     * Calculate progress for an objective client-side using filtered reviews
     */
    calculateProgressClientSide(
        objective: Objective,
        reviews: EnrichedReview[],
        year: number,
        timespan: Timespan,
    ): number {
        const { startDate, endDate } = getTimespanDates(year, timespan);

        // Filter reviews by date range
        const filteredReviews = reviews.filter((review) => {
            const reviewDate = new Date(review.published_at)
                .toISOString()
                .split("T")[0];
            return reviewDate >= startDate && reviewDate <= endDate;
        });

        if (filteredReviews.length === 0) {
            return 0;
        }

        const progressValues: number[] = [];

        // Calculate rating progress if target_rating exists
        if (objective.target_rating && objective.target_rating > 0) {
            const currentRating = filteredReviews.reduce((sum, r) =>
                sum + r.rating, 0) /
                filteredReviews.length;
            const ratingProgress = Math.min(
                (currentRating / objective.target_rating) * 100,
                100,
            );
            progressValues.push(ratingProgress);
        }

        // Calculate sentiment progress if target_sentiment_score exists
        if (
            objective.target_sentiment_score !== undefined &&
            objective.target_sentiment_score !== null &&
            objective.target_sentiment_score > -1
        ) {
            const reviewsWithSentiment = filteredReviews.filter(
                (review) =>
                    review.sentiment_analysis?.sentiment_score !== undefined &&
                    review.sentiment_analysis?.sentiment_score !== null,
            );

            if (reviewsWithSentiment.length > 0) {
                const currentSentiment = reviewsWithSentiment.reduce(
                    (sum, r) =>
                        sum + (r.sentiment_analysis?.sentiment_score || 0),
                    0,
                ) / reviewsWithSentiment.length;

                // Normalize sentiment score (-1 to 1) to 0-2 range for calculation
                const sentimentProgress = Math.min(
                    ((currentSentiment + 1) /
                        (objective.target_sentiment_score + 1)) * 100,
                    100,
                );
                progressValues.push(sentimentProgress);
            }
        }

        // Calculate keyword/topic progress
        // Only include targets that have reviews in the selected timespan
        if (objective.targets && objective.targets.length > 0) {
            objective.targets.forEach((target) => {
                if (target.target_rating && target.target_rating > 0) {
                    let currentRating = 0;
                    let reviewCount = 0;

                    if (target.target_type === "keyword") {
                        const keywordReviews = filteredReviews.filter((
                            review,
                        ) => review.keywords.some((kw) =>
                            kw.id === target.target_id
                        ));

                        reviewCount = keywordReviews.length;
                        // Only calculate if there are reviews
                        if (reviewCount > 0) {
                            currentRating = keywordReviews.reduce((sum, r) =>
                                sum + r.rating, 0) /
                                keywordReviews.length;
                        }
                    } else if (target.target_type === "topic") {
                        const topicReviews = filteredReviews.filter((review) =>
                            review.topics.some((topic) =>
                                topic.id === target.target_id
                            )
                        );

                        reviewCount = topicReviews.length;
                        // Only calculate if there are reviews
                        if (reviewCount > 0) {
                            currentRating = topicReviews.reduce((sum, r) =>
                                sum + r.rating, 0) /
                                topicReviews.length;
                        }
                    }

                    // Only include in progress calculation if there are reviews
                    if (reviewCount > 0 && currentRating > 0) {
                        const targetProgress = Math.min(
                            (currentRating / target.target_rating) * 100,
                            100,
                        );
                        progressValues.push(targetProgress);
                    }
                }
            });
        }

        // Return average progress
        if (progressValues.length === 0) {
            return 0;
        }

        const averageProgress = progressValues.reduce((sum, p) => sum + p, 0) /
            progressValues.length;
        return Math.round(averageProgress * 100) / 100; // Round to 2 decimal places
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
                target_rating: input.target_rating,
                target_sentiment_score: input.target_sentiment_score,
                pass_score: input.pass_score ?? 100,
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

    /**
     * Get action plan for an objective
     */
    async getObjectiveActionPlan(
        objectiveId: string,
        year: number,
        timespan: Timespan,
    ): Promise<
        {
            id: string;
            objective_id: string;
            year: number;
            timespan: string;
            plan: string;
            created_at: string;
        } | null
    > {
        const { data, error } = await this.supabase
            .from("objective_action_plans")
            .select("*")
            .eq("objective_id", objectiveId)
            .eq("year", year)
            .eq("timespan", timespan)
            .single();

        if (error) {
            if (error.code === "PGRST116") {
                return null; // No plan found
            }
            throw new Error(
                `Failed to fetch action plan: ${error.message}`,
            );
        }

        return data as {
            id: string;
            objective_id: string;
            year: number;
            timespan: string;
            plan: string;
            created_at: string;
        };
    }

    /**
     * Generate action plan for an objective
     */
    async generateObjectiveActionPlan(
        objectiveId: string,
        year: number,
        timespan: Timespan,
        reviewIds: {
            rating_review_ids: string[];
            sentiment_review_ids: string[];
            keyword_review_ids: Record<string, string[]>;
            topic_review_ids: Record<string, string[]>;
        },
    ): Promise<{ id: string }> {
        // Get Supabase URL and anon key from environment
        const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
        if (!supabaseUrl) {
            throw new Error("REACT_APP_SUPABASE_URL is not set");
        }

        // Get auth token
        const {
            data: { session },
        } = await this.supabase.auth.getSession();

        if (!session) {
            throw new Error("User not authenticated");
        }

        // Call edge function
        const response = await fetch(
            `${supabaseUrl}/functions/v1/generate-objective-action-plan`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${session.access_token}`,
                },
                body: JSON.stringify({
                    objective_id: objectiveId,
                    year,
                    timespan,
                    rating_review_ids: reviewIds.rating_review_ids,
                    sentiment_review_ids: reviewIds.sentiment_review_ids,
                    keyword_review_ids: reviewIds.keyword_review_ids,
                    topic_review_ids: reviewIds.topic_review_ids,
                }),
            },
        );

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({
                error: "Unknown error",
            }));
            throw new Error(
                errorData.error ||
                    `Failed to generate action plan: ${response.statusText}`,
            );
        }

        const data = await response.json();

        if (!data.success) {
            throw new Error(data.error || "Failed to generate action plan");
        }

        return { id: data.action_plan_id };
    }
}
