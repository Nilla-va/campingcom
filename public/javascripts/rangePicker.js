
const DateTime = easepick.DateTime;
const dateRange = document.getElementById('date-range');

function formatDate(start, end) {
    const startDate = new Date(start);
    const endDate = new Date(end);
    const formattedStartDate = `${startDate.getFullYear()}/${String(startDate.getMonth()+1).padStart(2, '0')}/${String(startDate.getDate()).padStart(2, '0')}`;
    const formattedEndDate = `${endDate.getFullYear()}/${String(endDate.getMonth()+1).padStart(2, '0')}/${String(endDate.getDate()).padStart(2, '0')}`;
    return `${formattedStartDate} ~ ${formattedEndDate}`;
}

const bookedDates = [
    
    // ['2024-02-06', '2024-02-09'],
    // '2024-02-18',
    // '2024-02-19',
    // '2024-02-20',
    // '2024-02-28',

].map(d => {

    if (d instanceof Array) {
        const start = new DateTime(d[0], 'YYYY-MM-DD');
        const end = new DateTime(d[1], 'YYYY-MM-DD');

        return [start, end];
    }

    return new DateTime(d, 'YYYY-MM-DD');

});

const picker = new easepick.create({

    element: document.getElementById('datepicker'),
    css: [
        '/stylesheets/rangePicker.css',
        'https://easepick.com/css/demo_hotelcal.css',
    ],
    format: 'YYYY-MM-DD',
    inline: true,
    plugins: ['RangePlugin', 'LockPlugin'],
    RangePlugin: {
        tooltipNumber(num) {
            return num - 1;
        },
        locale: {
            one: 'night',
            other: 'nights',
        },
    },
    LockPlugin: {
        minDate: new Date(),
        minDays: 2,
        inseparable: true,
        filter(date, picked) {
            if (picked.length === 1) {
                const incl = date.isBefore(picked[0]) ? '[)' : '(]';
                return !picked[0].isSame(date, 'day') && date.inArray(bookedDates, incl);
            }
            return date.inArray(bookedDates, '[)');
        },
    },
    setup(picker) {
        picker.on('select', (e) => {
          const { start, end } = e.detail;
          const selectedRange = formatDate(start, end);
          dateRange.value = selectedRange;
        });
    },

});

