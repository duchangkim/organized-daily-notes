import { App, Plugin, PluginSettingTab, Setting, TFile } from 'obsidian';

// Remember to rename these classes and interfaces!

interface BetterDailyNotesSettings {
  folderStructure: 'year' | 'year/month' | 'year/month/week';
  folderDateFormat: string;
}

const DEFAULT_SETTINGS: BetterDailyNotesSettings = {
  folderStructure: 'year/month',
  folderDateFormat: 'YYYY/MM',
};

interface LocaleStrings {
  settings: {
    title: string;
    folderStructure: {
      name: string;
      desc: string;
      options: {
        year: string;
        yearMonth: string;
        yearMonthWeek: string;
      };
    };
    folderDateFormat: {
      name: string;
      desc: string;
    };
  };
}

export default class MyPlugin extends Plugin {
  settings: BetterDailyNotesSettings;
  i18n: LocaleStrings;

  async onload() {
    await this.loadSettings();
    await this.loadLocale();

    // 데일리 노트 생성 시 폴더 구조를 관리하는 이벤트 리스너 등록
    this.registerEvent(
      this.app.vault.on('create', (file) => {
        // 데일리 노트가 생성될 때 폴더 구조에 맞게 이동
        this.handleDailyNoteCreation(file);
      }),
    );

    // 설정 탭 추가
    this.addSettingTab(new BetterDailyNotesSettingTab(this.app, this));
  }

  private async handleDailyNoteCreation(file: TFile) {
    // 데일리 노트인지 확인하고 폴더 구조에 맞게 이동하는 로직 구현
  }

  onunload() {}

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

    new Setting(containerEl)
      .setName(i18n.settings.folderDateFormat.name)
      .setDesc(i18n.settings.folderDateFormat.desc)
      .addText((text) =>
        text
          .setPlaceholder('YYYY-MM')
          .setValue(this.plugin.settings.folderDateFormat)
          .onChange(async (value) => {
            this.plugin.settings.folderDateFormat = value;
            await this.plugin.saveSettings();
          }),
      );
  }
}
