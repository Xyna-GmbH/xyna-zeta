/*
 * - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
 * Copyright 2022 GIP SmartMercial GmbH, Germany
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *  http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 * - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
 */
import { Component, EventEmitter, Input, Output, ViewChild } from '@angular/core';
import { MatMenu, MenuPositionX, MenuPositionY } from '@angular/material/menu';

import { coerceBoolean } from '../../base';
import { XcItem } from '../shared/xc-item';


export interface XcMenuItem extends XcItem {
    children?: this[];
    translate?: boolean;
    click?: (item: this) => void;
    visible?: (item: this) => boolean;
    aside?: string;
}


export type XcMenuXPosition = MenuPositionX;
export type XcMenuYPosition = MenuPositionY;
export type XcMenuOptions = {
    xNexttoTrigger?: boolean;
    yNexttoTrigger?: boolean;
    withArrow?: boolean;
    xOffset?: number;
    yOffset?: number;
    xPosition?: XcMenuXPosition;
    yPosition?: XcMenuYPosition;
};


export function XcMenuOptionsDefault(): XcMenuOptions {
    return {
        xNexttoTrigger: false,
        yNexttoTrigger: false,
        withArrow: false,
        xOffset: 0,
        yOffset: 0,
        xPosition: 'after',
        yPosition: 'below'
    };
}


export interface XcMenu extends MatMenu, XcMenuOptions {
    // compensate optional property difference between interfaces
    xPosition: XcMenuXPosition;
    yPosition: XcMenuYPosition;
    // accessed by trigger
    overlapTrigger: any;
    templateRef: any;
    close: any;
    focusFirstItem: any;
    resetActiveItem: any;
}


@Component({
    selector: 'xc-menu',
    templateUrl: './xc-menu.component.html',
    styleUrls: ['./xc-menu.component.scss']
})
export class XcMenuComponent {

    /*
     * Sadly, there is no support for not overlapping the trigger horizontally.
     * That's why we have to do it here by ourselves, until that feature has been implemented.
     * See https://github.com/angular/material2/pull/8401 for reference.
     */

    private _menu: XcMenu;
    readonly options: XcMenuOptions = XcMenuOptionsDefault();

    @ViewChild('matMenu', {static: true, read: MatMenu})
    set menu(value: XcMenu) {
        this._menu = value;
        // set custom settings to menu
        this.menu.xNexttoTrigger = this.options.xNexttoTrigger;
        this.menu.yNexttoTrigger = this.options.yNexttoTrigger;
        this.menu.withArrow = this.options.withArrow;
        this.menu.xOffset = this.options.xOffset;
        this.menu.yOffset = this.options.yOffset;
        // it is now necessary to manually add correct css classes in order to be able to position the menu's arrow (tip)
        // See https://github.com/angular/material2/pull/10868/files/4883a56c31634b8e414d671157d34a08057ff64e
        this.menu.setPositionClasses = (posX = this.options.xPosition, posY = this.options.yPosition) => {
            this.menu._classList['mat-menu-before'] = posX === 'before';
            this.menu._classList['mat-menu-after'] = posX === 'after';
            this.menu._classList['mat-menu-above'] = posY === 'above';
            this.menu._classList['mat-menu-below'] = posY === 'below';
        };
    }

    get menu(): XcMenu {
        return this._menu;
    }

    get isRootMenu(): boolean {
        return !this.menu.parentMenu;
    }

    get panelClass(): string {
        if (this.options.withArrow && this.isRootMenu) {
            if (this.options.xNexttoTrigger && !this.options.yNexttoTrigger) {
                return 'with-arrow-x';
            }
            if (this.options.yNexttoTrigger && !this.options.xNexttoTrigger) {
                return 'with-arrow-y';
            }
        }
        return '';
    }

    @Input('xc-menu-x-nextto-trigger')
    set xNexttoTrigger(value: boolean) {
        this.options.xNexttoTrigger = coerceBoolean(value);
        if (this.menu) {
            this.menu.xNexttoTrigger = this.options.xNexttoTrigger;
        }
    }

    @Input('xc-menu-y-nextto-trigger')
    set yNexttoTrigger(value: boolean) {
        this.options.yNexttoTrigger = coerceBoolean(value);
        if (this.menu) {
            this.menu.yNexttoTrigger = this.options.yNexttoTrigger;
        }
    }

    @Input('xc-menu-with-arrow')
    set withArrow(value: boolean) {
        this.options.withArrow = coerceBoolean(value);
        if (this.menu) {
            this.menu.withArrow = this.options.withArrow;
        }
    }

    @Input('xc-menu-x-offset')
    set xOffset(value: number) {
        this.options.xOffset = value;
        if (this.menu) {
            this.menu.xOffset = this.options.xOffset;
        }
    }

    @Input('xc-menu-y-offset')
    set yOffset(value: number) {
        this.options.yOffset = value;
        if (this.menu) {
            this.menu.yOffset = this.options.yOffset;
        }
    }

    @Input('xc-menu-x-position')
    set xPosition(value: XcMenuXPosition) {
        this.options.xPosition = value;
        // no need to set value to menu, since it is via setPositionClasses
    }

    @Input('xc-menu-y-position')
    set yPosition(value: XcMenuYPosition) {
        this.options.yPosition = value;
        // no need to set value to menu, since it is via setPositionClasses
    }

    @Input('xc-menu-items')
    items = new Array<XcMenuItem>();

    @Output('xc-menu-item-select')
    // eslint-disable-next-line @angular-eslint/no-output-native
    readonly select = new EventEmitter<XcMenuItem>();

    selectItem(item: XcMenuItem) {
        this.select.emit(item);
    }

    clickItem(item: XcMenuItem) {
        item.click?.(item);
        this.selectItem(item);
    }
}
