import { LocaleStrings } from 'i18n/types';
import { App, Plugin, PluginSettingTab, Setting, TFile, moment } from 'obsidian';

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
      .setName(this.plugin.i18n.settings.folderFormat[key].name)
      .setDesc(this.plugin.i18n.settings.folderFormat[key].desc);

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
    const { i18n } = this.plugin;
    containerEl.empty();

    containerEl.createEl('h2', { text: i18n.settings.title });

    // 폴더 구조 선택
    new Setting(containerEl)
      .setName(i18n.settings.folderStructure.name)
      .setDesc(i18n.settings.folderStructure.desc)
      .addDropdown((dropdown) =>
        dropdown
          .addOption('year', i18n.settings.folderStructure.options.year)
          .addOption('year/month', i18n.settings.folderStructure.options.yearMonth)
          .addOption('year/month/week', i18n.settings.folderStructure.options.yearMonthWeek)
          .setValue(this.plugin.settings.folderStructure)
          .onChange(async (value: BetterDailyNotesSettings['folderStructure']) => {
            this.plugin.settings.folderStructure = value;
            await this.plugin.saveSettings();
          }),
      );

    // 폴더 형식 설정 섹션
    containerEl.createEl('h2', {
      text: i18n.settings.folderFormat.title,
      attr: { style: 'margin-bottom: 0' },
    });

    const descEl = containerEl.createEl('p', {
      text: i18n.settings.folderFormat.desc + ' ',
      cls: 'setting-item-description',
      attr: { style: 'margin-top: 0;' },
    });

    descEl.createEl('a', {
      text: i18n.settings.folderFormat.momentDocsLink,
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
