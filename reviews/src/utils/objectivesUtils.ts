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
  timespan: Timespan
): "not_started" | "in_progress" | "achieved" | "failed" {
  const isComplete = isTimespanComplete(year, timespan);
  
  // If progress is 100% or more, status is achieved
  if (progress >= 100) {
    return "achieved";
  }
  
  // If timespan is complete (in the past) and progress < 100%, status is failed
  if (isComplete) {
    return "failed";
  }
  
  // If timespan is not complete (current or future), status is in_progress
  // Note: We don't use "not_started" here since the objective exists and has progress
  return "in_progress";
}

