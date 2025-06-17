/* extension.js
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

import GObject from 'gi://GObject';
import Shell from 'gi://Shell';
import St from 'gi://St';
import GLib from 'gi://GLib';
import Gio from 'gi://Gio';
import Clutter from 'gi://Clutter';
// import Gda from 'gi://Gda';
// import * as Gda from 'gi://Gda';
import * as Gzz from './gzz.js';


import {Extension, gettext as _} from 'resource:///org/gnome/shell/extensions/extension.js';
import * as PanelMenu from 'resource:///org/gnome/shell/ui/panelMenu.js';
import * as PopupMenu from 'resource:///org/gnome/shell/ui/popupMenu.js';

import * as Main from 'resource:///org/gnome/shell/ui/main.js';
import * as LogMessage from './log_message.js';
import * as Constants from './icon_constants.js';
import('gi://GioUnix?version=2.0').catch(() => {}); // Set version for optional dependency //

class ApplicationMenuItem extends PopupMenu.PopupBaseMenuItem {
    static {
        GObject.registerClass(this);
    }

    constructor(button, item) {
        super();
        this._menuitem = this;
        this._item = item;
        this._button = button;

        this.icon = this.getIcon();

        this._iconBin = new St.Bin();
        this.add_child(this._iconBin);

        let menuitemLabel = new St.Label({
            text: this._item?.text ?? '<Error bad value for this_item.text>',
            y_expand: true,
            y_align: Clutter.ActorAlign.CENTER,
        });
        this.add_child(menuitemLabel);
        this.label_actor = menuitemLabel;

        let textureCache = St.TextureCache.get_default();
        textureCache.connectObject('icon-theme-changed',
                                        () => this._updateIcon(), this);
        this._updateIcon();

        this.connectObject('activate', (event) => this.activate(event), this);

    } // constructor(button, item) //

    getIcon() {
        let icon         = null;
        let app          = null;
        let gicon        = null;
        let _icon_name   = null;
        const index      = this._item.index;
        switch (this._item.type) {
            case "dir":
                icon = new St.Icon({
                    style_class: 'icon-dropshadow',
                });
                _icon_name = "filemanager-app";
                gicon = Gio.icon_new_for_string(_icon_name);
                icon.gicon = gicon;
                icon.icon_size = this._button._caller.settings.get_int('menu-button-icon-size');
                break;
            case "file":
                icon = new St.Icon({
                    icon_name:   'notes-app',
                    style_class: 'system-status-icon',
                });
                icon.icon_size = this._button._caller.settings.get_int('menu-button-icon-size');
                break;
            case "desktop":
                app  = this._button._caller.appSys.lookup_app(this._button._caller.files[index]);
                if(!app){
                    icon = new St.Icon({
                        style_class: 'icon-dropshadow',
                    });
                    _icon_name = "filemanager-app";
                    gicon = Gio.icon_new_for_string(_icon_name);
                    icon.gicon = gicon;
                    icon.icon_size = this._button._caller.settings.get_int('menu-button-icon-size');
                    return icon;
                }
                icon = app.create_icon_texture(this._button._caller.settings.get_int('menu-button-icon-size'));
                break;
            case "executable":
                icon = new St.Icon({
                    style_class: 'icon-dropshadow',
                });
                _icon_name = "application-x-executable";
                gicon = Gio.icon_new_for_string(_icon_name);
                icon.gicon = gicon;
                icon.icon_size = this._button._caller.settings.get_int('menu-button-icon-size');
                break;
            case "settings":
                app  = this._button._caller.appSys.lookup_app('org.gnome.settings');
                if(!app){
                    icon = new St.Icon({
                        style_class: 'icon-dropshadow',
                    });
                    _icon_name = "filemanager-app";
                    gicon = Gio.icon_new_for_string(_icon_name);
                    icon.gicon = gicon;
                    icon.icon_size = this._button._caller.settings.get_int('menu-button-icon-size');
                    return icon;
                }
                icon = app.create_icon_texture(this._button._caller.settings.get_int('menu-button-icon-size'));
                break;
            default:
                icon = new St.Icon({
                    style_class: 'icon-dropshadow',
                });
                _icon_name = "filemanager-app";
                gicon = Gio.icon_new_for_string(_icon_name);
                icon.gicon = gicon;
                icon.icon_size = this._button._caller.settings.get_int('menu-button-icon-size'); 
        } // switch (this.item.type) //
        if(!icon){
            icon = new St.Icon({
                style_class: 'icon-dropshadow',
            });
            let gicon;
            _icon_name = "filemanager-app";
            gicon = Gio.icon_new_for_string(_icon_name);
            icon.gicon = gicon;
            icon.icon_size = this._button._caller.settings.get_int('menu-button-icon-size');
        }
        return icon;
    } // getIcon() //

    _updateIcon() {
        let icon = this.getIcon();
        if(icon){
            icon.style_class = 'icon-dropshadow';
            this._iconBin.set_child(icon);
        }
    }

    activate(event) {
        let t = null;
        const LM = LogMessage;
        const id = LogMessage.get_prog_id();
        //t        = typeof _self;
        //LM.log_message(id, `ApplicationMenuItem::activate: _self == ‷${_self}‴ of type ‷${t}‴.`, new Error());
        t        = typeof event;
        LM.log_message(id, `ApplicationMenuItem::activate: event == ‷${event}‴ of type ‷${t}‴.`, new Error());
        /*
        if(Array.isArray(event)){
            event = event.map(elt => elt instanceof Clutter.Event);
            t        = typeof event;
            LM.log_message(
                id, `ApplicationMenuItem::activate: event == ‷${event}‴ of type ‷${t}‴.`, new Error()
            );
            if(Array.isArray(event)){
                event = event[0];
                t        = typeof event;
                LM.log_message(
                    id, `ApplicationMenuItem::activate: event == ‷${event}‴ of type ‷${t}‴.`, new Error()
                );
            }
        }
        t        = typeof event;
        LM.log_message(id, `ApplicationMenuItem::activate: event == ‷${event}‴ of type ‷${t}‴.`, new Error());
        // */
        super.activate(event);
        let dlg         = null;
        const index     = this._item.index;
        let _dir        = null;
        let _file_name  = null;
        let _dialogtype = Gzz.GzzDialogType.Open;
        let filesfile   = null;
        let app         = null;
        let elt         = null;
        const env       = GLib.get_environ();
        let   editor    = GLib.environ_getenv(env, 'EDITOR');
        if(!editor) editor = GLib.environ_getenv(env, 'VISUAL');
        if(!editor) editor = 'vim';
        if(GLib.find_program_in_path(editor) === null){
            editor = 'nano';
        }
        filesfile = this._button._caller.files[index];
        /*
        dlg          = new Gzz.GzzMessageDialog('ApplicationMenuItem::activate(event)', `Proccessing event: ‷${event}‴.`);
        LogMessage.log_message(LogMessage.get_prog_id(), `ApplicationMenuItem::activate: dlg == ‷${dlg}‴`, new Error());
        dlg.open();
        dlg          = null;
        // */
        try {
            t       = typeof this._item;
            LogMessage.log_message(LogMessage.get_prog_id(), `ApplicationMenuItem::activate: this._item == ‷${JSON.stringify(this._item)}‴ of type ‷${t}‴.`, new Error());
            const string2enum = {
                settings:       0,
                fileDisplay:    1,
                filesIconsPage: 2,
                filesScroller:  3,
                editFileEntry:  4,
                aboutPage:      5,
                credits:        6,
            };
            switch (this._item.type) {
                case "dir":
                    switch(this._item.subtype){
                        case 'open':
                            Shell.util_spawn_async(
                                null,
                                ['xdg-open', filesfile,  ],
                                null,
                                GLib.SpawnFlags.SEARCH_PATH
                            );
                            break;
                        case "term":
                            Shell.util_spawn_async(
                                null,
                                [ 'sh', '-c', `cd ${filesfile} && gnome-terminal.wrapper`,  ],
                                null,
                                GLib.SpawnFlags.SEARCH_PATH
                            );
                            break;
                    } // switch(this._item.subtype) //
                    break;
                case "desktop":
                    switch(this._item.subtype){
                        case 'editTerm':
                            Shell.util_spawn_async(
                                null,
                                ['gnome-terminal.wrapper', '-e', editor, filesfile,  ],
                                null,
                                GLib.SpawnFlags.SEARCH_PATH
                            );
                            break;
                        case 'edit':
                            Shell.util_spawn_async(
                                null,
                                ['xdg-open', filesfile,  ],
                                null,
                                GLib.SpawnFlags.SEARCH_PATH
                            );
                            break;
                        case 'run':
                            app = this._caller.appSys.lookup_app(filesfile);
                            if(app !== null){
                                app.activate();
                                return true;
                            }
                            break;
                    } // switch(this._item.subtype) //
                    break;
                case "executable":
                    switch(this._item.subtype){
                        case 'edit':
                            Shell.util_spawn_async(
                                null,
                                ['xdg-open', filesfile  ],
                                null,
                                GLib.SpawnFlags.SEARCH_PATH
                            );
                            break;
                        case 'run':
                            Shell.util_spawn_async(
                                null,
                                [ filesfile ],
                                null,
                                GLib.SpawnFlags.SEARCH_PATH
                            );
                            break;
                        case "runTerm":
                            Shell.util_spawn_async(
                                null,
                                ['gnome-terminal.wrapper', '-e', '/usr/bin/bash', '-cl',  `${filesfile}`,  ],
                                null,
                                GLib.SpawnFlags.SEARCH_PATH
                            );
                            break;
                    } // switch(this._item.subtype) //
                    break;
                case "file":
                    switch(this._item.subtype){
                        case 'edit':
                            Shell.util_spawn_async(
                                null,
                                ['xdg-open', filesfile,  ],
                                null,
                                GLib.SpawnFlags.SEARCH_PATH
                            );
                            break;
                        case "editTerm":
                            Shell.util_spawn_async(
                                null,
                                ['gnome-terminal.wrapper', '-e', editor, filesfile,  ],
                                null,
                                GLib.SpawnFlags.SEARCH_PATH
                            );
                            break;
                        case 'delete':
                            LogMessage.log_message(
                                LogMessage.get_prog_id(),
                                `ApplicationMenuItem::activate: delete: index: ‷${index}‴.`,
                                new Error()
                            );
                            dlg = new Gzz.GzzMessageDialog(
                                _('Are you sure'),
                                _(`Are you sure you want to delete file entry: ‷${this._button._caller.files[index]}⁗.`),
                                'emblem-dialog-question', 
                                [
                                    {
                                        label:   _('Yes'), 
                                        icon_name: 'stock_yes', 
                                        action: () => {
                                            dlg.set_result(true);
                                            this._button._caller.files.splice(index, 1);
                                            this._button._caller.settings.set_strv('files', this._button._caller.files);
                                            dlg.destroy();
                                        }, 
                                    }, 
                                    {
                                        label:   _('No'), 
                                        icon_name: 'stock_no', 
                                        action: () => {
                                            dlg.set_result(false);
                                            dlg.destroy();
                                        }, 
                                    }, 
                                ]
                            );
                            dlg.open();
                            break;
                        case "edit-delete-in-prefs":
                            LogMessage.log_message(
                                LogMessage.get_prog_id(),
                                `ApplicationMenuItem::activate: edit-delete-in-prefs: index: ‷${index}‴.`,
                                new Error()
                            );
                            this._button._caller.settings.set_int('index', index);
                            this._button._caller.settings.set_boolean("edit-page", true);
                            this._button._caller.settings.set_enum('page', string2enum['editFileEntry']);
                            this._button._caller.openPreferences();
                            break;
                        case 'up':
                            LogMessage.log_message(
                                LogMessage.get_prog_id(),
                                `ApplicationMenuItem::activate: up: index: ‷${index}‴.`,
                                new Error()
                            );
                            if(index < 1 || index >= this._button._caller.files.length) break;
                            elt = this._button._caller.files.splice(index, 1)[0];
                            LogMessage.log_message(
                                LogMessage.get_prog_id(),
                                `ApplicationMenuItem::activate: up: elt: ‷${elt}‴.`,
                                new Error()
                            );
                            this._button._caller.files.splice(index - 1, 0, elt);
                            LogMessage.log_message(
                                LogMessage.get_prog_id(),
                                `ApplicationMenuItem::activate: up: this._button._caller.files: ‷${JSON.stringify(this._button._caller.files)}‴.`,
                                new Error()
                            );
                            this._button._caller.settings.set_strv('files', this._button._caller.files);
                            break;
                        case 'down':
                            LogMessage.log_message(
                                LogMessage.get_prog_id(),
                                `ApplicationMenuItem::activate: down: index: ‷${index}‴.`,
                                new Error()
                            );
                            if(index < 0 || index >= this._button._caller.files.length - 1) break;
                            elt = this._button._caller.files.splice(index, 1)[0];
                            LogMessage.log_message(
                                LogMessage.get_prog_id(),
                                `ApplicationMenuItem::activate: down: elt: ‷${elt}‴.`,
                                new Error()
                            );
                            this._button._caller.files.splice(index + 1, 0, elt);
                            LogMessage.log_message(
                                LogMessage.get_prog_id(),
                                `ApplicationMenuItem::activate: down: this._button._caller.files: ‷${JSON.stringify(this._button._caller.files)}‴.`,
                                new Error()
                            );
                            this._button._caller.settings.set_strv('files', this._button._caller.files);
                            break;
                    } // switch(this._item.subtype) //
                    break;
                case "addFile":
                    LogMessage.log_message(LogMessage.get_prog_id(), `ApplicationMenuItem::activate: case addFile: index: ‷${index}‴.`, new Error());
                    _dir        = null;
                    _file_name  = '';
                    _dialogtype = Gzz.GzzDialogType.Open;
                    dlg = new Gzz.GzzFileDialog({
                        title:                'Load File', 
                        dir:                  _dir, 
                        file_name:            _file_name, 
                        dialogtype:           _dialogtype, 
                        display_times:        this._button._caller.settings.get_enum('time-type'), 
                        display_inode:        this._button._caller.settings.get_boolean('display-inode'), 
                        display_user_group:   this._button._caller.settings.get_enum('user-group'), 
                        display_mode:         this._button._caller.settings.get_boolean('display-mode'),
                        display_number_links: this._button._caller.settings.get_boolean('display-number-links'),
                        display_size:         this._button._caller.settings.get_boolean('display-size'),
                        show_icon:            this._button._caller.settings.get_boolean('display-icon'),
                        base2_file_sizes:     this._button._caller.settings.get_boolean('base2-file-sizes'),
                        filter:               Gzz.string2RegExp(new RegExp('^.*$',                      'i'), 'i'), 
                        filters:              [
                            new RegExp('^.*$',                      'i'), 
                        ], 
                        filters_flags:        'i', 
                        double_click_time:    this._button._caller.settings.get_int('double-click-time'), 
                        save_done:            (dlg_, result, _dir, _file_name) => {
                            if(result){
                                filesfile = dlg_.get_full_path();
                                if(filesfile){
                                    this._button._caller.files.unshift(filesfile.get_path());
                                    this._button._caller.settings.set_strv('files', this._button._caller.files);
                                } // if(filesfile) //
                            } // if(result) //
                        }, 
                    });
                    dlg.open();
                    break;
                case "addDir":
                    LogMessage.log_message(LogMessage.get_prog_id(), `ApplicationMenuItem::activate: case addDir: index: ‷${index}‴.`, new Error());
                    _dir        = null;
                    _file_name  = '';
                    _dialogtype = Gzz.GzzDialogType.SelectDir;
                    dlg = new Gzz.GzzFileDialog({
                        title:                'Load File', 
                        dir:                  _dir, 
                        file_name:            _file_name, 
                        dialogtype:           _dialogtype, 
                        display_times:        this._button._caller.settings.get_enum('time-type'), 
                        display_inode:        this._button._caller.settings.get_boolean('display-inode'), 
                        display_user_group:   this._button._caller.settings.get_enum('user-group'), 
                        display_mode:         this._button._caller.settings.get_boolean('display-mode'),
                        display_number_links: this._button._caller.settings.get_boolean('display-number-links'),
                        display_size:         this._button._caller.settings.get_boolean('display-size'),
                        show_icon:            this._button._caller.settings.get_boolean('display-icon'),
                        base2_file_sizes:     this._button._caller.settings.get_boolean('base2-file-sizes'),
                        filter:               Gzz.string2RegExp(new RegExp('^.*$',                      'i'), 'i'), 
                        filters:              [
                            new RegExp('^.*$',                      'i'), 
                        ], 
                        filters_flags:        'i', 
                        double_click_time:    this._button._caller.settings.get_int('double-click-time'), 
                        save_done:            (dlg_, result, _dir, _file_name) => {
                            if(result){
                                filesfile = dlg_.get_dir();
                                if(filesfile){
                                    this._button._caller.files.unshift(filesfile.get_path());
                                    this._button._caller.settings.set_strv('files', this._button._caller.files);
                                } // if(filesfile) //
                            } // if(result) //
                        }, 
                    });
                    dlg.open();
                    break;
                case  "savefile":
                    LogMessage.log_message(LogMessage.get_prog_id(), `savefile: index: ‷${index}‴.`, new Error());
                    this._button.save_to_file();
                    break;
                case "loadfile":
                    LogMessage.log_message(LogMessage.get_prog_id(), `loadfile: index: ‷${index}‴.`, new Error());
                    this._button.get_file_contents();
                    break;
                case "settings":
                case "fileDisplay":
                case "filesIconsPage":
                case "filesScroller":
                case "aboutPage":
                case "credits":
                    LogMessage.log_message(LogMessage.get_prog_id(), `files: settings, etc: this._item.type: ‷${this._item.type}‴.`, new Error());
                    this._button._caller.settings.set_boolean("edit-page", true);
                    this._button._caller.settings.set_enum("page", string2enum[this._item.type]);
                    this._button._caller.openPreferences();
                    break;
            } // switch (this._item.type) //
        }
        catch(e){
            LogMessage.log_message(LogMessage.get_prog_id(), `${e.stack}`, e);
            LogMessage.log_message(LogMessage.get_prog_id(), `Exception ‷${e}‴`, e);
            this._button._caller.display_error_msg('ApplicationMenuItem::activate', `Exception ‷${e}‴`, e);
        }
    } // activate(event) //

} // class ApplicationMenuItem extends PopupMenu.PopupBaseMenuItem //

class Indicator extends PanelMenu.Button {
    static {
        GObject.registerClass(this);
    }

    constructor(caller) {
        super(0.0, _('Files Launcher'));
        this._caller = caller;
        this.appSys = this._caller.appSys;


        this.icon = new St.Icon({
            icon_name: 'filemanager-app',
            style_class: 'system-status-icon',
        });

        this._caller.settings.connectObject('changed::hide-icon-shadow', () => this.hideIconShadow(), this);
        this._caller.settings.connectObject('changed::menu-button-icon-image', () => this.setIconImage(), this);
        this._caller.settings.connectObject('changed::monochrome-icon', () => this.setIconImage(), this);
        this._caller.settings.connectObject('changed::use-custom-icon', () => this.setIconImage(), this);
        this._caller.settings.connectObject('changed::custom-icon-path', () => this.setIconImage(), this);
        this._caller.settings.connectObject('changed::menu-button-icon-size', () => this.setIconSize(), this);
	
        this.hideIconShadow();
        this.setIconImage();
        this.setIconSize();

        this.add_child(this.icon);

        const tmp = this._caller.settings.get_string("filespath").trim();

        const filespath = ((tmp == '') ?
            GLib.build_filenamev([GLib.get_home_dir()]) :
                                    GLib.build_filenamev([tmp]));

        this.dir_path = Gio.File.new_for_path(filespath);
        this._caller.settings.set_boolean('edit-page', this._caller.edit_page);

        const file_name = this._caller.filesname.trim();
        
        this._caller.filesname     = ((file_name == '') ? 'files.txt' : file_name);

        this.loadFileEntries();

    } // constructor(caller) //

    save_to_file(){
        const file_name = this._caller.filesname.trim();
        const path      = this._caller.filespath.get_path();
        const cont      = this._caller.files.join("\r\n");
        const _dialogtype = Gzz.GzzDialogType.Save;
        LogMessage.log_message(LogMessage.get_prog_id(), `file_name: ‷${file_name}‴.`, new Error());
        LogMessage.log_message(LogMessage.get_prog_id(), `path: ‷${path}‴.`, new Error());
        LogMessage.log_message(LogMessage.get_prog_id(), `cont: ‷${cont}‴.`, new Error());
        LogMessage.log_message(LogMessage.get_prog_id(), `_dialogtype: ‷${JSON.stringify(_dialogtype)}‴.`, new Error());
        const dlg       = new Gzz.GzzFileDialog({
            title:                _("Save messages as file"),
            dialogtype:           _dialogtype,
            dir:                  path, 
            file_name:            ((file_name == '') ? 'files.txt' : file_name), 
            contents:             cont, 
            filter:               Gzz.string2RegExp(this._caller.settings.get_string('filter'), 'i'), 
            filters:              [
                new RegExp('^.*\\.txt$',                'i'), 
                new RegExp('^.*\\.files$',              'i'), 
                new RegExp('^(?:.*\\.txt|.*\\.files)$', 'i'), 
                new RegExp('^.*$',                      'i'), 
            ], 
            filters_flags:        'i', 
            icon_size:            this._caller.settings.get_int('icon-size'), 
            display_times:        this._caller.settings.get_enum('time-type'), 
            display_inode:        this._caller.settings.get_boolean('display-inode'), 
            display_user_group:   this._caller.settings.get_enum('user-group'), 
            display_mode:         this._caller.settings.get_boolean('display-mode'),
            display_number_links: this._caller.settings.get_boolean('display-number-links'),
            display_size:         this._caller.settings.get_boolean('display-size'),
            base2_file_sizes:     this._caller.settings.get_boolean('base2-file-sizes'),
            show_icon:            this._caller.settings.get_boolean('display-icon'),
            double_click_time:    this._caller.settings.get_int('double-click-time'), 
            save_done:            (dlg_, result, dir_, file_name_) => {
                if(result){
                    if(dir_){
                        this._caller.settings.set_string("filespath", dir_.get_path());
                    }
                    if(file_name_ && (file_name_ instanceof String || typeof file_name_ === 'string')){
                        this._caller.settings.set_string("filesname", file_name_);
                    }
                    const filter_ = dlg_.get_filter().toString();
                    if(filter_){
                        this._caller.settings.set_string("filter", filter_);
                    }
                } // if(result) //
            }, 
        });
        dlg.open();
    } // save_to_file() //

    get_file_contents(){
        let filesfile = null;
        let ok        = null;
        let contents  = null;
        let _etag     = null;
        let dlg       = null;
        try {
            const _dir        = this._caller.filespath;
            const _file_name  = this._caller.filesname;
            const _dialogtype = Gzz.GzzDialogType.Open;
            dlg = new Gzz.GzzFileDialog({
                title:                'Load File', 
                dir:                  _dir, 
                file_name:            _file_name, 
                dialogtype:           _dialogtype, 
                display_times:        this._caller.settings.get_enum('time-type'), 
                display_inode:        this._caller.settings.get_boolean('display-inode'), 
                display_user_group:   this._caller.settings.get_enum('user-group'), 
                display_mode:         this._caller.settings.get_boolean('display-mode'),
                display_number_links: this._caller.settings.get_boolean('display-number-links'),
                display_size:         this._caller.settings.get_boolean('display-size'),
                show_icon:            this._caller.settings.get_boolean('display-icon'),
                base2_file_sizes:     this._caller.settings.get_boolean('base2-file-sizes'),
                filter:               Gzz.string2RegExp(this._caller.settings.get_string('filter'), 'i'), 
                filters:              [
                    new RegExp('^.*\\.txt$',                'i'), 
                    new RegExp('^.*\\.files$',              'i'), 
                    new RegExp('^(?:.*\\.txt|.*\\.files)$', 'i'), 
                    new RegExp('^.*$',                      'i'), 
                ], 
                filters_flags:        'i', 
                double_click_time:    this._caller.settings.get_int('double-click-time'), 
                save_done:            (dlg_, result, _dir, _file_name) => {
                    if(result){
                        filesfile = dlg_.get_full_path();
                        if(filesfile){
                            [ok, contents, _etag]  = filesfile.load_contents(null);            
                            if(ok){
                                const contents_ = new TextDecoder().decode(contents);
                                let max_length = -1;
                                let min_length = this._caller.max_file_entry_length + 1;
                                let files      = []
                                let cnt        = 0;
                                LogMessage.log_message( 'files', `Indicator::callback: contents_ == ${contents_}`, new Error());
                                LogMessage.log_message( 'files', `Indicator::callback: typeof contents_ == ${typeof contents_}`, new Error());
                                LogMessage.log_message( 'files', `Indicator::callback: contents_ == ${JSON.stringify(contents_)}`, new Error());
                                const array_of_files = contents_.split("\r\n");
                                for(const file of array_of_files){
                                    max_length = Math.max(max_length, file.length);
                                    min_length = Math.min(min_length, file.length);
                                    if(0 < file.length && file.length <= this._caller.max_file_entry_length){
                                        cnt++;
                                        if(cnt > this._caller.show_messages){
                                            continue;
                                        }
                                        files.push(file);
                                    }
                                } // for(const file of array_of_files) //
                                this._caller.filesname = dlg.get_file_name();
                                this._caller.filespath = dlg.get_dir();
                                this._caller.settings.set_string("filesname", this._caller.filesname);
                                this._caller.settings.set_string("filespath", this._caller.filespath.get_path());
                                if(files.length > 0){
                                    this._caller.files = files;
                                    this._caller.settings.set_strv('files', this._caller.files);
                                }else{
                                    this._caller.display_error_msg(
                                        'Indicator::get_file_contents',
                                        'Error: bad file none of the files where of a suitable size.', 
                                        new Error()
                                    );
                                }
                                if(min_length == 0){
                                    this._caller.display_error_msg(
                                        'Indicator::get_file_contents',
                                        'Error: some of the files where empty they were skipped.', 
                                        new Error()
                                    );
                                }
                                if(max_length > this._caller.max_file_entry_length){
                                    this._caller.display_error_msg('Indicator::get_file_contents',
                                        "Error: some of the files where too big they were skipped.\n"
                                         + " THis can be caused by a change in the max_file_entry_length property. "
                                         + `currently set at ${this._caller.max_file_entry_length}`, 
                                        new Error()
                                    );
                                }
                            } // if(ok) //
                        } // if(filesfile) //
                        const filter_ = dlg_.get_filter().toString();
                        if(filter_){
                            this._caller.settings.set_string("filter", filter_);
                        }
                    } // if(result) //
                }, 
            });
            dlg.open();
        }catch(e){
            LogMessage.log_message(LogMessage.get_prog_id(), `${e.stack}`, e);
            LogMessage.log_message(LogMessage.get_prog_id(), `Error: in Indicator::get_file_contents() ‷${e}‴:`, e);
            this._caller.display_error_msg('Indicator::get_file_contents_error', `Error: in Indicator::get_file_contents() ${e}`, e);
        }
    }  // get_file_contents() //
    
    loadFileEntries(){
        let item = null;
        let ok      = null;
        let data    = null;
        let submenu = null;
        submenu = new PopupMenu.PopupSubMenuMenuItem(_('Actions'), true, this, 0);

        item = new ApplicationMenuItem(this, { text: _('Save to file...'), type: 'savefile', index: 0, subtype: 'None', });
        //item.connect('activate', (event) => { item.activate(event); });
        submenu.menu.addMenuItem(item);

        item = new ApplicationMenuItem(this, { text: _('Load from file...'), type: 'loadfile', index: 0, subtype: 'None', });
        //item.connect('activate', (event) => { item.activate(event); });
        submenu.menu.addMenuItem(item);

        item = new ApplicationMenuItem(this, { text: _('Add File...'), type: 'addFile', index: 0, subtype: 'None', });
        //item.connect('activate', (event) => { item.activate(event); });
        submenu.menu.addMenuItem(item);

        item = new ApplicationMenuItem(this, { text: _('Add Dir...'), type: 'addDir', index: 0, subtype: 'None', });
        //item.connect('activate', (event) => { item.activate(event); });
        submenu.menu.addMenuItem(item);

        this.menu.addMenuItem(submenu);

        submenu = new PopupMenu.PopupSubMenuMenuItem(_('Preferences & About'), true, this, 0);

        submenu.menu.addMenuItem(new PopupMenu.PopupSeparatorMenuItem());

        item = new ApplicationMenuItem(this, { text: _('Settings...'), type: 'settings', index: 0, subtype: 'None', });

        submenu.menu.addMenuItem(item);

        item = new ApplicationMenuItem(this, { text: _('File Display Settings...'), type: 'fileDisplay', index: 0, subtype: 'None', });

        submenu.menu.addMenuItem(item);

        item = new ApplicationMenuItem(this, { text: _('Icon Settings...'), type: 'filesIconsPage', index: 0, subtype: 'None', });

        submenu.menu.addMenuItem(item);

        item = new ApplicationMenuItem(this, { text: _('Files Scroller...'), type: 'filesScroller', index: 0, subtype: 'None', });
        //item.connect('activate', (event) => { item.activate(event); });
        submenu.menu.addMenuItem(item);
        item = new ApplicationMenuItem(this, { text: _('About...'), type: 'aboutPage', index: 0, subtype: 'None', });
        //item.connect('activate', (event) => { item.activate(event); });
        submenu.menu.addMenuItem(item);
        item = new ApplicationMenuItem(this, { text: _('Credits...'), type: 'credits', index: 0, subtype: 'None', });
        //item.connect('activate', (event) => { item.activate(event); });
        submenu.menu.addMenuItem(item);

        this.menu.addMenuItem(submenu);

        this.menu.addMenuItem(new PopupMenu.PopupSeparatorMenuItem());

        this._caller.files = this._caller.settings.get_strv('files');
        const len = this._caller.files.length;
        LogMessage.log_message( LogMessage.get_prog_id(), `Indicator::loadFileEntries: len  == ‷${len}‴`, new Error());
        const length = Math.min(this._caller.settings.get_int('show-messages'), len);
        LogMessage.log_message( LogMessage.get_prog_id(), `Indicator::loadFileEntries: length  == ‷${length}‴`, new Error());
        for(let i = 0; i < length; i++){
            submenu = new PopupMenu.PopupSubMenuMenuItem(this._caller.files[i], true, this, 0);
            const file = Gio.File.new_for_path(this._caller.files[i]);
            if(!file) continue;
            [ok, data] = Gzz.fileData(file);
            if(ok){
                if(data.is_dir){
                    item         = new ApplicationMenuItem(this,
                        { text: 'Open in File Manager...', index: i, type: 'dir', subtype: 'open', });
                    //item.connect('activate', (event) => { item.activate(event); });
                    submenu.menu.addMenuItem(item);
                    item         = new ApplicationMenuItem(this,
                        { text: 'Open in Terminal...', index: i, type: 'dir', subtype: 'term', });
                    //item.connect('activate', (event) => { item.activate(event); });
                    submenu.menu.addMenuItem(item);
                }else if(data.is_executable){
                    const matches = data.name.match(/^.*\.desktop$/);
                    if(matches){
                        item         = new ApplicationMenuItem(this,
                            { text: 'Open...', index: i, type: 'desktop', subtype: 'edit', });
                        //item.connect('activate', (event) => { item.activate(event); });
                        submenu.menu.addMenuItem(item);
                        item         = new ApplicationMenuItem(this,
                            { text: 'Run in Terminal...', index: i, type: 'desktop', subtype: 'editTerm', });
                        //item.connect('activate', (event) => { item.activate(event); });
                        submenu.menu.addMenuItem(item);
                        item         = new ApplicationMenuItem(this,
                            { text: 'Run...', index: i, type: 'desktop', subtype: 'run', });
                        //item.connect('activate', (event) => { item.activate(event); });
                        submenu.menu.addMenuItem(item);
                    }else{
                        item         = new ApplicationMenuItem(this,
                            { text: 'Open...', index: i, type: 'executable', subtype: 'edit', });
                        //item.connect('activate', (event) => { item.activate(event); });
                        submenu.menu.addMenuItem(item);
                        item         = new ApplicationMenuItem(this,
                            { text: 'Run...', index: i, type: 'executable', subtype: 'run', });
                        //item.connect('activate', (event) => { item.activate(event); });
                        submenu.menu.addMenuItem(item);
                        item         = new ApplicationMenuItem(this,
                            { text: 'Run in Terminal...', index: i, type: 'executable', subtype: 'runTerm', });
                        //item.connect('activate', (event) => { item.activate(event); });
                        submenu.menu.addMenuItem(item);
                    }
                }else{ // if(data.is_dir) //
                    item         = new ApplicationMenuItem(this,
                        { text: 'Open...', index: i, type: 'file', subtype: 'edit', });
                    //item.connect('activate', (event) => { item.activate(event); });
                    submenu.menu.addMenuItem(item);
                    const [ok_, type_, _subtype, _params, ] = Gzz.mime_type(this._caller.files[i]);
                    LogMessage.log_message(
                        LogMessage.get_prog_id(), `Indicator::loadFileEntries: ok_  == ‷${ok_}‴`, new Error()
                    );
                    LogMessage.log_message(
                        LogMessage.get_prog_id(), `Indicator::loadFileEntries: type_  == ‷${type_}‴`, new Error()
                    );
                    if(ok_ && type_ == 'text') {
                        item         = new ApplicationMenuItem(this,
                            { text: 'Open in Terminal...', index: i, type: 'file', subtype: 'editTerm', });
                        //item.connect('activate', (event) => { item.activate(event); });
                        submenu.menu.addMenuItem(item);
                    }
                }
            } // if(ok) //
            if(i == 0){
                item = new ApplicationMenuItem(this, { text: 'down ▼', index: i, type: 'file', subtype: 'down', });
                submenu.menu.addMenuItem(item);
            }else if(i == len - 1){
                item = new ApplicationMenuItem(this, { text: 'up ▲', index: i, type: 'file', subtype: 'up', });
                submenu.menu.addMenuItem(item);
            }else{
                item = new ApplicationMenuItem(this, { text: 'up ▲', index: i, type: 'file', subtype: 'up', });
                submenu.menu.addMenuItem(item);
                item = new ApplicationMenuItem(this, { text: 'down ▼', index: i, type: 'file', subtype: 'down', });
                submenu.menu.addMenuItem(item);
            }
            item         = new ApplicationMenuItem(this,
                { text: 'Remove File from menu...', index: i, type: 'file', subtype: 'delete', });
            //item.connect('activate', (event) => { item.activate(event); });
            submenu.menu.addMenuItem(item);
            item         = new ApplicationMenuItem(this,
                { text: 'Edit or Remove File from menu...', index: i, type: 'file', subtype: 'edit-delete-in-prefs', });
            //item.connect('activate', (event) => { item.activate(event); });
            submenu.menu.addMenuItem(item);
            this.menu.addMenuItem(submenu);
        } // for(let i = 0; i < length; i++) //
    } // loadFileEntries() //

    refesh_menu(){
        LogMessage.log_message(LogMessage.get_prog_id(), "Indicator::refesh_menu: starting.", new Error());
        this.menu.box.destroy_all_children();
        this.loadFileEntries();
        LogMessage.log_message(LogMessage.get_prog_id(), "Indicator: done.", new Error());
    }

    setIconImage() {
        const iconIndex = this._caller.settings.get_int('menu-button-icon-image');
        const isMonochrome = this._caller.settings.get_boolean('monochrome-icon');
        const useCustomIcon = this._caller.settings.get_boolean('use-custom-icon');
        const customIconPath = this._caller.settings.get_string('custom-icon-path');
        let iconPath;
        let notFound = false;

        if (useCustomIcon && customIconPath !== '') {
            iconPath = customIconPath;
            const fileExists = GLib.file_test(iconPath, GLib.FileTest.IS_REGULAR);
            if(!fileExists){
                iconPath = 'start-here-symbolic';
                this._caller.settings.set_boolean('monochrome-icon', true);
                this._caller.settings.set_int('menu-button-icon-image', 0);
                this._caller.settings.set_boolean('use-custom-icon', false);
            }
        } else if (isMonochrome) {
            if (Constants.MonochromeFileIcons[iconIndex] !== undefined) {
                iconPath = Constants.MonochromeFileIcons[iconIndex].PATH;
            } else {
                notFound = true;
            }
        } else {
            if (Constants.ColouredFileIcons[iconIndex] !== undefined) {
                iconPath = Constants.ColouredFileIcons[iconIndex].PATH;
            } else {
                notFound = true;
            }
        }

        if (notFound) {
            iconPath = 'start-here-symbolic';
            this._caller.settings.set_boolean('monochrome-icon', true);
            this._caller.settings.set_int('menu-button-icon-image', 0);
        }

        this.icon.gicon = Gio.icon_new_for_string(iconPath);
    }

    setIconSize() {
        const iconSize = this._caller.settings.get_int('menu-button-icon-size');
        this.icon.icon_size = iconSize;
    }
    
    hideIconShadow() {
    	const iconShadow = this._caller.settings.get_boolean('hide-icon-shadow');
    	
        if(!iconShadow){
            this.icon.add_style_class_name('system-status-icon'); 
        } else {
            this.icon.remove_style_class_name('system-status-icon');
        }
    }

} // class Indicator extends PanelMenu.Button //


export default class FilesLauncherExtension extends Extension {

    constructor(metadata){
        super(metadata);
        this._indicator           = null;
        this.settings             = null;
        const id                  = this.uuid;
        const indx                = id.indexOf('@');
        this._name                = id.substr(0, indx);
        this.settings_change_self = false;
        this.areas                = ["left", "center", "right"];
    }

    enable() {
        this.appSys                  = Shell.AppSystem.get_default();
        this.settings                = this.getSettings();
        this.show_messages           = this.settings.get_int("show-messages");
        this.page_name               = this.settings.get_enum("page");
        this.index                   = this.settings.get_int("index");
        this.files                   = this.settings.get_strv("files");
        this.max_file_entry_length   = this.settings.get_int("max-file-entry-length");
        this.edit_page               = this.settings.get_boolean("edit-page");
        this.filesname               = this.settings.get_string("filesname");
        const tmp_path               = this.settings.get_string("filespath").trim();
        this.set_filespath(tmp_path);
        
        LogMessage.set_prog_id('files-launcher');
        LogMessage.set_show_logs(this.settings.get_boolean('show-logs'));
        this.settings.set_enum('area', this.settings.get_enum('area'));
        if(this.settings.get_int("position") < 0 || this.settings.get_int("position") > 25) this.settings.set_int("position", 0);
        this.settings.set_int('max-file-entry-length', this.max_file_entry_length);
        this.settings.set_int('show-messages', this.settings.get_int('show-messages'));
        this._indicator       = new Indicator(this);
        const area            = this.areas[this.settings.get_enum("area")];
        LogMessage.log_message(LogMessage.get_prog_id(), `area == ${area}`, new Error());
        Main.panel.addToStatusArea(this._name, this._indicator, this.settings.get_int("position"), area);

        this.settingsID_show     = this.settings.connect("changed::show-messages", () => {
            this.show_messages   = this.settings.get_int("show-messages");
            this._indicator.refesh_menu();
        }); 
        this.settingsID_area     = this.settings.connect("changed::area", this.onPositionChanged.bind(this)); 
        this.settingsID_pos      = this.settings.connect("changed::position", this.onPositionChanged.bind(this)); 
        this.settingsID_files    = this.settings.connect("changed::files", this.onFilesChanged.bind(this)); 
        this.settingsID_max      = this.settings.connect("changed::max-file-entry-length", () => {
            this.max_file_entry_length = this.settings.get_int("max-file-entry-length");
            this._indicator.refesh_menu();
        }); 
        this.settingsID_dir      = this.settings.connect('changed::filespath', () => {
            this.set_filespath(this.settings.get_string("filespath").trim());
        });
        this.settingsID_filename = this.settings.connect('changed::filesname', () => {
            this.filesname         = this.settings.get_string("filesname");
        });
        this.settingsID_icon_size = this.settings.connect('changed::menu-button-icon-size', () => {
            this._indicator.refesh_menu();
        });
        this.settingsID_show_logs = this.settings.connect('changed::show-logs', () => {
            LogMessage.set_show_logs(this.settings.get_boolean('show-logs'));
        });
    }

    set_filespath(path_){
        LogMessage.log_message(LogMessage.get_prog_id(), `FilesLauncherExtension::set_filespath: path_: ${path_}`, new Error());
        if(!path_){
            this.filespath = Gio.File.new_for_path(GLib.build_filenamev([GLib.get_home_dir()]));
            this.settings.set_string("filespath", this.filespath.get_path());
        }else if(path_ instanceof String){
            const path = GLib.build_filenamev([path_.toString()]);
            if(path){
                this.filespath = Gio.File.new_for_path(path);
            }else{
                LogMessage.log_message(
                    LogMessage.get_prog_id(), 
                    `FilesLauncherExtension::set_filespath_error: bad value for path: ${path}: `
                    + `genrated from path_: ${path_}:`, 
                    new Error()
                );
                this.display_error_msg(
                    'FilesLauncherExtension::set_filespath',
                    `FilesLauncherExtension::set_filespath: bad value for path: ${path} genrated from path_: ${path_}: `, 
                    new Error()
                );
            }
        }else{ // if(!path_) else if(path_ instanceof String) //
            const path = GLib.build_filenamev([path_.toString()]);
            if(path){
                this.filespath = Gio.File.new_for_path(path);
            }else{
                LogMessage.log_message(
                    LogMessage.get_prog_id(), 
                    `FilesLauncherExtension::set_filespath_error: bad value for path: ${path}: `
                    + `genrated from path_: ${path_}:`, 
                    new Error()
                );
                this.display_error_msg(
                    'FilesLauncherExtension::set_filespath',
                    `FilesLauncherExtension::set_filespath: bad value for path: ${path} genrated from path_: ${path_}: `,
                    new Error()
                );
            } // if(path) ... else ... //
        } // if(!path_) else if(path_ instanceof String) ... else ... //
    } // set_filespath(path_) //

    disable() {
        this._indicator.destroy();
        this.settings.disconnect(this.settingsID_show);
        this.settings.disconnect(this.settingsID_area);
        this.settings.disconnect(this.settingsID_pos);
        this.settings.disconnect(this.settingsID_files);
        this.settings.disconnect(this.settingsID_max);
        this.settings.disconnect(this.settingsID_dir);
        this.settings.disconnect(this.settingsID_filename);
        delete this.appSys;
        delete this.settings;
        this._indicator = null;
    }

    display_error_msg(title, description, e = null){
        if(e && e instanceof Error){
            description += `${e.fileName}:${e.lineNumber}:${e.columnNumber}`;
        }
        const dlg = new Gzz.GzzMessageDialog(title, description, 'dialog-error');
        dlg.open();
    }

    onPositionChanged(){
        Main.panel.menuManager.removeMenu(this._indicator.menu);
        Main.panel.statusArea[this._name] = null;
        const area      = this.areas[this.settings.get_enum("area")];
        LogMessage.log_message(LogMessage.get_prog_id(), `area == ${area}`, new Error());
        const position  = this.settings.get_int("position");
        Main.panel.addToStatusArea(this._name, this._indicator, position, area);
    }

    onFilesChanged(){
        if(this.settings_change_self){
            this.settings_change_self = false;
        }else{
            this.files                        = this.settings.get_strv("files");
            LogMessage.log_message(LogMessage.get_prog_id(), `FilesLauncherExtension::onFilesChanged: this.files: ${JSON.stringify(this.files)}`, new Error());
            this._indicator.refesh_menu();
            LogMessage.log_message(LogMessage.get_prog_id(), `FilesLauncherExtension::onFilesChanged: this.files: ${JSON.stringify(this.files)}`, new Error());
        }
    }

} // export default class FilesLauncherExtension extends Extension //
