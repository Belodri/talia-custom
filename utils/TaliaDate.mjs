
/**
 * @typedef {object} DateObject
 * @property {number} day       An integer from 0 to 29
 * @property {number} month     An integer from 0 to 11
 * @property {number} year      A positive integer
 */

export default class TaliaDate extends foundry.abstract.DataModel {
    static DAYS_IN_MONTH = 30;
    
    static MONTHS_IN_YEAR = 12;

    static get monthNamesOrdered() {
        const { months } = SimpleCalendar.api.getCurrentCalendar();
        return Object.values(months).map(v => v.name);
    }

    static defineSchema() {
        const {
            NumberField
        } = foundry.data.fields;

        return {
            day: new NumberField({ integer: true, nullable: false, 
                min: 0, max: TaliaDate.DAYS_IN_MONTH - 1, initial: 0 
            }),
            month: new NumberField({ integer: true, nullable: false, 
                min: 0, max: TaliaDate.MONTHS_IN_YEAR - 1, initial: 0 
            }),
            year: new NumberField({ integer: true, nullable: false, 
                min: 0, initial: 0 
            }),
        }
    }

    static now() {
        const { day, month, year } = SimpleCalendar.api.currentDateTime();
        return new TaliaDate({ day, month, year });
    }

    /**
     * Creates a new TaliaDate instance from a given DateObject or TaliaDate instance.
     * @param {DateObject | TaliaDate} date 
     */
    static fromDate(date = {}) {
        const { day, month, year } = date;
        return new TaliaDate({ day, month, year });
    }

    /**
     * Creates a new TaliaDate instance by applying an offset to an existing date.
     *
     * @param {TaliaDate} date - The original date to which the offset will be applied.
     * @param {object} [offset={}] - The offset to apply to the date.
     * @param {number} [offset.days=0] - The number of days to offset.
     * @param {number} [offset.months=0] - The number of months to offset.
     * @param {number} [offset.years=0] - The number of years to offset.
     * @returns {TaliaDate} A new TaliaDate instance with the applied offset.
     */
    static fromOffset(date, offset = {}) {
        const { days = 0, months = 0, years = 0 } = offset;
        const totalDays = date.inDays 
            + ( years * TaliaDate.MONTHS_IN_YEAR * TaliaDate.DAYS_IN_MONTH )
            + ( months * TaliaDate.DAYS_IN_MONTH )
            + days;
        return TaliaDate.fromDays(totalDays);
    }

    /**
     * Creates a new TaliaDate from a given number of days since 0/0/0000.
     * @param {number} totalDays - The number of days since 0/0/0000.
     */
    static fromDays(totalDays) {
        const daysInYear = TaliaDate.DAYS_IN_MONTH * TaliaDate.MONTHS_IN_YEAR;

        const year = Math.floor( totalDays / daysInYear);
        const remainingDaysAfterYear = totalDays % daysInYear;
        const month = Math.floor(remainingDaysAfterYear / TaliaDate.DAYS_IN_MONTH);
        const day = remainingDaysAfterYear % TaliaDate.DAYS_IN_MONTH;

        return new TaliaDate({day, month, year});
    }

    static async fromDialog(initial = {}) {
        const {DialogV2} = foundry.applications.api;
        const {NumberField, StringField} = foundry.data.fields;

        const monthNames = TaliaDate.monthNamesOrdered;

        const initialDate = foundry.utils.isEmpty(initial) 
            ? TaliaDate.now().toObject() 
            : TaliaDate.fromDate(initial).toObject();

        const dayField = new NumberField({
            label: "Day",
            required: true,
            min: 1,
            max: TaliaDate.DAYS_IN_MONTH,
            integer: true,
            initial: initialDate.day + 1,
        }).toFormGroup({},{name: "day"}).outerHTML;

        const monthField = new StringField({
            label: "Month",
            required: true,
            choices: monthNames,
            initial: initialDate.month,
        }).toFormGroup({},{name: "month"}).outerHTML;

        const yearField = new NumberField({
            label: "Year",
            required: true,
            min: 0,
            integer: true,
            initial: initialDate.year
        }).toFormGroup({},{name: "year"}).outerHTML;

        const result = await DialogV2.prompt({
            content: yearField + monthField + dayField,
            modal: true,
            rejectClose: false,
            ok: {
                callback: (event, button) => new FormDataExtended(button.form).object
            }
        });

        if(!result) return null;

        return new TaliaDate({
            day: result.day - 1,
            month: Number(result.month),
            year: result.year,
        });
    }

    /**
     * The TaliaDate converted to days since 0/0/0000
     * @returns {number}    
     */
    get inDays() {
        return (this.year * TaliaDate.MONTHS_IN_YEAR * TaliaDate.DAYS_IN_MONTH)
            + (this.month * TaliaDate.DAYS_IN_MONTH)
            + this.day;
    }

    get isBeginning() {
        return !this.inDays;
    }

    /** @returns {string} */
    get displayString() {
        const { date } = SimpleCalendar.api.formatDateTime(this.toObject());
        return date;
    }

    /** 
     * Checks if this date is before a given comparison date. 
     * @param {TaliaDate} comparisonDate 
     */
    isBefore(comparisonDate) {
        return this.inDays < comparisonDate.inDays;
    }

    /** 
     * Checks if this date is after a given comparison date. 
     * @param {TaliaDate} comparisonDate 
     */
    isAfter(comparisonDate) {
        return this.inDays > comparisonDate.inDays;
    }

    /** 
     * Checks if this date is the same as a given comparison date. 
     * @param {TaliaDate} comparisonDate 
     */
    isSame(comparisonDate) {
        return this.inDays === comparisonDate.inDays;
    }

    /** @returns {DateObject} */
    toObject() {
        return { day: this.day, month: this.month, year: this.year };
    }

    toJSON() { return this.toObject(); }
}
