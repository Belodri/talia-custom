
/**
 * @typedef {object} DateObject
 * @property {number} day       An integer from 0 to 29
 * @property {number} month     An integer from 0 to 11
 * @property {number} year      A positive integer
 */

export default class TaliaDate {
    static daysInMonth = 30;

    static monthsInYear = 12;

    static now() {
        const { day, month, year } = SimpleCalendar.api.currentDateTime();
        return new TaliaDate({ day, month, year });
    }

    /** @param {DateObject} */
    static fromDate({ day, month, year }) {
        return new TaliaDate({ day, month, year });
    }

    /**
     * Creates a new TaliaDate from a given number of days since 0/0/0000.
     * @param {number} totalDays - The number of days since 0/0/0000.
     * @returns {TaliaDate}
     */
    static fromDays(totalDays) {
        if (!Number.isInteger(totalDays) || totalDays < 0) {
            throw new Error("Total days must be a non-negative integer.");
        }

        const daysInYear = TaliaDate.monthsInYear * TaliaDate.daysInMonth;

        // Step 1: Calculate the year
        const year = Math.floor(totalDays / daysInYear);

        // Step 2: Calculate remaining days after full years
        const remainingDaysAfterYear = totalDays % daysInYear;

        // Step 3: Calculate the month
        const month = Math.floor(remainingDaysAfterYear / TaliaDate.daysInMonth);

        // Step 4: Calculate the day
        const day = remainingDaysAfterYear % TaliaDate.daysInMonth;

        // Step 5: Create and return a new TaliaDate
        return new TaliaDate({ day, month, year });
    }

    /** @param {DateObject} */
    constructor({ day, month, year }) {
        if (!TaliaDate.isValid({ day, month, year })) {
            throw new Error(`Invalid data: {day: ${day}, month: ${month}, year: ${year}}`);
        }
        this.day = day;
        this.month = month;
        this.year = year;
    }

    static isValid({ day, month, year } = {}) {
        return Number.isInteger(day) && day >= 0 && day < TaliaDate.daysInMonth
            && Number.isInteger(month) && month >= 0 && month < TaliaDate.monthsInYear
            && Number.isInteger(year) && year >= 0;
    }

    /**
     * The TaliaDate converted to days since 0/0/0000
     * @returns {number}
     */
    inDays() {
        return (this.year * TaliaDate.monthsInYear * TaliaDate.daysInMonth)
            + (this.month * TaliaDate.daysInMonth)
            + this.day;
    }

    /** @returns {string} */
    displayString() {
        const { date } = SimpleCalendar.api.formatDateTime(this.dateObject);
        return date;
    }

    toObject() {
        return { day: this.day, month: this.month, year: this.year };
    }

    toJSON() { return this.toObject(); }

    /**
     * @param {number} offsetDays 
     * @returns {TaliaDate}         A new instance of TaliaDate, offset by given number of days.
     */
    getOffsetDate(offsetDays) {
        const totalDays = this.inDays() + offsetDays;
        if (totalDays < 0) {
            throw new Error("Resulting date cannot be before 0/0/0000.");
        }
        return TaliaDate.fromDays(totalDays);
    }
}
