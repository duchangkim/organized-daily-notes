export interface OrganizedDailyNotesSettings {
  folderStructure: 'year' | 'year/month' | 'year/month/week';
  yearFolderFormat: string;
  monthFolderFormat: string;
  weekFolderFormat: string;
}

export interface CoreDailyNotesSettings {
  autorun: boolean;
  template: string;
  folder: string;
  format: string;
}
