import { LocaleStrings } from 'i18n/types';
import { App, Plugin, PluginSettingTab, Setting, TFile, moment } from 'obsidian';

// Remember to rename these classes and interfaces!

interface BetterDailyNotesSettings {
  folderStructure: 'year' | 'year/month' | 'year/month/week';
  folderDateFormat: string;
}

const DEFAULT_SETTINGS: BetterDailyNotesSettings = {
  folderStructure: 'year/month',
  folderDateFormat: 'YYYY/MM',
};

interface CoreDailyNotesSettings {
  autorun: boolean;
  template: string;
  folder: string;
  format: string;
}

export default class MyPlugin extends Plugin {
  settings: BetterDailyNotesSettings;
  i18n: LocaleStrings;

  async onload() {
    await this.loadSettings();
    await this.loadLocale();

    // 워크스페이스가 준비된 후에 이벤트 리스너 등록
    this.app.workspace.onLayoutReady(() => {
      this.registerEvent(
        this.app.vault.on('create', (file) => {
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
    // data.json에서 daily-notes 플러그인 설정을 읽음
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

    // 파일이 데일리 노트 폴더 내에 있는지 확인
    const isInRootFolder = coreDailyNotesSettings.folder === '/';
    const isInDailyNotesFolder = isInRootFolder
      ? !file.path.startsWith('/') // 루트 폴더인 경우 경로가 '/'로 시작하지 않아야 함
      : file.path.startsWith(`${coreDailyNotesSettings.folder}/`); // 아닌 경우 지정된 폴더 경로로 시작해야 함

    if (!isInDailyNotesFolder) {
      return;
    }

    // 파일명이 데일리 노트 형식과 일치하는지 확인
    const fileName = file.basename;
    const fileDate = moment(fileName, coreDailyNotesSettings.format, true);

    if (!fileDate.isValid()) {
      return;
    }

    // 여기서부터 폴더 구조 변경 로직 구현
    console.log('Daily note created:', file.path);
    // TODO: 설정된 폴더 구조에 따라 파일 이동
    // this.settings.
  }

  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }

  async saveSettings() {
    await this.saveData(this.settings);
  }

  async loadLocale() {
    const locale = window.localStorage.getItem('language') || 'en';
    try {
      if (locale === 'ko') {
        const module = await import('./i18n/ko');
        this.i18n = module.default;
      } else {
        const module = await import('./i18n/en');
        this.i18n = module.default;
      }
    } catch (error) {
      console.error('Failed to load locale:', error);
      // 로케일 로드 실패시 영어를 기본값으로 사용
      const module = await import('./i18n/en');
      this.i18n = module.default;
    }
  }
}

class BetterDailyNotesSettingTab extends PluginSettingTab {
  plugin: MyPlugin;

  constructor(app: App, plugin: MyPlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display(): void {
    const { containerEl } = this;
    const { i18n } = this.plugin;
    containerEl.empty();

    containerEl.createEl('h2', { text: i18n.settings.title });

    new Setting(containerEl)
      .setName(i18n.settings.folderStructure.name)
      .setDesc(i18n.settings.folderStructure.desc)
      .addDropdown((dropdown) =>
        dropdown
          .addOption('year', i18n.settings.folderStructure.options.year)
          .addOption('year/month', i18n.settings.folderStructure.options.yearMonth)
          .addOption('year/month/week', i18n.settings.folderStructure.options.yearMonthWeek)
          .setValue(this.plugin.settings.folderStructure)
          .onChange(async (value: 'year' | 'year/month' | 'year/month/week') => {
            this.plugin.settings.folderStructure = value;
            await this.plugin.saveSettings();
          }),
      );
  }
}
