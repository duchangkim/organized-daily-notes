import { App, Plugin, PluginSettingTab, Setting, TFile, moment } from 'obsidian';
import i18n from './i18n/i18n';

interface BetterDailyNotesSettings {
  folderStructure: 'year' | 'year/month' | 'year/month/week';
  yearFolderFormat: string;
  monthFolderFormat: string;
  weekFolderFormat: string;
}

const DEFAULT_SETTINGS: BetterDailyNotesSettings = {
  folderStructure: 'year/month',
  yearFolderFormat: 'YYYY',
  monthFolderFormat: 'MM',
  weekFolderFormat: 'W',
};

interface CoreDailyNotesSettings {
  autorun: boolean;
  template: string;
  folder: string;
  format: string;
}

export default class MyPlugin extends Plugin {
  settings: BetterDailyNotesSettings;

  async onload() {
    await this.loadSettings();

    // 'create' 이벤트는 vault가 오픈된 직후에도 호출되기 때문에 이를 무시하기 위해
    // 워크스페이스가 준비된 후에 이벤트 리스너 등록
    this.app.workspace.onLayoutReady(() => {
      this.registerEvent(
        this.app.vault.on('create', (file: TFile) => {
          console.log('created file', file);
          this.handleDailyNoteCreation(file);
        }),
      );
    });

    // 설정 탭 추가
    this.addSettingTab(new BetterDailyNotesSettingTab(this.app, this));
  }

  private async getCoreDailyNotesSettings(): Promise<CoreDailyNotesSettings> {
    const defaultCoreDailyNotesSettings: CoreDailyNotesSettings = {
      autorun: false,
      template: '',
      folder: '/',
      format: 'YYYY-MM-DD',
    };
    // daily-notes 플러그인 설정을 읽음
    const data = await this.app.vault.adapter.read('.obsidian/daily-notes.json');

    if (!data) {
      return defaultCoreDailyNotesSettings;
    }

    try {
      return {
        ...defaultCoreDailyNotesSettings,
        ...JSON.parse(data),
      };
    } catch {
      return defaultCoreDailyNotesSettings;
    }
  }

  private async handleDailyNoteCreation(file: TFile) {
    const coreDailyNotesSettings = await this.getCoreDailyNotesSettings();

    // 파일명이 데일리 노트 형식과 일치하는지 확인
    const fileName = file.basename;
    const fileDate = moment(fileName, coreDailyNotesSettings.format, true);

    if (!fileDate.isValid()) {
      return;
    }

    // 새로운 폴더 경로 생성
    const newFolderPath = this.createFolderPath(fileDate, coreDailyNotesSettings.folder);
    if (!newFolderPath) {
      return;
    }

    // 새 경로가 현재 경로와 다른 경우에만 이동
    const newFilePath = `${newFolderPath}/${file.name}`;
    if (newFilePath === file.path) {
      return;
    }

    try {
      // 이미 해당 경로에 파일이 존재하는지 확인
      const exists = await this.app.vault.adapter.exists(newFilePath);
      if (exists) {
        // 이미 존재하는 파일이면 현재 파일을 삭제하고 기존 파일로 이동
        const existingFile = this.app.vault.getAbstractFileByPath(newFilePath);
        if (existingFile instanceof TFile) {
          await this.app.vault.delete(file); // 현재 파일 삭제
          await this.app.workspace.getLeaf().openFile(existingFile); // 기존 파일로 이동
          return;
        }
      }

      // 폴더가 없으면 생성
      await this.ensureFolderExists(newFolderPath);
      // 파일 이동
      await this.app.fileManager.renameFile(file, newFilePath);
    } catch (error) {
      console.error('Failed to move daily note:', error);
    }
  }

  private createFolderPath(date: moment.Moment, rootFolder: string): string | null {
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

  private async ensureFolderExists(folderPath: string): Promise<void> {
    // 빈 경로나 '/' 경로는 처리가 필요없음
    if (!folderPath || folderPath === '/') {
      return;
    }

    // 경로 정규화: 중복 슬래시 제거 및 앞뒤 슬래시 처리
    const normalizedPath = folderPath
      .replace(/\/+/g, '/') // 중복 슬래시를 단일 슬래시로
      .replace(/^\//, '') // 시작 슬래시 제거
      .replace(/\/$/, ''); // 끝 슬래시 제거

    if (!normalizedPath) {
      return;
    }

    const folders = normalizedPath.split('/').filter(Boolean);
    let currentPath = '';

    for (const folder of folders) {
      // 폴더 이름이 비어있거나 유효하지 않은 문자가 있는지 확인
      if (!folder || /[<>:"|?*]/.test(folder)) {
        console.error(`Invalid folder name: ${folder}`);
        continue;
      }

      currentPath += (currentPath ? '/' : '') + folder;
      try {
        if (!(await this.app.vault.adapter.exists(currentPath))) {
          await this.app.vault.createFolder(currentPath);
        }
      } catch (error) {
        console.error(`Failed to create folder: ${currentPath}`, error);
        throw new Error(`Failed to create folder structure: ${error.message}`);
      }
    }
  }

  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }

  async saveSettings() {
    await this.saveData(this.settings);
  }
}

class BetterDailyNotesSettingTab extends PluginSettingTab {
  plugin: MyPlugin;

  constructor(app: App, plugin: MyPlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  private createFormatPreview(format: string): HTMLSpanElement {
    const today = moment();
    const formatted = today.format(format);

    return createEl('strong', {
      text: `→ ${formatted}`,
      attr: {
        style: 'color: var(--text-accent); margin-left: 10px; font-size: 0.9em; font-weight: bold',
      },
    });
  }

  private createFormatSetting(
    containerEl: HTMLElement,
    key: 'year' | 'month' | 'week',
    settingKey: keyof Omit<BetterDailyNotesSettings, 'folderStructure'>,
    placeholder: string,
  ): void {
    const setting = new Setting(containerEl)
      .setName(i18n.t(`settings.folderFormat.${key}.name`))
      .setDesc(i18n.t(`settings.folderFormat.${key}.desc`));

    const previewEl = this.createFormatPreview(
      this.plugin.settings[settingKey] || DEFAULT_SETTINGS[settingKey],
    );
    setting.descEl.appendChild(previewEl);

    setting.addText((text) =>
      text
        .setPlaceholder(placeholder)
        .setValue(this.plugin.settings[settingKey])
        .onChange(async (value) => {
          this.plugin.settings[settingKey] = value;
          await this.plugin.saveSettings();
          previewEl.textContent = `→ ${moment().format(value ? value : DEFAULT_SETTINGS[settingKey])}`;
        }),
    );
  }

  display(): void {
    const { containerEl } = this;
    containerEl.empty();

    containerEl.createEl('h2', { text: i18n.t('settings.title') });

    // 폴더 구조 선택
    new Setting(containerEl)
      .setName(i18n.t('settings.folderStructure.name'))
      .setDesc(i18n.t('settings.folderStructure.desc'))
      .addDropdown((dropdown) =>
        dropdown
          .addOption('year', i18n.t('settings.folderStructure.options.year'))
          .addOption('year/month', i18n.t('settings.folderStructure.options.yearMonth'))
          .addOption('year/month/week', i18n.t('settings.folderStructure.options.yearMonthWeek'))
          .setValue(this.plugin.settings.folderStructure)
          .onChange(async (value: BetterDailyNotesSettings['folderStructure']) => {
            this.plugin.settings.folderStructure = value;
            await this.plugin.saveSettings();
          }),
      );

    // 폴더 형식 설정 섹션
    containerEl.createEl('h2', {
      text: i18n.t('settings.folderFormat.title'),
      attr: { style: 'margin-bottom: 0' },
    });

    const descEl = containerEl.createEl('p', {
      text: i18n.t('settings.folderFormat.desc') + ' ',
      cls: 'setting-item-description',
      attr: { style: 'margin-top: 0;' },
    });

    descEl.createEl('a', {
      text: i18n.t('settings.folderFormat.momentDocsLink'),
      href: 'https://momentjs.com/docs/#/displaying/format/',
      attr: {
        target: '_blank',
        rel: 'noopener',
      },
    });

    this.createFormatSetting(containerEl, 'year', 'yearFolderFormat', 'YYYY');
    this.createFormatSetting(containerEl, 'month', 'monthFolderFormat', 'MM');
    this.createFormatSetting(containerEl, 'week', 'weekFolderFormat', 'W');
  }
}
