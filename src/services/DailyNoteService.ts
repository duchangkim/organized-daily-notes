import { TFile, moment } from 'obsidian';
import { IFileSystem } from 'src/services/FileSystem';
import { IFolderStructureService } from 'src/services/FolderStructureService';
import { CoreDailyNotesSettings } from 'src/types';

export interface IDailyNoteService {
  handleDailyNoteCreation(file: TFile): Promise<void>;
}

export class DailyNoteService implements IDailyNoteService {
  constructor(
    private fileSystem: IFileSystem,
    private folderStructureService: IFolderStructureService,
    private coreDailyNotesSettings: CoreDailyNotesSettings,
  ) {}

  async handleDailyNoteCreation(file: TFile): Promise<void> {
    const fileName = file.basename;
    const fileDate = moment(fileName, this.coreDailyNotesSettings.format, true);

    if (!fileDate.isValid()) {
      return;
    }

    const newFolderPath = this.folderStructureService.createFolderPath(
      fileDate,
      this.coreDailyNotesSettings.folder,
    );

    if (!newFolderPath) {
      return;
    }

    const newFilePath = `${newFolderPath}/${file.name}`;
    if (newFilePath === file.path) {
      return;
    }

    try {
      const exists = await this.fileSystem.exists(newFilePath);
      if (exists) {
        await this.handleExistingFile(file, newFilePath);
        return;
      }

      await this.folderStructureService.ensureFolderExists(newFolderPath);
      await this.fileSystem.moveFile(file.path, newFilePath);
    } catch (error) {
      console.error('Failed to move daily note:', error);
    }
  }

  private async handleExistingFile(file: TFile, existingPath: string): Promise<void> {
    try {
      const existingFile = await this.fileSystem.getFile(existingPath);
      if (!existingFile) {
        return;
      }

      if (await this.fileSystem.exists(file.path)) {
        await this.fileSystem.deleteFile(file.path);
      }

      await this.fileSystem.openFile(existingPath);
    } catch (error) {
      console.error('Failed to handle existing file:', error);
    }
  }
}
