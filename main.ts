import { App, Plugin, PluginSettingTab, Setting, TFile } from 'obsidian';
import i18n from './i18n/i18n';
import { DailyNoteService } from 'src/services/DailyNoteService';
import { ObsidianFileSystem } from 'src/services/FileSystem';
import { FolderStructureService } from 'src/services/FolderStructureService';

interface OrganizedDailyNotesSettings {
  folderStructure: 'year' | 'year/month' | 'year/month/week';
  yearFolderFormat: string;
  monthFolderFormat: string;
  weekFolderFormat: string;
}

const DEFAULT_SETTINGS: OrganizedDailyNotesSettings = {
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

export default class OrganizedDailyNotesPlugin extends Plugin {
  settings: OrganizedDailyNotesSettings;
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

    this.addSettingTab(new OrganizedDailyNotesSettingTab(this.app, this));
  }

  private async getCoreDailyNotesSettings(): Promise<CoreDailyNotesSettings> {
    const defaultCoreDailyNotesSettings: CoreDailyNotesSettings = {
      autorun: false,
      template: '',
      folder: '/',
      format: 'YYYY-MM-DD',
    };

    try {
      // configDir을 사용하여 설정 파일 경로 구성
      const data = await this.app.vault.adapter.read(
        `${this.app.vault.configDir}/daily-notes.json`,
      );

      if (!data) {
        return defaultCoreDailyNotesSettings;
      }

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

class OrganizedDailyNotesSettingTab extends PluginSettingTab {
  plugin: OrganizedDailyNotesPlugin;

  constructor(app: App, plugin: OrganizedDailyNotesPlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  private createFormatSetting(
    containerEl: HTMLElement,
    key: 'year' | 'month' | 'week',
    settingKey: keyof Omit<OrganizedDailyNotesSettings, 'folderStructure'>,
    placeholder: string,
  ): void {
    const setting = new Setting(containerEl)
      .setName(i18n.t(`settings.folderFormat.${key}.name`))
      .setDesc(i18n.t(`settings.folderFormat.${key}.desc`));

    const sampleEl = createEl('span', { cls: 'format-preview' });
    setting.descEl.appendChild(sampleEl);

    setting.addMomentFormat((format) =>
      format
        .setPlaceholder(placeholder)
        .setValue(this.plugin.settings[settingKey])
        .setSampleEl(sampleEl)
        .onChange(async (value) => {
          this.plugin.settings[settingKey] = value;
          await this.plugin.saveSettings();
        }),
    );
  }

  display(): void {
    const { containerEl } = this;
    containerEl.empty();

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
          .onChange(async (value: OrganizedDailyNotesSettings['folderStructure']) => {
            this.plugin.settings.folderStructure = value;
            await this.plugin.saveSettings();
          }),
      );

    // 폴더 형식 설정 섹션
    new Setting(containerEl).setName(i18n.t('settings.folderFormat.title')).setHeading();

    const descEl = containerEl.createEl('p', {
      text: i18n.t('settings.folderFormat.desc') + ' ',
      cls: 'setting-item-description format-section-description',
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
