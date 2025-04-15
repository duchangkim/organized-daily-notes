import { App, TFile } from 'obsidian';

declare module 'obsidian' {
  interface App {
    commands: {
      executeCommandById(id: string): Promise<void>;
    };
  }
}

export interface IFileSystem {
  exists(path: string): Promise<boolean>;
  moveFile(oldPath: string, newPath: string): Promise<void>;
  deleteFile(path: string): Promise<void>;
  getFile(path: string): Promise<TFile | null>;
  openFile(path: string): Promise<void>;
  createFolder(path: string): Promise<void>;
  openFileAndWaitUntilActive(path: string): Promise<void>;
}

export class ObsidianFileSystem implements IFileSystem {
  constructor(private app: App) {}

  async exists(path: string): Promise<boolean> {
    return this.app.vault.adapter.exists(path);
  }

  async moveFile(oldPath: string, newPath: string): Promise<void> {
    const file = this.app.vault.getAbstractFileByPath(oldPath);
    if (file instanceof TFile) {
      await this.app.fileManager.renameFile(file, newPath);
    }
  }

  async deleteFile(path: string): Promise<void> {
    const file = this.app.vault.getAbstractFileByPath(path);
    if (file instanceof TFile) {
      await this.app.fileManager.trashFile(file);
    }
  }

  async getFile(path: string): Promise<TFile | null> {
    const file = this.app.vault.getAbstractFileByPath(path);
    return file instanceof TFile ? file : null;
  }

  async openFile(path: string): Promise<void> {
    const file = await this.getFile(path);
    if (file) {
      await this.app.workspace.getLeaf().openFile(file);
    }
  }

  async createFolder(path: string): Promise<void> {
    await this.app.vault.createFolder(path);
  }

  async openFileAndWaitUntilActive(path: string): Promise<void> {
    const file = await this.getFile(path);

    if (!file) {
      return;
    }

    const MAX_ATTEMPTS = 200; // 약 3.2초
    let fileId: number | null = null;
    let attempts = 0;

    return new Promise<void>((resolve, reject) => {
      const leaf = this.app.workspace.getLeaf();

      const openAndCheck = async () => {
        try {
          await leaf.openFile(file);
          const activeFile = this.app.workspace.getActiveFile();

          if (activeFile && activeFile.path === path) {
            await this.app.commands.executeCommandById('file-explorer:reveal-active-file');

            resolve();
            return;
          }

          if (++attempts > MAX_ATTEMPTS) {
            throw new Error('Failed to activate file: timeout');
          }

          fileId = requestAnimationFrame(openAndCheck);
        } catch (error) {
          reject(error);
        }
      };

      openAndCheck();
    }).finally(() => {
      if (fileId) {
        cancelAnimationFrame(fileId);
      }
    });
  }
}
