import { App, Plugin, PluginSettingTab, Setting, TFile, moment } from 'obsidian';
import i18n from './i18n/i18n';
import { DailyNoteService } from 'src/services/DailyNoteService';
import { ObsidianFileSystem } from 'src/services/FileSystem';
import { FolderStructureService } from 'src/services/FolderStructureService';

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

export default class BetterDailyNotesPlugin extends Plugin {
  settings: BetterDailyNotesSettings;
  private dailyNoteService: DailyNoteService;

  async onload() {
    await this.loadSettings();

    const fileSystem = new ObsidianFileSystem(this.app);
    const folderStructureService = new FolderStructureService(this.settings, fileSystem);

    // 서비스 초기화
    this.dailyNoteService = new DailyNoteService(
      fileSystem,
      folderStructureService,
      await this.getCoreDailyNotesSettings(),
    );

    this.app.workspace.onLayoutReady(() => {
      this.registerEvent(
        this.app.vault.on('create', (file: TFile) => {
          this.dailyNoteService.handleDailyNoteCreation(file);
        }),
      );
    });

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

  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }

  async saveSettings() {
    await this.saveData(this.settings);
  }
}

class BetterDailyNotesSettingTab extends PluginSettingTab {
  plugin: BetterDailyNotesPlugin;

  constructor(app: App, plugin: BetterDailyNotesPlugin) {
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
