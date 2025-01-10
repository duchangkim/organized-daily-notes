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
    folderDateFormat: {
      name: 'Folder Date Format',
      desc: 'Set the date format for folder names (Moment.js format)',
    },
  },
};

export default english;
