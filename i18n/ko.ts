import { LocaleStrings } from './types';

const korean: LocaleStrings = {
  settings: {
    title: 'Better Daily Notes 설정',
    folderStructure: {
      name: '폴더 구조',
      desc: '데일리 노트의 폴더 구조를 선택합니다',
      options: {
        year: '연도만 (YYYY)',
        yearMonth: '연도/월 (YYYY/MM)',
        yearMonthWeek: '연도/월/주 (YYYY/MM/Week-N)',
      },
    },
    folderDateFormat: {
      name: '폴더 날짜 형식',
      desc: '폴더명에 사용될 날짜 형식을 지정합니다.',
    },
  },
};

export default korean;
