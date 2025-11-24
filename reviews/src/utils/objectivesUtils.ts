/**
 * Utility functions for objectives timespan calculations
 */

export type Timespan = 'q1' | 'q2' | 'q3' | 'q4' | 'all';

/**
 * Get start and end dates for a given year and timespan
 */
export function getTimespanDates(
  year: number,
  timespan: Timespan
): { startDate: string; endDate: string } {
  let startMonth = 0; // January
  let startDay = 1;
  let endMonth = 11; // December
  let endDay = 31;

  switch (timespan) {
    case 'q1':
      startMonth = 0; // January
      startDay = 1;
      endMonth = 2; // March
      endDay = 31;
      break;
    case 'q2':
      startMonth = 3; // April
      startDay = 1;
      endMonth = 5; // June
      endDay = 30;
      break;
    case 'q3':
      startMonth = 6; // July
      startDay = 1;
      endMonth = 8; // September
      endDay = 30;
      break;
    case 'q4':
      startMonth = 9; // October
      startDay = 1;
      endMonth = 11; // December
      endDay = 31;
      break;
    case 'all':
      startMonth = 0; // January
      startDay = 1;
      endMonth = 11; // December
      endDay = 31;
      break;
  }

  const startDate = new Date(year, startMonth, startDay);
  const endDate = new Date(year, endMonth, endDay);

  // Format as YYYY-MM-DD
  const formatDate = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  return {
    startDate: formatDate(startDate),
    endDate: formatDate(endDate),
  };
}

/**
 * Get the current quarter
 */
export function getCurrentQuarter(): Timespan {
  const month = new Date().getMonth(); // 0-11
  if (month < 3) return 'q1';
  if (month < 6) return 'q2';
  if (month < 9) return 'q3';
  return 'q4';
}

/**
 * Format timespan display string
 */
export function formatTimespanDisplay(
  year: number,
  timespan: Timespan
): string {
  const timespanLabels: Record<Timespan, string> = {
    q1: 'Q1',
    q2: 'Q2',
    q3: 'Q3',
    q4: 'Q4',
    all: 'All Year',
  };
  return `${timespanLabels[timespan]} ${year}`;
}

/**
 * Check if a timespan is complete (in the past)
 * Returns true if the end date of the timespan has passed
 */
export function isTimespanComplete(
  year: number,
  timespan: Timespan
): boolean {
  const { endDate } = getTimespanDates(year, timespan);
  const today = new Date();
  today.setHours(0, 0, 0, 0); // Reset time to compare dates only
  
  const endDateObj = new Date(endDate);
  endDateObj.setHours(23, 59, 59, 999); // End of the day
  
  return today > endDateObj;
}

/**
 * Calculate objective status based on progress and timespan completion
 */
export function calculateObjectiveStatus(
  progress: number,
  year: number,
  timespan: Timespan,
  passScore: number = 100
): "not_started" | "in_progress" | "achieved" | "failed" {
  const isComplete = isTimespanComplete(year, timespan);
  
  // If progress meets or exceeds pass_score, status is achieved
  if (progress >= passScore) {
    return "achieved";
  }
  
  // If timespan is complete (in the past) and progress < pass_score, status is failed
  if (isComplete) {
    return "failed";
  }
  
  // If timespan is not complete (current or future), status is in_progress
  // Note: We don't use "not_started" here since the objective exists and has progress
  return "in_progress";
}

/**
 * Interface for enriched review (matches EnrichedReview from objectivesService)
 */
export interface EnrichedReviewForFailedIds {
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

/**
 * Interface for objective target
 */
export interface ObjectiveTargetForFailedIds {
  id: string;
  target_type: "keyword" | "topic";
  target_id: string;
  target_rating: number;
}

/**
 * Interface for objective
 */
export interface ObjectiveForFailedIds {
  id: string;
  target_rating?: number;
  targets?: ObjectiveTargetForFailedIds[];
}

/**
 * Get failed review IDs for each target type
 * Returns review IDs that are below the target values
 */
export function getFailedReviewIds(
  objective: ObjectiveForFailedIds,
  enrichedReviews: EnrichedReviewForFailedIds[],
  year: number,
  timespan: Timespan
): {
  rating_review_ids: string[];
  sentiment_review_ids: string[];
  keyword_review_ids: Record<string, string[]>;
  topic_review_ids: Record<string, string[]>;
} {
  const { startDate, endDate } = getTimespanDates(year, timespan);

  // Filter reviews by date range
  const filteredReviews = enrichedReviews.filter((review) => {
    const reviewDate = new Date(review.published_at)
      .toISOString()
      .split("T")[0];
    return reviewDate >= startDate && reviewDate <= endDate;
  });

  const rating_review_ids: string[] = [];
  const sentiment_review_ids: string[] = [];
  const keyword_review_ids: Record<string, string[]> = {};
  const topic_review_ids: Record<string, string[]> = {};

  // Check rating target
  if (objective.target_rating && objective.target_rating > 0) {
    filteredReviews.forEach((review) => {
      if (review.rating < objective.target_rating!) {
        rating_review_ids.push(review.id);
      }
    });
  }

  // Check keyword/topic targets
  if (objective.targets && objective.targets.length > 0) {
    objective.targets.forEach((target) => {
      if (target.target_rating && target.target_rating > 0) {
        const targetReviews = filteredReviews.filter((review) => {
          if (target.target_type === "keyword") {
            const hasKeyword = review.keywords.some(
              (kw) => kw.id === target.target_id
            );
            return hasKeyword && review.rating < target.target_rating;
          } else {
            const hasTopic = review.topics.some(
              (topic) => topic.id === target.target_id
            );
            return hasTopic && review.rating < target.target_rating;
          }
        });

        if (targetReviews.length > 0) {
          const reviewIds = targetReviews.map((r) => r.id);
          if (target.target_type === "keyword") {
            keyword_review_ids[target.target_id] = reviewIds;
          } else {
            topic_review_ids[target.target_id] = reviewIds;
          }
        }
      }
    });
  }

  return {
    rating_review_ids,
    sentiment_review_ids,
    keyword_review_ids,
    topic_review_ids,
  };
}

