/**
 * Date utility functions for email notifications
 */

/**
 * Get the start and end dates of the previous calendar week (Monday to Sunday)
 * @param date - Reference date (defaults to now)
 * @returns Object with start (Monday 00:00:00) and end (Sunday 23:59:59) dates
 */
export function getPreviousWeekDates(date: Date = new Date()): {
    start: Date;
    end: Date;
} {
    const d = new Date(date);
    d.setUTCHours(0, 0, 0, 0);

    // Get the day of week (0 = Sunday, 1 = Monday, ..., 6 = Saturday)
    const dayOfWeek = d.getUTCDay();

    // Calculate days to subtract to get to last Monday
    // If today is Monday (1), we want last Monday (7 days ago)
    // If today is Sunday (0), we want last Monday (6 days ago)
    const daysToSubtract = dayOfWeek === 0 ? 6 : dayOfWeek - 1 + 7;

    // Get last Monday
    const lastMonday = new Date(d);
    lastMonday.setUTCDate(d.getUTCDate() - daysToSubtract);
    lastMonday.setUTCHours(0, 0, 0, 0);

    // Get last Sunday (6 days after last Monday)
    const lastSunday = new Date(lastMonday);
    lastSunday.setUTCDate(lastMonday.getUTCDate() + 6);
    lastSunday.setUTCHours(23, 59, 59, 999);

    return {
        start: lastMonday,
        end: lastSunday,
    };
}

/**
 * Get the start and end dates of the previous calendar month
 * @param date - Reference date (defaults to now)
 * @returns Object with start (first day 00:00:00) and end (last day 23:59:59) dates
 */
export function getPreviousMonthDates(date: Date = new Date()): {
    start: Date;
    end: Date;
} {
    const d = new Date(date);
    d.setUTCHours(0, 0, 0, 0);

    // Get first day of current month
    const currentMonthStart = new Date(
        Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1),
    );

    // Get last day of previous month (day 0 of current month)
    const previousMonthEnd = new Date(currentMonthStart);
    previousMonthEnd.setUTCDate(0);
    previousMonthEnd.setUTCHours(23, 59, 59, 999);

    // Get first day of previous month
    const previousMonthStart = new Date(previousMonthEnd);
    previousMonthStart.setUTCDate(1);
    previousMonthStart.setUTCHours(0, 0, 0, 0);

    return {
        start: previousMonthStart,
        end: previousMonthEnd,
    };
}

/**
 * Check if a given date is the first Monday of the month
 * Used to skip weekly digest when monthly report is sent
 * @param date - Date to check
 * @returns True if the date is the first Monday of the month
 */
export function isFirstMondayOfMonth(date: Date = new Date()): boolean {
    const d = new Date(date);
    const dayOfWeek = d.getUTCDay(); // 0 = Sunday, 1 = Monday
    const dayOfMonth = d.getUTCDate();

    return dayOfWeek === 1 && dayOfMonth === 1;
}

/**
 * Format a date range for display in emails
 * @param start - Start date
 * @param end - End date
 * @returns Formatted string like "January 1 - 7, 2025"
 */
export function formatDateRange(start: Date, end: Date): string {
    const startDate = new Date(start);
    const endDate = new Date(end);

    const startMonth = startDate.toLocaleDateString("en-US", { month: "long" });
    const startDay = startDate.getUTCDate();
    const startYear = startDate.getUTCFullYear();

    const endMonth = endDate.toLocaleDateString("en-US", { month: "long" });
    const endDay = endDate.getUTCDate();
    const endYear = endDate.getUTCFullYear();

    // Same month and year
    if (startMonth === endMonth && startYear === endYear) {
        return `${startMonth} ${startDay} - ${endDay}, ${startYear}`;
    }

    // Same year, different months
    if (startYear === endYear) {
        return `${startMonth} ${startDay} - ${endMonth} ${endDay}, ${startYear}`;
    }

    // Different years
    return `${startMonth} ${startDay}, ${startYear} - ${endMonth} ${endDay}, ${endYear}`;
}

/**
 * Format a single date for display
 * @param date - Date to format
 * @returns Formatted string like "January 2025"
 */
export function formatMonthYear(date: Date): string {
    return date.toLocaleDateString("en-US", { month: "long", year: "numeric" });
}


