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

