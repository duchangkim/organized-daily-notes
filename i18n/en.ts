import type { LocaleStrings } from './types';

export const english: LocaleStrings = {
  settings: {
    title: 'Better Daily Notes Settings',
    folderStructure: {
      name: 'Folder Structure',
      desc: 'Select the folder structure for daily notes',
      options: {
        year: 'Year only (YYYY)',
        yearMonth: 'Year/Month (YYYY/MM)',
        yearMonthWeek: 'Year/Month/Week (YYYY/MM/Week-N)',
      },
    },
    folderFormat: {
      title: 'Folder Format Settings',
      desc: 'Customize how your year, month, and week folders are named.',
      momentDocsLink: 'Moment.js format reference',
      year: {
        name: 'Year Format',
        desc: 'Format for year folders (e.g., YYYY, YY)',
      },
      month: {
        name: 'Month Format',
        desc: 'Format for month folders (e.g., MM, M, MMMM)',
      },
      week: {
        name: 'Week Format',
        desc: 'Format for week folders (e.g., W, WW, Wo)',
      },
    },
  },
};

export default english;
