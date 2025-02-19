import { IFileSystem } from 'src/services/FileSystem';
import { OrganizedDailyNotesSettings } from 'src/types';

type Moment = moment.Moment;

export interface IFolderStructureService {
  createFolderPath(date: Moment, rootFolder: string): string | null;
  ensureFolderExists(folderPath: string): Promise<void>;
}

export class FolderStructureService implements IFolderStructureService {
  constructor(
    private settings: OrganizedDailyNotesSettings,
    private fileSystem: IFileSystem,
  ) {}

  createFolderPath(date: Moment, rootFolder: string): string | null {
    const { folderStructure, yearFolderFormat, monthFolderFormat, weekFolderFormat } =
      this.settings;

    try {
      const yearFolder = date.format(yearFolderFormat);
      const monthFolder = date.format(monthFolderFormat);
      const weekFolder = date.format(weekFolderFormat);

      const basePath = rootFolder === '/' ? '' : rootFolder;

      switch (folderStructure) {
        case 'year':
          return `${basePath}/${yearFolder}`;
        case 'year/month':
          return `${basePath}/${yearFolder}/${monthFolder}`;
        case 'year/month/week':
          return `${basePath}/${yearFolder}/${monthFolder}/${weekFolder}`;
        default:
          return null;
      }
    } catch (error) {
      console.error('Failed to create folder path:', error);
      return null;
    }
  }

  async ensureFolderExists(folderPath: string): Promise<void> {
    if (!folderPath || folderPath === '/') {
      return;
    }

    const normalizedPath = this.normalizePath(folderPath);
    if (!normalizedPath) {
      return;
    }

    const folders = normalizedPath.split('/').filter(Boolean);
    let currentPath = '';

    for (const folder of folders) {
      if (!this.isValidFolderName(folder)) {
        throw new Error(`Invalid folder name: ${folder}`);
      }

      currentPath += (currentPath ? '/' : '') + folder;
      if (!(await this.fileSystem.exists(currentPath))) {
        await this.fileSystem.createFolder(currentPath);
      }
    }
  }

  private normalizePath(path: string): string {
    return path.replace(/\/+/g, '/').replace(/^\//, '').replace(/\/$/, '');
  }

  private isValidFolderName(name: string): boolean {
    return Boolean(name) && !/[<>:"|?*]/.test(name);
  }
}
