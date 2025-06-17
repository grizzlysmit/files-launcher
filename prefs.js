/* prefs.js
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 2 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 *
 * SPDX-License-Identifier: GPL-2.0-or-later
 */
"use strict";

import Adw from 'gi://Adw';
import GObject from 'gi://GObject';
import {ExtensionPreferences, gettext as _} from 'resource:///org/gnome/Shell/Extensions/js/extensions/prefs.js';
import Gtk from 'gi://Gtk';
import Gio from 'gi://Gio';
import GLib from 'gi://GLib';
import Gdk from 'gi://Gdk';
import * as Constants from './icon_constants.js';

import * as Config from 'resource:///org/gnome/Shell/Extensions/js/misc/config.js';
import * as LogMessage from './log_message.js';

class PageBase extends Adw.PreferencesPage {
    static {
        GObject.registerClass(this);
    }

    constructor(caller, title_, name_, icon_name_) {
        super({
            title: title_,
        });
        this._caller = caller;
        this.set_name(name_);
        if(icon_name_){
            this.set_icon_name(icon_name_);
        }
        this._title = title_;
        this._name  = name_;
        this._icon_name = icon_name_;
    } // constructor(caller, _title, _name, _icon_name) //

    _close_button(){
        const close_button = new Gtk.Button({
            label: _("Exit Settings"),
            css_classes: ["suggested-action"],
            valign: Gtk.Align.CENTER,
        });
        close_button.connect("clicked", () => { this._caller._close_request(this._caller._window); });
        return close_button;
    } // _close_button() //

    _close_row(){
        const title = "";
        const row = new Adw.ActionRow({ title });
        row.set_subtitle("");
        const close_button = this._close_button();
        row.add_suffix(close_button);
        row.activatable_widget = close_button;

        return row;
    } // _close_row() //

} // class PageBase extends Adw.PreferencesPage //

// Icon Stuff //

Gio._promisify(Gtk.FileDialog.prototype, "open", "open_finish");
class IconGrid extends Gtk.FlowBox {
    static {
        GObject.registerClass(this);
    }

    constructor() {
        super({
            row_spacing: 10,
            column_spacing: 10,
            vexpand: false,
            hexpand: true,
            valign: Gtk.Align.START,
            halign: Gtk.Align.CENTER,
            homogeneous: true,
            selection_mode: Gtk.SelectionMode.SINGLE,
            margin_top: 5,
        });
        this.childrenCount = 0;
    }

    add(widget) {
        this.insert(widget, -1);
        this.childrenCount++;
    }
}

class FilesIconsPage extends PageBase {
    static {
        GObject.registerClass(this);
    }

    constructor(caller, title_, name_, icon_name_) {
        super(caller, title_, name_, icon_name_);
        this._settings = this._caller._window._settings;
        this.set_title(this._title);
        this.set_name(this._name);
        this.set_icon_name(this._icon_name);

        const monochromeIconGroup = new Adw.PreferencesGroup({
            title: _('Monochrome Icons'),
        });

        const colouredIconGroup = new Adw.PreferencesGroup({
            title: _('Coloured Icons'),
        });

        const iconSettingsGroup = new Adw.PreferencesGroup({
            title: _('Icon Settings'),
        });

        // Monochrome Icons

        const monochromeIconsRow = new Adw.ActionRow();

        const monochromeIconsFlowBox = new IconGrid();
        monochromeIconsFlowBox.connect('child-activated', () => {
            const selectedChild = monochromeIconsFlowBox.get_selected_children();
            const selectedChildIndex = selectedChild[0].get_index();
            this._settings.set_boolean('monochrome-icon', true);
            this._settings.set_int('menu-button-icon-image', selectedChildIndex);
            this._settings.set_boolean('use-custom-icon', false);
        });
        Constants.MonochromeFileIcons.forEach(icon => {
            let iconName = icon.PATH.replace('/Resources/', '');
            iconName = iconName.replace('.svg', '');
            const iconImage = new Gtk.Image({
                icon_name: iconName,
                pixel_size: 36,
            });
            monochromeIconsFlowBox.add(iconImage);
        });

        monochromeIconsRow.set_child(monochromeIconsFlowBox);

        if (this._settings.get_boolean('monochrome-icon')) {
            const monochromeChildren = monochromeIconsFlowBox.childrenCount;
            for (let i = 0; i < monochromeChildren; i++) {
                if (i === this._settings.get_int('menu-button-icon-image')) {
                    monochromeIconsFlowBox.select_child(monochromeIconsFlowBox.get_child_at_index(i));
                    break;
                }
            }
        }

        // Coloured Icons

        const colouredIconsRow = new Adw.ActionRow();

        const colouredIconsFlowBox = new IconGrid();
        colouredIconsFlowBox.connect('child-activated', () => {
            const selectedChild = colouredIconsFlowBox.get_selected_children();
            const selectedChildIndex = selectedChild[0].get_index();
            this._settings.set_int('menu-button-icon-image', selectedChildIndex);
            this._settings.set_boolean('monochrome-icon', false);
            this._settings.set_boolean('use-custom-icon', false);
        });
        Constants.ColouredFileIcons.forEach(icon => {
            let iconName = icon.PATH.replace('/Resources/', '');
            iconName = iconName.replace('.svg', '');
            const iconImage = new Gtk.Image({
                icon_name: iconName,
                pixel_size: 36,
            });
            colouredIconsFlowBox.add(iconImage);
        });

        colouredIconsRow.set_child(colouredIconsFlowBox);

        if (!this._settings.get_boolean('monochrome-icon')) {
            const children = colouredIconsFlowBox.childrenCount;
            for (let i = 0; i < children; i++) {
                if (i === this._settings.get_int('menu-button-icon-image')) {
                    colouredIconsFlowBox.select_child(colouredIconsFlowBox.get_child_at_index(i));
                    break;
                }
            }
        }

        // Icon Size Scale

        const menuButtonIconSizeRow = new Adw.ActionRow({
            title: _('Icon Size'),
        });

        const iconSize = this._settings.get_int('menu-button-icon-size');

        const menuButtonIconSizeScale = new Gtk.Scale({
            orientation: Gtk.Orientation.HORIZONTAL,
            adjustment: new Gtk.Adjustment({
                lower: 14,
                upper: 64,
                step_increment: 1,
                page_increment: 1,
                page_size: 0,
            }),
            digits: 0,
            round_digits: 0,
            hexpand: true,
            draw_value: true,
            value_pos: Gtk.PositionType.RIGHT,
        });

        menuButtonIconSizeScale.set_format_value_func((scale, value) => {
            return `\t${value}px`;
        });

        menuButtonIconSizeScale.set_value(iconSize);
        menuButtonIconSizeScale.connect('value-changed', () => {
            this._settings.set_int('menu-button-icon-size', menuButtonIconSizeScale.get_value());
        });

        menuButtonIconSizeRow.add_suffix(menuButtonIconSizeScale);

         // Icon Shadow Visibility //
        const iconShadowVisibilityRow = new Adw.ActionRow({
            title: _('Hide Icon Shadow'),
        });

        const iconShadowRowVisiblitySwitch = new Gtk.Switch({
            valign: Gtk.Align.CENTER,
            active: this._settings.get_boolean('hide-icon-shadow'),
        });

        iconShadowRowVisiblitySwitch.connect('notify::active', widget => {
            this._settings.set_boolean('hide-icon-shadow', widget.get_active());
        });

        iconShadowVisibilityRow.add_suffix(iconShadowRowVisiblitySwitch);

        // Custom Icon //

        const customIconRow = new Adw.ExpanderRow({
            title: _('Use Custom Icon'),
            show_enable_switch: true,
            enable_expansion: this._settings.get_boolean('use-custom-icon'),
        });

        customIconRow.connect('notify::enable-expansion', () => {
            this._settings.set_boolean('use-custom-icon', customIconRow.enable_expansion);
            this._caller.log_message(
                LogMessage.get_prog_id(),
                `FilesIconsPage::notify::enable-expansion: customIconRow.enable_expansion == ${customIconRow.enable_expansion}`,
                new Error()
            );
        });

        this._settings.connect('changed::use-custom-icon', () => {
            const useCustomIcon = this._settings.get_boolean('use-custom-icon');
            customIconRow.set_enable_expansion(useCustomIcon)
            this._caller.log_message(
                LogMessage.get_prog_id(), `FilesIconsPage::changed::use-custom-icon: useCustomIcon == ${useCustomIcon}`, new Error()
            );
        });

        const customIconSelectionRow = new Adw.ActionRow({
            title: _('Selected Icon'),
        });

        const customIconButton = new Gtk.Button({
            icon_name: 'document-open-symbolic',
            valign: Gtk.Align.CENTER,
        });

        this._caller.log_message(
            LogMessage.get_prog_id(), `FilesIconsPage::constructor: customIconButton == ${customIconButton}`, new Error()
        );

        const customIconPreview = new Gtk.Image({
            icon_name: "start-here-symbolic",
            icon_size: Gtk.IconSize.LARGE,
        });

        this._caller.log_message(
            LogMessage.get_prog_id(), `FilesIconsPage::constructor: customIconPreview == ${customIconPreview}`, new Error()
        );

        if(this._settings.get_string('custom-icon-path')){
            const custpath = this._settings.get_string('custom-icon-path');
            customIconPreview.set_from_file(custpath);

            this._caller.log_message(LogMessage.get_prog_id(), `FilesIconsPage::constructor: custpath == ${custpath}`, new Error());
        }

        customIconButton.connect('clicked', async () => {
            try {
                const filter = new Gtk.FileFilter({
                    name: "Images",
                });
                this._caller.log_message(
                    LogMessage.get_prog_id(), `FilesIconsPage::clicked: filter == ${filter}`, new Error()
                );

                filter.add_pixbuf_formats();
                this._caller.log_message(
                    LogMessage.get_prog_id(), `FilesIconsPage::clicked: filter == ${filter}`, new Error()
                );

                const fileDialog = new Gtk.FileDialog({
                    title: _('Select a Custom Icon'),
                    modal: true,
                    default_filter: filter
                });
                this._caller.log_message(LogMessage.get_prog_id(), `FilesIconsPage::clicked: fileDialog == ${fileDialog}`, new Error());

                const file = await fileDialog.open(customIconButton.get_root(), null);
                this._caller.log_message(LogMessage.get_prog_id(), `FilesIconsPage::clicked: file == ${file}`, new Error());
                if (file) {
                    const filename = file.get_path();
                    this._settings.set_string("custom-icon-path", filename);
                    customIconPreview.set_from_file(filename);
                    this._caller.log_message(LogMessage.get_prog_id(), `FilesIconsPage::clicked: filename == ${filename}`, new Error());
                }
            } catch (error) {
                this._caller.log_message(LogMessage.get_prog_id(), `FilesIconsPage::clicked: file == ${error}`, error);
                console.error('files-launcher::Error selecting custom icon:', error.message);
            }
        });

        customIconSelectionRow.add_suffix(customIconPreview);
        customIconSelectionRow.add_suffix(customIconButton);
        customIconRow.add_row(customIconSelectionRow);

        // iconGroup
        monochromeIconGroup.add(monochromeIconsRow);
        colouredIconGroup.add(colouredIconsRow);
        iconSettingsGroup.add(customIconRow);
        iconSettingsGroup.add(menuButtonIconSizeRow);
        iconSettingsGroup.add(iconShadowVisibilityRow);
        iconSettingsGroup.add(this._close_row());

        this.add(monochromeIconGroup);
        this.add(colouredIconGroup);
        this.add(iconSettingsGroup);
    }
} // class FilesIconsPage extends PageBase //

class AboutPage extends Adw.PreferencesPage {
    static {
        GObject.registerClass(this);
    }

    constructor(caller, metadata){
        super({
            title: _('About'),
            icon_name: 'help-about-symbolic',
            name: 'AboutPage',
        });
        this._caller = caller;
        
        const PROJECT_TITLE = _('Launch files from a menu.');
        const PROJECT_DESCRIPTION = _('A menu full of files to launch 🤠.');

        // Project Logo, title, description-------------------------------------
        const projectHeaderGroup = new Adw.PreferencesGroup();
        const projectHeaderBox = new Gtk.Box({
            orientation: Gtk.Orientation.VERTICAL,
            hexpand: false,
            vexpand: false,
        });

        const projectTitleLabel = new Gtk.Label({
            label: _(PROJECT_TITLE),
            css_classes: ['title-1'],
            vexpand: true,
            valign: Gtk.Align.FILL,
        });

        const projectDescriptionLabel = new Gtk.Label({
            label: _(PROJECT_DESCRIPTION),
            hexpand: false,
            vexpand: false,
        });
        projectHeaderBox.append(projectTitleLabel);
        projectHeaderBox.append(projectDescriptionLabel);
        projectHeaderGroup.add(projectHeaderBox);

        this.add(projectHeaderGroup);
        // -----------------------------------------------------------------------

        // Extension/OS Info and Links Group------------------------------------------------
        const infoGroup = new Adw.PreferencesGroup();

        const projectVersionRow = new Adw.ActionRow({
            title: _('Files with history Version'),
        });
        projectVersionRow.add_suffix(new Gtk.Label({
            label: metadata.version.toString(),
            css_classes: ['dim-label'],
        }));
        infoGroup.add(projectVersionRow);

        if (metadata.commit) {
            const commitRow = new Adw.ActionRow({
                title: _('Git Commit'),
            });
            commitRow.add_suffix(new Gtk.Label({
                label: metadata.commit.toString(),
                css_classes: ['dim-label'],
            }));
            infoGroup.add(commitRow);
        }

        const gnomeVersionRow = new Adw.ActionRow({
            title: _('GNOME Version'),
        });
        gnomeVersionRow.add_suffix(new Gtk.Label({
            label: Config.PACKAGE_VERSION.toString(),
            css_classes: ['dim-label'],
        }));
        infoGroup.add(gnomeVersionRow);

        const osRow = new Adw.ActionRow({
            title: _('OS Name'),
        });

        const name = GLib.get_os_info('NAME');
        const prettyName = GLib.get_os_info('PRETTY_NAME');

        osRow.add_suffix(new Gtk.Label({
            label: prettyName ? prettyName : name,
            css_classes: ['dim-label'],
        }));
        infoGroup.add(osRow);

        const sessionTypeRow = new Adw.ActionRow({
            title: _('Windowing System'),
        });
        sessionTypeRow.add_suffix(new Gtk.Label({
            label: GLib.getenv('XDG_SESSION_TYPE') === 'wayland' ? 'Wayland' : 'X11',
            css_classes: ['dim-label'],
        }));
        infoGroup.add(sessionTypeRow);

        const githubRow = this._createLinkRow(_('Files with history Github'), metadata.url);
        infoGroup.add(githubRow);

        const closeRow = this._close_row();
        infoGroup.add(closeRow);

        this.add(infoGroup);
    }

    _createLinkRow(title, uri) {
        const image = new Gtk.Image({
            icon_name: 'adw-external-link-symbolic',
            valign: Gtk.Align.CENTER,
        });
        const linkRow = new Adw.ActionRow({
            title: _(title),
            activatable: true,
        });
        linkRow.connect('activated', () => {
            Gtk.show_uri(this.get_root(), uri, Gdk.CURRENT_TIME);
        });
        linkRow.add_suffix(image);

        return linkRow;
    }
    
    _close_row(){
        const title = "";
        const row = new Adw.ActionRow({ title });
        row.set_subtitle("");
        const close_button = new Gtk.Button({
                                                label: _("Exit Settings"),
                                                 css_classes: ["suggested-action"],
                                                 valign: Gtk.Align.CENTER,
                                            });
        row.add_suffix(close_button);
        row.activatable_widget = close_button;
        close_button.connect("clicked", () => { this._caller._close_request(this._caller._window); });

        return row;
    } // _close_row() //

} // class AboutPage extends Adw.PreferencesPage //


class FilesPreferencesSettings extends PageBase {
    static {
        GObject.registerClass(this);
    }

    constructor(caller, _title, _name, _icon_name) {
        super(caller, _title, _name, _icon_name);
        this.area_token_box         = null;
        this.position_input         = null;
        this.show_messages          = null;
        this._max_file_length       = null;
        this._show_logs_switch_row  = null;
        this._icon_size             = null;

        this.group = new Adw.PreferencesGroup();
        this.group.set_title(_title);
        this.group.set_name(_name);
        this.add(this.group);
        this.group.add(this._area_token_box());
        this.group.add(this._position_box());
        this.group.add(this._show_messages());
        this.group.add(this._max_file_length_box());
        this.group.add(this._double_click_time_box());
        this.group.add(this._show_logs_box());
        this.group.add(this._icon_size_box());
        this.group.add(this._close_row());
        const hbox = new Gtk.Box({orientation: Gtk.Orientation.HORIZONTAL, vexpand: true, hexpand: true, });
        const bottom_spacer = new Gtk.Box({orientation: Gtk.Orientation.VERTICAL, vexpand: true, hexpand: true });
        hbox.prepend(bottom_spacer);
        this.group.add(hbox);
    } // constructor(caller, _title, _name, _icon_name) //

    _area_token_box(){
        const title = _("Area in the panel");
        const panelAreas = new Gtk.StringList();
        let areas = [_("Left"), _("Center"), _("Right")];
        for (let i = 0; i < areas.length; i++){
            panelAreas.append(areas[i]);
        }
        const row = new Adw.ComboRow({
            title,
            model: panelAreas,
            selected: this._caller._window._settings.get_enum("area"),
            use_subtitle: false, 
        });
        row.connect("notify::selected", (widget) => {
            this._caller._window._settings.set_enum("area", widget.selected);
        });
        this.area_token_box = row;
        return row;
    } // _area_token_box() //

    _position_box(){
        const title = _("Position");
        const row = new Adw.ActionRow({ title });
        row.set_subtitle(_("Position in the area of the panel."));
        const slider = new Gtk.Scale({
            digits: 0,
            adjustment: new Gtk.Adjustment({ lower: 0, upper: 25, stepIncrement: 1 }),
            value_pos: Gtk.PositionType.RIGHT,
            hexpand: true,
            halign: Gtk.Align.END
        });
        slider.set_draw_value(true);
        slider.set_value(this._caller._window._settings.get_int("position"));
        slider.connect('value-changed', (_sw) => { this._caller._window._settings.set_int("position", slider.get_value()); });
        slider.set_size_request(400, 15);
        row.add_suffix(slider);
        row.activatable_widget = slider;
        this.position_input = row;
        return row;
    } // _position_box() //

    _double_click_time_box(){
        const title = _("Double Click Time");
        const row = new Adw.ActionRow({ title });
        row.set_subtitle(_("Double click time for mouse clicks in milli seconds."));
        const slider = new Gtk.Scale({
            digits: 0,
            adjustment: new Gtk.Adjustment({ lower: 400, upper: 2000, stepIncrement: 1 }),
            value_pos: Gtk.PositionType.RIGHT,
            hexpand: true,
            halign: Gtk.Align.END
        });
        slider.set_draw_value(true);
        slider.set_value(this._caller._window._settings.get_int("double-click-time"));
        slider.connect('value-changed', (_sw) => { this._caller._window._settings.set_int("double-click-time", slider.get_value()); });
        slider.set_size_request(320, 15);
        row.add_suffix(slider);
        row.activatable_widget = slider;
        this.double_click_time_input = row;
        return row;
    } // _double_click_time_box() //

    _show_messages() {
        // Show Messages
        const showMessagesRow = new Adw.SpinRow({
                    title:              _("Show Files"),
                    adjustment:         new Gtk.Adjustment({
                        value:          this._caller._window._settings.get_int('show-messages'),
                        lower:          10,
                        upper:          150,
                        step_increment: 1,
                        page_increment: 10,
                    }),
        });
        showMessagesRow.set_numeric(true);
        showMessagesRow.set_update_policy(Gtk.UPDATE_IF_VALID);
        this._caller._window._settings.bind('show-messages', showMessagesRow,
            'value', Gio.SettingsBindFlags.DEFAULT
        );
        this.show_messages  = showMessagesRow;
        return showMessagesRow;
    } // _show_messages() //

    _max_file_length_box(){
        // Max length of a file in chars //
        const maxFileLengthSpinButton = new Gtk.SpinButton({
          adjustment: new Gtk.Adjustment({
            lower: 100,
            upper: 255,
            step_increment: 1,
            page_increment: 1,
            page_size: 0,
            value: this._caller._window._settings.get_int("max-file-entry-length"),
          }),
          climb_rate: 1,
          digits: 0,
          numeric: true,
          valign: Gtk.Align.CENTER,
        });
        maxFileLengthSpinButton.connect('notify::value', widget => {
            this._caller._window._settings.set_int('max-file-entry-length', widget.get_value());
        });
        const maxFileLengthRow = new Adw.ActionRow({
          title: _("Maximum length of a File Path."),
          subtitle: _("The maximum length allowed for a file"),
          activatable_widget: maxFileLengthSpinButton,
        });
        maxFileLengthRow.add_suffix(maxFileLengthSpinButton);
        this._max_file_length  = maxFileLengthRow;
        return maxFileLengthRow;
    } // _max_file_length_box() //

    _show_logs_box(){
        // Show logs for debugging //
        const show_logs_switch_row = new Adw.SwitchRow({
            title: _("Show logs for debugging."),
            subtitle: _("Turn on the logging for this plugin if you don't know what this is the leave it off."),
            active: this._caller._window._settings.get_boolean('show-logs'), 
        });
        this.show_logs_switch = show_logs_switch_row.activatable_widget;
        this.show_logs_switch.connect("state-set", (_sw, state) => {
            this._caller._window._settings.set_boolean("show-logs", state);
            LogMessage.set_show_logs(this._caller._window._settings.get_boolean('show-logs'));
        });
        this._show_logs_switch_row  = show_logs_switch_row;
        return show_logs_switch_row;
    } // _show_logs_box() //

    _icon_size_box(){
        // Max length of a file in chars //
        const iconSizeSpinButton = new Gtk.SpinButton({
          adjustment: new Gtk.Adjustment({
            lower: 16,
            upper: 256,
            step_increment: 1,
            page_increment: 1,
            page_size: 0,
            value: this._caller._window._settings.get_int("icon-size"),
          }),
          climb_rate: 1,
          digits: 0,
          numeric: true,
          valign: Gtk.Align.CENTER,
        });
        iconSizeSpinButton.connect('notify::value', widget => {
            this._caller._window._settings.set_int('icon-size', widget.get_value());
        });
        const iconSizeRow = new Adw.ActionRow({
          title: _("Size of Icons."),
          subtitle: _("The Size of the icons in the dialogs"),
          activatable_widget: iconSizeSpinButton,
        });
        iconSizeRow.add_suffix(iconSizeSpinButton);
        this._icon_size  = iconSizeRow;
        return iconSizeRow;
    } // _icon_size_box() //

    destroy(){
        this.area_token_box        = null;
        this.position_input        = null;
        this.show_messages         = null;
        this.max_file_entry_length = null;
        this._show_logs_switch_row = null;
        this._max_file_length      = null;
        this._icon_size            = null;
        super.destroy();
    } // destroy() //
    
} // class FilesPreferencesSettings extends PageBase //

class FileDisplay extends PageBase {
    static {
        GObject.registerClass(this);
    }

    constructor(caller, _title, _name, _icon_name) {
        super(caller, _title, _name, _icon_name);

        this.time_type_box                    = null;
        this._display_inode_switch_row        = null;
        this.user_group_box                   = null;
        this._display_mode_switch_row         = null;
        this._display_number_links_switch_row = null;
        this._display_size_switch_row         = null;
        this._base2_file_sizes_switch_row     = null;
        this.filter_box                       = null;

        this.group = new Adw.PreferencesGroup();

        this.group.add(this._time_type_box());
        this.group.add(this._display_inode_box());
        this.group.add(this._user_group_box());
        this.group.add(this._display_mode_box());
        this.group.add(this._display_number_links_box());
        this.group.add(this._display_size_box());
        this.group.add(this._base2_file_sizes_box());
        this.group.add(this._filter());
        this.group.add(this._close_row());
        const hbox = new Gtk.Box({orientation: Gtk.Orientation.HORIZONTAL, vexpand: true, hexpand: true, });
        const bottom_spacer = new Gtk.Box({orientation: Gtk.Orientation.VERTICAL, vexpand: true, hexpand: true });
        hbox.prepend(bottom_spacer);
        this.group.add(hbox);

        this.add(this.group);
    } // constructor(caller, _title, _name, _icon_name) //

    _time_type_box(){
        const title = _("Diplay these time types");
        const panelAreas = new Gtk.StringList();
        const time_type = [
            _("None"), _("Create"), _("Modify"),
            _("Crete+Modify"), _("Access"),
            _("Create+Access"), _("Modify+Access"),
            _("Create+Modify+Access")
        ];
        for (let i = 0; i < time_type.length; i++){
            panelAreas.append(time_type[i]);
        }
        const row = new Adw.ComboRow({
            title,
            model: panelAreas,
            selected: this._caller._window._settings.get_enum("time-type"),
            use_subtitle: false, 
        });
        row.connect("notify::selected", (widget) => {
            this._caller._window._settings.set_enum("time-type", widget.selected);
        });
        this.time_type_box = row;
        return row;
    } // _time_type_box() //

    _display_inode_box(){
        // Display Inode //
        const display_inode_switch_row = new Adw.SwitchRow({
            title: _("Display Inode."),
            subtitle: _("Diplay the Inode number."),
            active: this._caller._window._settings.get_boolean('display-inode'), 
        });
        this.display_inode_switch = display_inode_switch_row.activatable_widget;
        this.display_inode_switch.connect("state-set", (_sw, state) => {
            this._caller._window._settings.set_boolean("display-inode", state);
        });
        this._display_inode_switch_row  = display_inode_switch_row;
        return display_inode_switch_row;
    } // _display_inode_box() //

    _user_group_box(){
        const title = _("Diplay User and or Group");
        const panelAreas = new Gtk.StringList();
        const user_group = [ _("No-User-Group"), _("User"), _("Group"), _("User+Group"), ];
        for (let i = 0; i < user_group.length; i++){
            panelAreas.append(user_group[i]);
        }
        const row = new Adw.ComboRow({
            title,
            model: panelAreas,
            selected: this._caller._window._settings.get_enum("user-group"),
            use_subtitle: false, 
        });
        row.connect("notify::selected", (widget) => {
            this._caller._window._settings.set_enum("user-group", widget.selected);
        });
        this.user_group_box = row;
        return row;
    } // _user_group_box() //

    _display_mode_box(){
        // Display mode //
        const display_mode_switch_row = new Adw.SwitchRow({
            title: _("Display Perms."),
            subtitle: _("Diplay the Permissions and File Type."),
            active: this._caller._window._settings.get_boolean('display-mode'), 
        });
        this.display_mode_switch = display_mode_switch_row.activatable_widget;
        this.display_mode_switch.connect("state-set", (_sw, state) => {
            this._caller._window._settings.set_boolean("display-mode", state);
        });
        this._display_mode_switch_row  = display_mode_switch_row;
        return display_mode_switch_row;
    } // _display_mode_box() //

    _display_number_links_box(){
        // Display number of links //
        const display_number_links_switch_row = new Adw.SwitchRow({
            title: _("Display number of links."),
            subtitle: _("Diplay the number of hard links."),
            active: this._caller._window._settings.get_boolean('display-number-links'), 
        });
        this.display_number_links_switch = display_number_links_switch_row.activatable_widget;
        this.display_number_links_switch.connect("state-set", (_sw, state) => {
            this._caller._window._settings.set_boolean("display-number-links", state);
        });
        this._display_number_links_switch_row  = display_number_links_switch_row;
        return display_number_links_switch_row;
    } // _display_number_links_box() //

    _display_size_box(){
        // Display size //
        const display_size_switch_row = new Adw.SwitchRow({
            title: _("Display File Size."),
            subtitle: _("Diplay the File Size in Terra Bytes, Giga Bytes etc..."),
            active: this._caller._window._settings.get_boolean('display-size'), 
        });
        this.display_size_switch = display_size_switch_row.activatable_widget;
        this.display_size_switch.connect("state-set", (_sw, state) => {
            this._caller._window._settings.set_boolean("display-size", state);
        });
        this._display_size_switch_row  = display_size_switch_row;
        return display_size_switch_row;
    } // _display_size_box() //

    _base2_file_sizes_box(){
        // Display file size in base 2 multiples 2¹⁰, 2²⁰, ... //
        const base2_file_sizes_switch_row = new Adw.SwitchRow({
            title: _("Base 2 file sizes."),
            subtitle: _("Show the file sizes in base 2 (i.e. multiples of 2¹⁰, 2²⁰ etc)."),
            active: this._caller._window._settings.get_boolean('base2-file-sizes'), 
        });
        this._base2_file_sizes_switch = base2_file_sizes_switch_row.activatable_widget;
        this._base2_file_sizes_switch.connect("state-set", (_sw, state) => {
            this._caller._window._settings.set_boolean("base2-file-sizes", state);
        });
        this._base2_file_sizes_switch_row  = base2_file_sizes_switch_row;
        return base2_file_sizes_switch_row;
    } // _base2_file_sizes_box() //

    _filter(){
        const title = _("filter");
        const filters_ = new Gtk.StringList();
        const filters = ["/^.*\\.txt$/i", "/^.*\\.files$/i", "/^(?:.*\\.txt|.*\\.files)$/i", "/^.*/i"];
        for (let i = 0; i < filters.length; i++){
            filters_.append(filters[i]);
        }
        const indx = filters.indexOf(this._caller._window._settings.get_string("filter"));
        const row = new Adw.ComboRow({
            title,
            model:        filters_,
            selected:     indx,
            use_subtitle: false, 
        });
        row.connect("notify::selected", (widget) => {
            this._caller._window._settings.set_string("filter", filters[widget.selected]);
        });
        this.filter_box = row;
        return row;
    } // _filter() //

    destroy(){
        this.time_type_box                    = null;
        this._display_inode_switch_row        = null;
        this.user_group_box                   = null;
        this._display_mode_switch_row         = null;
        this._display_number_links_switch_row = null;
        this._display_size_switch_row         = null;
        this._base2_file_sizes_switch_row     = null;
        this.filter_box                       = null;
        super.destroy();
    }

} // class FileDisplay extends PageBase //

class FilesScroller extends PageBase {
    static {
        GObject.registerClass(this);
    }

    constructor(caller, _title, _name, _icon_name) {
        super(caller, _title, _name, _icon_name);
        this.controlsGroup = new Adw.PreferencesGroup();
        /*
        this._addButton = new Adw.ButtonRow({
            title: _("Insert File..."), 
        });
        // */
        const insbutton = new Gtk.Button({
                                label:      _("Insert File..."),
                                css_classes: ['add-file-label'],
                                hexpand:     true,
                                vexpand:     false,
                                valign:      Gtk.Align.CENTER,
        });
        insbutton.connect("clicked", () => { this._caller.editFileEntry(this, -1); });
        this.button_box     = new Gtk.Box({orientation: Gtk.Orientation.HORIZONTAL, vexpand: false, hexpand: true, });
        //this._addButton.connect('activated', () => { this._caller.editFileEntry(-1); });
        this.button_box.prepend(insbutton);
        this.button_box.append(this._close_button());
        this._addButton = new Adw.PreferencesRow({
            title:               _("Insert File..."), 
        });
        this._addButton.set_child(this.button_box);
        this.controlsGroup.add(this._addButton);
        this.add(this.controlsGroup);

        this.containerGroup    = new Adw.PreferencesGroup();
        this.filesGroup    = new Adw.PreferencesGroup();
        this.filesGroup.set_title(_title);
        this.filesGroup.set_name(_name);
        const length = this._caller.files.length;
        for(let _index = 0; _index < length; _index++){
            const file   = this._caller.files[_index];
            const spinButton = new Gtk.SpinButton({
                adjustment: new Gtk.Adjustment({
                    lower:          0,
                    upper:          length - 1,
                    step_increment: 1,
                    page_increment: 1,
                    page_size:      0,
                    value:          _index, 
                }),
                climb_rate:         1,
                activates_default:  Gtk.SpinButtonUpdatePolicy.IF_VALID, 
                digits:             0,
                numeric:            true, 
                css_name:           'updown-spin', 
                valign:             Gtk.Align.CENTER,
            });
            const button = new Gtk.Button({
                                label: ">...",
                                css_classes: ['file-label'],
                                hexpand: false,
                                vexpand: false,
                                valign: Gtk.Align.END,
            });
            this._caller.log_message(LogMessage.get_prog_id(), `FilesScroller::constructor: _index == ${_index}`, new Error());
            button.connect("clicked", () => { this._caller.editFileEntry(this, Number(_index)); });
            const row = new Adw.ActionRow({
                                title: file, 
                                activatable_widget: button, 
                                title_lines: this._caller.max_file_entry_length, 
            });
            row.add_suffix(spinButton);
            spinButton.connect('value-changed', (sb) => {
                const i = sb.adjustment.get_value();
                const elt = this._caller.files.splice(_index, 1)[0];
                this._caller.files.splice(i, 0, elt);
                this._caller._window._settings.set_strv('files', this._caller.files);
                this.refresh();
            });
            row.add_suffix(button);
            this.filesGroup.add(row);
        } // for(let _index = 0; _index < length; _index++) //
        this.scrolledWindow    = new Gtk.ScrolledWindow({
            name:    'scrolledWindow', 
            hexpand: true, 
            vexpand: true, 
            halign:  Gtk.Align.FILL, 
            valign:  Gtk.Align.FILL, 
        });
        this.scrolledWindow.set_child(this.filesGroup);
        this.containerGroup.add(this.scrolledWindow);
        this.add(this.containerGroup);
        this.size_changed_id = this._caller._window.connect('notify::default-height', () => {
            const height = Math.max(Math.floor((3 * this._caller._window.default_height)/10), this.scrolledWindow.min_content_height);
            this._caller.log_message(LogMessage.get_prog_id(), `Callback notify::default-height: height == ${height}`, new Error());
            this.scrolledWindow.set_max_content_height(height);
            this.scrolledWindow.height_request = height;
        });
    } // constructor(caller, _title, _name, _icon_name) //
    
    refresh(){
        this.scrolledWindow.set_child(null);
        this.filesGroup    = null;
        this.filesGroup    = new Adw.PreferencesGroup();
        this.filesGroup.set_title(this._title);
        this.filesGroup.set_name(this._name);
        const length = this._caller.files.length;
        for(let _index = 0; _index < length; _index++){
            const file   = this._caller.files[_index];
            const spinButton = new Gtk.SpinButton({
                adjustment: new Gtk.Adjustment({
                    lower:          0,
                    upper:          length - 1,
                    step_increment: 1,
                    page_increment: 1,
                    page_size:      0,
                    value:          _index, 
                }),
                climb_rate:         1,
                digits:             0,
                numeric:            true, 
                css_name:           'updown-spin', 
                valign:             Gtk.Align.CENTER,
            });
            const button = new Gtk.Button({
                                label: ">...",
                                css_classes: ['file_label'],
                                hexpand: false,
                                vexpand: false,
                                valign: Gtk.Align.END,
            });
            button.connect("clicked", () => { this._caller.editFileEntry(this, Number(_index)); });
            const row = new Adw.ActionRow({
                                title: file, 
                                activatable_widget: button, 
                                title_lines: this._caller.max_file_entry_length, 
            });
            row.add_suffix(spinButton);
            spinButton.connect('value-changed', (sb) => {
                const i = sb.adjustment.get_value();
                const elt = this._caller.files.splice(_index, 1)[0];
                this._caller.files.splice(i, 0, elt);
                this._caller._window._settings.set_strv('files', this._caller.files);
                this.refresh();
            });
            row.add_suffix(button);
            this.filesGroup.add(row);
        } // for(let _index = 0; _index < this._caller.files.length; _index++) //
        this.scrolledWindow.set_child(this.filesGroup);
    } // refresh() //

} // class FilesScroller extends PageBase //

class EditFileEntry extends PageBase {
    static {
        GObject.registerClass(this);
    }

    constructor(caller, _title, _name, _icon_name) {
        super(caller, _title, _name, _icon_name);
        this.index        = this._caller._window._settings.get_int("index");
        this.file         = '';
        this.calling_page = null;
        this.group        = new Adw.PreferencesGroup();
        this.insert       = false;
        this.spinButton   = null;
        if(this.index < 0){
            this._caller.log_message(LogMessage.get_prog_id(), `EditFileEntry::constructor: this.index == ${this.index}`, new Error());
            this.file = '';
            this.insert = true;
        }else if(0 <= this.index && this.index < this._caller.files.length){
            this._caller.log_message(LogMessage.get_prog_id(), `EditFileEntry::constructor: this.index == ${this.index}`, new Error());
            this._caller.log_message(LogMessage.get_prog_id(), `EditFileEntry::constructor: this.file == ${this.file}`, new Error());
            this.file = this._caller.files[this.index];
            this._caller.log_message(LogMessage.get_prog_id(), `EditFileEntry::constructor: this.file == ${this.file}`, new Error());
            this.insert = false;
        }else{
            this.index = -1;
            this._caller._window._settings.set_int("index", this.index);
            this.insert = true;
            this._caller.log_message(LogMessage.get_prog_id(), `EditFileEntry::constructor: this.index == ${this.index}`, new Error());
        }
        this.spinButton = new Gtk.SpinButton({
            adjustment: new Gtk.Adjustment({
                lower:         -1,
                upper:          this._caller.files.length,
                step_increment: 1,
                page_increment: 1,
                page_size:      0,
                value:          this.index, 
            }),
            climb_rate: 1,
            digits: 0,
            numeric:    true, 
            valign: Gtk.Align.CENTER,
        }); 
        this.file_label = new Gtk.Label({
            label: (this.file ? this.file : ''), 
            valign: Gtk.Align.CENTER,
        });
        this.edit           = new Adw.ActionRow({ 
            title:      _(""), 
            subtitle:   "", 
        });
        const file_add = new Gtk.Button({
            label: _('Select File'), 
        });
        this.edit.add_suffix(this.file_label);
        this.edit.add_suffix(file_add);
        file_add.connect('clicked', async () => {
            try {
                const filter = new Gtk.FileFilter({
                    name: "files",
                });
                this._caller.log_message(
                    LogMessage.get_prog_id(), `EditFileEntry::clicked: filter == ${filter}`, new Error()
                );

                filter.add_pattern('*.*');
                this._caller.log_message(
                    LogMessage.get_prog_id(), `EditFileEntry::clicked: filter == ${filter}`, new Error()
                );

                const fileDialog = new Gtk.FileDialog({
                    title: _('Select a file'),
                    modal: true,
                    default_filter: filter
                });
                this._caller.log_message(
                    LogMessage.get_prog_id(), `EditFileEntry::clicked: fileDialog == ${fileDialog}`, new Error()
                );

                const file = await fileDialog.open(file_add.get_root(), null);
                this._caller.log_message(LogMessage.get_prog_id(), `EditFileEntry::clicked: file == ${file}`, new Error());
                if (file) {
                    const filename = file.get_path();
                    if(this.index < 0 || this.length >= this._caller.files.index){
                        this._caller.files.unshift(filename);
                        this.index = 0;
                        this.spinButton.adjustment.set_value(this.index);
                    }else{
                        this._caller.files[this.index] = filename;
                    }
                    this._caller._window._settings.set_strv("files", this._caller.files);
                    this.file_label.set_text(filename);
                    this.file = filename;
                    this._caller.log_message(
                        LogMessage.get_prog_id(), `EditFileEntry::clicked: filename == ${filename}`, new Error()
                    );
                    this._caller._FilesScroller.refresh();
                }
            } catch (error) {
                this._caller.log_message(LogMessage.get_prog_id(), `EditFileEntry::clicked: file == ${error}`, error);
                console.error('files-launcher::Error selecting file:', error.message);
            }
        });
        const dir_add = new Gtk.Button({
            label: _('Select Directory'), 
        });
        this.edit.add_suffix(dir_add);
        dir_add.connect('clicked', async () => {
            try {
                const filter = new Gtk.FileFilter({
                    name: "dirs",
                });
                this._caller.log_message(
                    LogMessage.get_prog_id(), `EditFileEntry::clicked: filter == ${filter}`, new Error()
                );

                filter.add_mime_type('inode/directory');
                filter.add_mime_type('inode/symlink');
                this._caller.log_message(
                    LogMessage.get_prog_id(), `EditFileEntry::clicked: filter == ${filter}`, new Error()
                );

                const fileDialog = new Gtk.FileDialog({
                    title: _('Select a directory'),
                    modal: true,
                    default_filter: filter
                });
                this._caller.log_message(
                    LogMessage.get_prog_id(), `EditFileEntry::clicked: fileDialog == ${fileDialog}`, new Error()
                );

                await fileDialog.select_folder(dir_add.get_root(), null, (source_object, res, _data) => {
                    this._caller.log_message(
                        LogMessage.get_prog_id(), `EditFileEntry::clicked: _data == ${_data}`, new Error()
                    );
                    try {
                        const dir = source_object.select_folder_finish(res);
                        this._caller.log_message(LogMessage.get_prog_id(), `EditFileEntry::clicked: dir == ${dir}`, new Error());
                        if(dir) {
                            const dirname = dir.get_path();
                            if(this.index < 0 || this.length >= this._caller.files.index){
                                this._caller.files.unshift(dirname);
                                this.index = 0;
                                this.spinButton.adjustment.set_value(this.index);
                            }else{
                                this._caller.files[this.index] = dirname;
                            }
                            this._caller._window._settings.set_strv("files", this._caller.files);
                            this.file_label.set_text(dirname);
                            this.file = dirname;
                            this._caller.log_message(
                                LogMessage.get_prog_id(), `EditFileEntry::clicked: filename == ${dirname}`, new Error()
                            );
                        }
                        this._caller._FilesScroller.refresh();
                    } catch (e) {
                        this._caller.log_message(LogMessage.get_prog_id(), `EditFileEntry::clicked: file == ${e}`, e);
                        console.error('files-launcher::Error selecting directory:', e.message);
                    }
                });
            } catch (error) {
                this._caller.log_message(LogMessage.get_prog_id(), `EditFileEntry::clicked: file == ${error}`, error);
                console.error('files-launcher::Error selecting directory:', error.message);
            }
        });
        this.edit.add_suffix(this.spinButton);
        this.spinButton.connect('value-changed', (sb) => {
            this.scroll(sb);
        });
        this.button_box     = new Gtk.Box({orientation: Gtk.Orientation.HORIZONTAL, vexpand: false, hexpand: true, });
        this.back_button  = new Gtk.Button({
                                                label:        _("Back"),
                                                 css_classes: ["back-button"],
                                                 valign:      Gtk.Align.CENTER,
        });
        this.back_button.connect("clicked", () => { this.back_edit(); });
        this.restart_button = new Gtk.Button({
                                                label:        _("Restart"),
                                                 css_classes: ["restart-button"],
                                                 valign:      Gtk.Align.CENTER,
        });
        this.restart_button.connect("clicked", () => { this.restart(); });
        this.delete_button = new Gtk.Button({
                                                label:        _("delete"),
                                                 css_classes: ["delete-button"],
                                                 valign:      Gtk.Align.CENTER,
        });
        this.delete_button.connect("clicked", () => { this.delete_file(); });
        const add_file_lable = _("Add File");
        const add_dir_lable = _("Add Directory");
        this.add_file_button    = new Gtk.Button({
                                                label:        add_file_lable,
                                                 css_classes: ["add-file-button"],
                                                 valign:      Gtk.Align.CENTER,
        });
        this.add_file_button.connect("clicked", async () => {
            try {
                const filter = new Gtk.FileFilter({
                    name: "files",
                });
                this._caller.log_message(
                    LogMessage.get_prog_id(), `EditFileEntry::clicked: filter == ${filter}`, new Error()
                );

                filter.add_pattern('*.*');
                this._caller.log_message(
                    LogMessage.get_prog_id(), `EditFileEntry::clicked: filter == ${filter}`, new Error()
                );

                const fileDialog = new Gtk.FileDialog({
                    title: _('Select a file'),
                    modal: true,
                    default_filter: filter
                });
                this._caller.log_message(
                    LogMessage.get_prog_id(), `EditFileEntry::clicked: fileDialog == ${fileDialog}`, new Error()
                );

                const file = await fileDialog.open(this.add_file_button.get_root(), null);
                this._caller.log_message(LogMessage.get_prog_id(), `EditFileEntry::clicked: file == ${file}`, new Error());
                if (file) {
                    const filename = file.get_path();
                    this._caller.files.unshift(filename);
                    this.index = 0;
                    this.spinButton.adjustment.set_value(this.index);
                    this._caller._window._settings.set_strv("files", this._caller.files);
                    this.file_label.set_text(filename);
                    this.file = filename;
                    this._caller.log_message(
                        LogMessage.get_prog_id(), `EditFileEntry::clicked: filename == ${filename}`, new Error()
                    );
                    this._caller._FilesScroller.refresh();
                }
            } catch (error) {
                this._caller.log_message(LogMessage.get_prog_id(), `EditFileEntry::clicked: file == ${error}`, error);
                console.error('files-launcher::Error selecting file:', error.message);
            }
        });
        this.add_dir_button     = new Gtk.Button({
                                                label:        add_dir_lable,
                                                 css_classes: ["add-dir-button"],
                                                 valign:      Gtk.Align.CENTER,
        });
        this.add_dir_button.connect("clicked", async () => {
            try {
                const filter = new Gtk.FileFilter({
                    name: "dirs",
                });
                this._caller.log_message(
                    LogMessage.get_prog_id(), `EditFileEntry::clicked: filter == ${filter}`, new Error()
                );

                filter.add_mime_type('inode/directory');
                filter.add_mime_type('inode/symlink');
                this._caller.log_message(
                    LogMessage.get_prog_id(), `EditFileEntry::clicked: filter == ${filter}`, new Error()
                );

                const fileDialog = new Gtk.FileDialog({
                    title: _('Select a directory'),
                    modal: true,
                    default_filter: filter
                });
                this._caller.log_message(
                    LogMessage.get_prog_id(), `EditFileEntry::clicked: fileDialog == ${fileDialog}`, new Error()
                );

                await fileDialog.select_folder(this.add_dir_button.get_root(), null, (source_object, res, _data) => {
                    this._caller.log_message(
                        LogMessage.get_prog_id(), `EditFileEntry::clicked: _data == ${_data}`, new Error()
                    );
                    try {
                        const dir = source_object.select_folder_finish(res);
                        this._caller.log_message(LogMessage.get_prog_id(), `EditFileEntry::clicked: dir == ${dir}`, new Error());
                        if(dir) {
                            const dirname = dir.get_path();
                            this._caller.files.unshift(dirname);
                            this.index = 0;
                            this.spinButton.adjustment.set_value(this.index);
                            this._caller._window._settings.set_strv("files", this._caller.files);
                            this.file_label.set_text(dirname);
                            this.file = dirname;
                            this._caller.log_message(
                                LogMessage.get_prog_id(), `EditFileEntry::clicked: filename == ${dirname}`, new Error()
                            );
                        }
                        this._caller._FilesScroller.refresh();
                    } catch (e) {
                        this._caller.log_message(LogMessage.get_prog_id(), `EditFileEntry::clicked: file == ${e}`, e);
                        console.error('files-launcher::Error selecting directory:', e.message);
                    }
                });
            } catch (error) {
                this._caller.log_message(LogMessage.get_prog_id(), `EditFileEntry::clicked: file == ${error}`, error);
                console.error('files-launcher::Error selecting directory:', error.message);
            }
        });
        this.button_box.prepend(this.back_button);
        this.button_box.append(this.restart_button);
        this.button_box.append(this.delete_button);
        this.button_box.append(this.add_file_button);
        this.button_box.append(this.add_dir_button);
        this.buttonRow = new Adw.PreferencesRow({
                            title: "",
        });
        this.buttonRow.set_child(this.button_box);
        this.group.add(this.buttonRow);
        this.group.add(this.edit);
        this.group.add(this._close_row());
        this.add(this.group);
    } // constructor(caller, _title, _name, _icon_name) //

    scroll(sb){
        this.index = sb.adjustment.get_value();
        if(0 <= this.index && this.index < this._caller.files.length){
            this.file = this._caller.files[this.index];
        }else{
            this.file = '';
        }
        this.file_label.set_text(this.file);
    }

    refresh_page(calling_page){
        this.index = this._caller._window._settings.get_int("index");
        this.spinButton.adjustment.set_value(this.index);
        this.file         = '';
        this.calling_page = calling_page;
        this.insert = false;
        if(this.index < 0){
            this._caller.log_message(LogMessage.get_prog_id(), `EditFileEntry::constructor: this.index == ${this.index}`, new Error());
            this.file = '';
            this.insert = true;
        }else if(0 <= this.index && this.index < this._caller.files.length){
            this._caller.log_message(LogMessage.get_prog_id(), `EditFileEntry::constructor: this.index == ${this.index}`, new Error());
            this._caller.log_message(LogMessage.get_prog_id(), `EditFileEntry::constructor: this.file == ${this.file}`, new Error());
            this.file = this._caller.files[this.index];
            this._caller.log_message(LogMessage.get_prog_id(), `EditFileEntry::constructor: this.file == ${this.file}`, new Error());
            this.insert = false;
        }else{
            this.index = -1;
            this.spinButton.adjustment.set_value(this.index);
            this._caller._window._settings.set_int("index", this.index);
            this.insert = true;
            this._caller.log_message(LogMessage.get_prog_id(), `EditFileEntry::constructor: this.index == ${this.index}`, new Error());
        }
        this.file_label.set_label(this.file);
    } // refresh_page(calling_page) //

    get_text(){
        return this.file_label.get_label();
    }

    set_text(_text){
        this.file_label.set_label(_text);
    }

    get_index(){
        return this.index;
    }

    set_index(_index){
        this.index = _index;
        this._caller._window._settings.set_int("index", _index);
        this.spinButton.adjustment.set_value(this.index);
    }

    get_calling_page(){
        return this.calling_page;
    }

    set_calling_page(page){
        if(page instanceof Adw.PreferencesPage){
            this.calling_page = page;
        }
    }

    back_edit(){
        this.file = null;
        this.set_text('');
        if(0 <= this.index && this.index < this._caller.files.length){
            this.index = -1;
            this.spinButton.adjustment.set_value(this.index);
        }
        if(this._caller.edit_page){
            this._caller.edit_page = false;
            this._caller._window._settings.set_boolean('edit-page', false);
            this._caller._close_request(this._caller._window);
        }else if(this.calling_page){ // if(this._caller.edit_page) //
            this._caller._window.set_visible_page(this.calling_page);
        }
    } // back_edit() //

    restart(){
        this.index = this._caller._window._settings.get_int("index");
        this.spinButton.adjustment.set_value(this.index);
        this.file         = null;
        if(0 <= this.index && this.index < this._caller.files.length){
            this.file = this._caller.files[this.index];
            this.set_text(this.file);
        }
    } // restart() //

    delete_file(){
        this._caller.log_message(LogMessage.get_prog_id(), `EditFileEntry::delete_file: this.index: ‷${this.index}‴.`, new Error());
        if(0 <= this.index && this.index < this._caller.files.length){
            this._caller.log_message(LogMessage.get_prog_id(), `EditFileEntry::delete_file: this._caller.files: ‷${this._caller.files}‴.`, new Error());
            this._caller.files.splice(this.index, 1);
            this._caller.log_message(LogMessage.get_prog_id(), `EditFileEntry::delete_file: this._caller.files: ‷${this._caller.files}‴.`, new Error());
            this._caller._window._settings.set_strv("files", this._caller.files);
            this.file = null;
            this.set_text('');
            this.index = -1;
            this.spinButton.adjustment.set_value(this.index);
            this.spinButton.adjustment.set_upper(this._caller.files.length);
            this._caller._window._settings.set_int('index', this.index);
        }
        if(this._caller.edit_page){
            this._caller.edit_page = false;
            this._caller._window._settings.set_boolean('edit-page', false);
            if(this.calling_page){
                this._caller._FilesScroller.refresh();
                this._caller._window.set_visible_page(this.calling_page);
            }else{
                this._caller._window._close_request(this._caller._window);
            }
        }else if(this.calling_page){ // if(this._caller.edit_page) //
            this._caller._FilesScroller.refresh();
            this._caller._window.set_visible_page(this.calling_page);
        }
    } // delete_file() //

} // class EditFileEntry extends PageBase //

class CreditsPage extends PageBase {
    static {
        GObject.registerClass(this);
    }

    constructor(caller, _title, _name, _icon_name) {
        super(caller, _title, _name, _icon_name);
        const group_credits = new Adw.PreferencesGroup();
        group_credits.set_title('Authors');
        group_credits.set_name('files_Credits');
        let title    = null;
        title = _("Copyright") + ": ©2022, ©2023 &amp; ©2024 Francis Grizzly Smit:";
        const cr_row = new Adw.ActionRow({ title });
        const licence = new Gtk.LinkButton({uri: "https://www.gnu.org/licenses/gpl-2.0.en.html", label: "Licence GPL v2+" });
        licence.set_use_underline(true);
        licence.set_halign(Gtk.Align.START);
        cr_row.add_suffix(licence);
        cr_row.activatable_widget = licence;
        group_credits.add(cr_row);
        this.add(group_credits);
        title = _("Author") + ": Francis Grizzly Smit©";
        const row_auth = new Adw.ActionRow({ title });
        const link_auth = new Gtk.LinkButton({uri: "https://github.com/grizzlysmit", label: "https://github.com/grizzlysmit" });
        link_auth.set_use_underline(true);
        link_auth.set_halign(Gtk.Align.START);
        row_auth.add_suffix(link_auth);
        row_auth.activatable_widget = link_auth;
        group_credits.add(row_auth);
        group_credits.add(this._close_row());
        this.add(group_credits);
    } // constructor(caller, _title, _name, _icon_name) //

} // class CreditsPage extends PageBase //

export default class FilesPreferences extends ExtensionPreferences {
    constructor(metadata) {
        super(metadata);
        this._pageFilesPreferencesSettings = null;
        this._fileDisplay                  = null;
        this._filesIconsPage               = null;
        this._FilesScroller                = null;
        this._EditFileEntry                = null;
        this.aboutPage                     = null;
        this.creditsPage                   = null;
        this.page                          = this._pageFilesPreferencesSettings;
        this.enum2string = [
            "settings",
            "fileDisplay",
            "filesIconsPage",
            "filesScroller",
            "editFileEntry",
            "aboutPage",
            "credits",
        ];
    } //  constructor(metadata) //

    fillPreferencesWindow(window) {
        this._window = window;

        window._settings       = this.getSettings();
        LogMessage.set_prog_id(LogMessage.get_prog_id());
        LogMessage.set_show_logs(this._window._settings.get_boolean('show-logs'));
        if(this._window._settings.get_int("position") < 0 || this._window._settings.get_int("position") > 25){ 
            this._window._settings.set_int("position", 0);
        }
        this.show_messages           = this._window._settings.get_int("show-messages");
        this.window_width            = this._window._settings.get_int("window-width");
        this.window_height           = this._window._settings.get_int("window-height");
        this.page_name               = this.enum2string[this._window._settings.get_enum("page")];
        this.index                   = this._window._settings.get_int("index");
        this.files                   = this._window._settings.get_strv("files");
        this.max_file_entry_length   = this._window._settings.get_int("max-file-entry-length");
        this.edit_page               = this._window._settings.get_boolean("edit-page");

        this._pageFilesPreferencesSettings = new FilesPreferencesSettings(this, _('Settings'), "settings", 'preferences-system-symbolic');
        this._fileDisplay                  = new FileDisplay(this, _('File Display Settings'), "fileDisplay", 'preferences-system-symbolic');
        this._filesIconsPage               = new FilesIconsPage(this, _('Icon'), 'Icon', 'emblem-photos-symbolic');
        this._FilesScroller                = new FilesScroller(this, _("Files"), "files", 'files-app');
        this._EditFileEntry                = new EditFileEntry(this, _("Edit file"), "editFiles", 'files-app');
        this.aboutPage                     = new AboutPage(this, this.metadata);
        this.creditsPage                   = new CreditsPage(this, _("Credits"), "credits", 'copyright-symbolic');
        window.connect("close-request", (_win) => {
            const width  = window.default_width;
            const height = window.default_height;
            if(width !== this.window_width && height !== this.window_height){
                this._window._settings.set_int("window-width",  width);
                this._window._settings.set_int("window-height", height);
            } // if(width !== this.properties_width && height !== this.properties_height) //
            this._pageFilesPreferencesSettings = null;
            this._fileDisplay                  = null;
            this._filesIconsPage               = null;
            this._FilesScroller                = null;
            this._EditFileEntry                = null;
            this.aboutPage                     = null;
            this.creditsPage                   = null;
            window.destroy();
        });
        window.add(this._pageFilesPreferencesSettings);
        window.add(this._fileDisplay);
        window.add(this._filesIconsPage);
        window.add(this._FilesScroller);
        window.add(this._EditFileEntry);
        window.add(this.aboutPage);
        window.add(this.creditsPage);
        window.set_default_size(this.window_width, this.window_height);
        if(this.edit_page){
            this.edit_page = false;
            this._window._settings.set_boolean('edit-page', false);
            switch(this.page_name){
                case("settings"):
                    this.page = this._pageFilesPreferencesSettings;
                    this._window.set_visible_page(this.page);
                    break;
                case("fileDisplay"):
                    this.page = this._fileDisplay;
                    this._window.set_visible_page(this.page);
                    break;
                case("filesIconsPage"):
                    this.page = this._filesIconsPage;
                    this._window.set_visible_page(this.page);
                    break;
                case("filesScroller"):
                    this.page = this._FilesScroller;
                    this._window.set_visible_page(this.page);
                    break;
                case("editFileEntry"):
                    this.page = this._EditFileEntry;
                    this.editFileEntry(null, this.index);
                    break;
                case("aboutPage"):
                    this.page = this.aboutPage;
                    this._window.set_visible_page(this.page);
                    break;
                case("credits"):
                    this.page = this.creditsPage;
                    this._window.set_visible_page(this.page);
                    break;
                default:
                    this.page = this._pageFilesPreferencesSettings;
                    this._window.set_visible_page(this.page);
            }  // switch(this.page_name) //
        } // if(this.edit_page) //
        this.settingsID_page       = this._window._settings.connect("changed::page", this.onPageChanged.bind(this));
        this.settingsID_edit_file  = this._window._settings.connect("changed::edit-page", () => {
            this.edit_page         = this._window._settings.get_boolean("edit-page");
        });

    } // fillPreferencesWindow(window) //

    editFileEntry(calling_page, _index){
        this.log_message(LogMessage.get_prog_id(), `FilesPreferences::editFileEntry: _index == ${_index}`, new Error());
        this.page = this._EditFileEntry;
        this._EditFileEntry.set_index(_index);
        this._EditFileEntry.refresh_page(calling_page);
        this._window.set_visible_page(this.page);
    } // editFileEntry(calling_page, _index) //

    _close_request(_win){
        this._window.close();
        return false;
    } // _close_request(_win) //

    onPageChanged(){
        this.page_name         = this.enum2string[this._window._settings.get_enum("page")];
        this.edit_page         = this._window._settings.get_boolean('edit-page');
        if(this.edit_page){
            this.edit_page = false;
            this._window._settings.set_boolean('edit-page', false);
            switch(this.page_name){
                case("settings"):
                    this.page = this._pageFilesPreferencesSettings;
                    this._window.set_visible_page(this.page);
                    break;
                case("fileDisplay"):
                    this.page = this._fileDisplay;
                    this._window.set_visible_page(this.page);
                    break;
                case("filesIconsPage"):
                    this.page = this._filesIconsPage;
                    this._window.set_visible_page(this.page);
                    break;
                case("filesScroller"):
                    this.page = this._FilesScroller;
                    this._window.set_visible_page(this.page);
                    break;
                case("editFileEntry"):
                    this.page = this._EditFileEntry;
                    this.editFileEntry(null, this.index);
                    break;
                case("aboutPage"):
                    this.page = this.aboutPage;
                    this._window.set_visible_page(this.page);
                    break;
                case("credits"):
                    this.page = this.creditsPage;
                    this._window.set_visible_page(this.page);
                    break;
                default:
                    this.page = this._pageFilesPreferencesSettings;
                    this._window.set_visible_page(this.page);
            }  // switch(this.page_name) //
        } // if(this.edit_page) //
    }

    log_message(id, text, e){
        LogMessage.log_message(id, text, e);
    }

} // export default class FilesPreferences extends ExtensionPreferences //

