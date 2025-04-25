# [DEPRECATED] Organized Daily Notes

> **Notice:** This plugin is now deprecated. The core Obsidian Daily Notes plugin already supports folder organization through format strings. Please use the core plugin instead.

_Read this in other languages: [한국어](README.ko.md)_

## Why deprecated?

After further investigation, I discovered that Obsidian's core Daily Notes plugin already supports folder organization through its format string. You can achieve the same functionality by using format strings like:

- `YYYY/MM/DD` for Year/Month structure
- `YYYY/MM/W/DD` for Year/Month/Week structure

This means this plugin's core functionality is redundant with what's already available in Obsidian.

## Migration Guide

1. Disable and uninstall this plugin
2. Go to Obsidian Settings → Core plugins → Daily notes
3. In the "Date format" field, use patterns like:
   - `YYYY/MM/DD` - Creates Year/Month folders automatically
   - `YYYY/MM/W/DD` - Creates Year/Month/Week folders automatically
4. Your daily notes will now be organized using Obsidian's built-in functionality

## Archive Notice

This repository will remain available for reference but will no longer be actively maintained.

Thank you to everyone who used and supported this plugin!

---

## Original Description

Automatically organizes your daily notes into customizable folder structures for enhanced organization and easier navigation.

## Features

- **Automatic Organization**: Daily notes are automatically moved to the appropriate folders based on their creation date
- **Flexible Structure**: Choose between Year, Year/Month, or Year/Month/Week folder structures
- **Customizable Format**: Customize the format of year, month, and week folder names using Moment.js patterns
- **Core Integration**: Works seamlessly with Obsidian's core Daily Notes plugin

## Usage

1. Install the plugin from Obsidian's Community Plugins
2. Enable the plugin in Settings → Community plugins
3. Configure your preferred folder structure in the plugin settings:
   - Year only (YYYY)
   - Year/Month (YYYY/MM)
   - Year/Month/Week (YYYY/MM/Week-N)

## Configuration

The plugin provides several settings to customize your folder structure:

- **Folder Structure**: Choose how your daily notes are organized
- **Year Format**: Customize the year folder format (e.g., YYYY, YY)
- **Month Format**: Customize the month folder format (e.g., MM, MMMM)
- **Week Format**: Customize the week folder format (e.g., W, WW)

## Installation

1. Open Obsidian Settings
2. Navigate to Community Plugins and disable Safe Mode
3. Click Browse and search for "Organized Daily Notes"
4. Install and enable the plugin

## Support

If you encounter any issues or have suggestions, please [create an issue](https://github.com/duchangkim/organized-daily-notes/issues) on GitHub.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
