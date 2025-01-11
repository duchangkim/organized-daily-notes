// TFile 클래스 모킹
export class TFile {
  constructor(
    public basename: string,
    public name: string,
    public path: string,
  ) {}
}

// moment 모킹
jest.mock('moment', () => {
  const actualMoment = jest.requireActual('moment');
  return actualMoment;
});

export { default as moment } from 'moment';
