import { TFile } from 'obsidian';
import { DailyNoteService } from '../DailyNoteService';
import { IFileSystem } from '../FileSystem';
import { IFolderStructureService } from '../FolderStructureService';
import { CoreDailyNotesSettings } from 'src/types';

// moment 모킹
jest.mock('obsidian', () => ({
  TFile: jest.requireActual('obsidian').TFile,
  moment: jest.requireActual('moment'),
}));

describe('DailyNoteService', () => {
  let service: DailyNoteService;
  let mockFileSystem: jest.Mocked<IFileSystem>;
  let mockFolderStructureService: jest.Mocked<IFolderStructureService>;
  let mockCoreDailyNotesSettings: CoreDailyNotesSettings;

  beforeEach(() => {
    mockFileSystem = {
      exists: jest.fn(),
      moveFile: jest.fn(),
      deleteFile: jest.fn(),
      getFile: jest.fn(),
      openFile: jest.fn(),
      createFolder: jest.fn(),
      openFileAndWaitUntilActive: jest.fn(),
    };

    mockFolderStructureService = {
      createFolderPath: jest.fn(),
      ensureFolderExists: jest.fn(),
    };

    mockCoreDailyNotesSettings = {
      format: 'YYYY-MM-DD',
      folder: 'Daily',
      template: '',
      autorun: false,
    };

    service = new DailyNoteService(
      mockFileSystem,
      mockFolderStructureService,
      mockCoreDailyNotesSettings,
    );
  });

  describe('handleDailyNoteCreation', () => {
    // 파일이 존재하지 않을 때 새로운 위치로 이동해야 함
    it('should move file to new location when file does not exist', async () => {
      const file = {
        basename: '2024-01-15',
        name: '2024-01-15.md',
        path: 'Daily/2024-01-15.md',
      } as TFile;

      mockFolderStructureService.createFolderPath.mockReturnValue('Daily/2024/01');
      mockFileSystem.exists.mockResolvedValue(false);

      await service.handleDailyNoteCreation(file);

      expect(mockFolderStructureService.ensureFolderExists).toHaveBeenCalledWith('Daily/2024/01');
      expect(mockFileSystem.moveFile).toHaveBeenCalledWith(
        'Daily/2024-01-15.md',
        'Daily/2024/01/2024-01-15.md',
      );
    });

    // 기존 파일을 올바르게 처리해야함
    it('should handle existing file correctly', async () => {
      const file = {
        basename: '2024-01-15',
        name: '2024-01-15.md',
        path: 'Daily/2024-01-15.md',
      } as TFile;

      const newPath = 'Daily/2024/01/2024-01-15.md';
      mockFolderStructureService.createFolderPath.mockReturnValue('Daily/2024/01');
      mockFileSystem.exists.mockResolvedValueOnce(true); // 새 경로에 파일이 존재
      mockFileSystem.exists.mockResolvedValueOnce(true); // 현재 경로에 파일이 존재
      mockFileSystem.getFile.mockResolvedValue(file);
      mockFileSystem.openFileAndWaitUntilActive.mockResolvedValue();

      await service.handleDailyNoteCreation(file);

      expect(mockFileSystem.exists).toHaveBeenCalledWith(newPath);
      expect(mockFileSystem.exists).toHaveBeenCalledWith(file.path);
      expect(mockFileSystem.deleteFile).toHaveBeenCalledWith(file.path);
      expect(mockFileSystem.openFileAndWaitUntilActive).toHaveBeenCalledWith(newPath);
    });

    // 날짜가 유효하지 않은 경우 파일을 이동하지 않아야 함
    it('should not move file if date is invalid', async () => {
      const file = {
        basename: 'invalid-date',
        name: 'invalid-date.md',
        path: 'Daily/invalid-date.md',
      } as TFile;

      await service.handleDailyNoteCreation(file);

      expect(mockFolderStructureService.createFolderPath).not.toHaveBeenCalled();
      expect(mockFileSystem.moveFile).not.toHaveBeenCalled();
    });
  });

  describe('folder structure tests', () => {
    const testCases = [
      {
        structure: 'year',
        date: '2024-01-15',
        expectedPath: 'Daily/2024/2024-01-15.md',
      },
      {
        structure: 'year/month',
        date: '2024-01-15',
        expectedPath: 'Daily/2024/01/2024-01-15.md',
      },
      {
        structure: 'year/month/week',
        date: '2024-01-15',
        expectedPath: 'Daily/2024/01/03/2024-01-15.md',
      },
    ];

    testCases.forEach(({ structure, date, expectedPath }) => {
      // 각 폴더 구조에 따라 올바른 경로로 파일이 이동되는지
      it(`should create correct folder structure for ${structure}`, async () => {
        const file = {
          basename: date,
          name: `${date}.md`,
          path: `Daily/${date}.md`,
        } as TFile;

        mockFolderStructureService.createFolderPath.mockReturnValue(
          expectedPath.replace(`/${date}.md`, ''),
        );
        mockFileSystem.exists.mockResolvedValue(false);

        await service.handleDailyNoteCreation(file);

        expect(mockFolderStructureService.ensureFolderExists).toHaveBeenCalledWith(
          expectedPath.replace(`/${date}.md`, ''),
        );
        expect(mockFileSystem.moveFile).toHaveBeenCalledWith(`Daily/${date}.md`, expectedPath);
      });
    });

    // 루트 폴더(/)에서 데일리 노트 생성 시 올바르게 처리되는지
    it('should handle root folder correctly', async () => {
      const file = {
        basename: '2024-01-15',
        name: '2024-01-15.md',
        path: '2024-01-15.md',
      } as TFile;

      mockCoreDailyNotesSettings.folder = '/';
      mockFolderStructureService.createFolderPath.mockReturnValue('2024/01');
      mockFileSystem.exists.mockResolvedValue(false);

      await service.handleDailyNoteCreation(file);

      expect(mockFolderStructureService.ensureFolderExists).toHaveBeenCalledWith('2024/01');
      expect(mockFileSystem.moveFile).toHaveBeenCalledWith(
        '2024-01-15.md',
        '2024/01/2024-01-15.md',
      );
    });

    // 사용자 정의 날짜 형식(DD-MM-YYYY)으로 설정된 경우 올바르게 처리되는지
    it('should handle custom date format correctly', async () => {
      const file = {
        basename: '15-01-2024', // DD-MM-YYYY format
        name: '15-01-2024.md',
        path: 'Daily/15-01-2024.md',
      } as TFile;

      mockCoreDailyNotesSettings.format = 'DD-MM-YYYY';
      mockFolderStructureService.createFolderPath.mockReturnValue('Daily/2024/01');
      mockFileSystem.exists.mockResolvedValue(false);

      await service.handleDailyNoteCreation(file);

      expect(mockFolderStructureService.ensureFolderExists).toHaveBeenCalledWith('Daily/2024/01');
      expect(mockFileSystem.moveFile).toHaveBeenCalledWith(
        'Daily/15-01-2024.md',
        'Daily/2024/01/15-01-2024.md',
      );
    });
  });
});
