/*
 * - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
 * Copyright 2023 Xyna GmbH, Germany
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
import { FlexibleConnectedPositionStrategy } from '@angular/cdk/overlay';
import { Directive, ElementRef, EventEmitter, HostBinding, HostListener, Input, Output } from '@angular/core';
import { MatMenu, MatMenuTrigger } from '@angular/material/menu';

import { XcMenu, XcMenuComponent } from './xc-menu.component';


@Directive({
    selector: '[xc-menu-trigger]',
    standalone: false
})
export class XcMenuTriggerDirective extends MatMenuTrigger {

    @HostBinding('attr.aria-haspopup')
    readonly ariaHasPopup = true;

    @Output('xc-menu-trigger')
    readonly xcMenuTriggerEmitter = new EventEmitter();


    @Input('xc-menu-trigger')
    set xcMenuTrigger(value: XcMenuComponent) {
        this.menu = value?.menu;
    }


    @HostListener('keydown.space')
    @HostListener('keydown.enter')
    @HostListener('mousedown')
    trigger() {
        this.xcMenuTriggerEmitter.emit();
    }


    get xcMenu(): XcMenu {
        return this.menu as XcMenu;
    }


    get hasMenuItems(): boolean {
        return !!this.xcMenu && this.xcMenu._allItems.length > 0;
    }


    _handleKeydown(event: KeyboardEvent) {
        if (this.hasMenuItems) {
            super._handleKeydown(event);
        }
    }


    _handleMousedown(event: MouseEvent) {
        if (this.hasMenuItems) {
            super._handleMousedown(event);
        }
    }


    _handleClick(event: MouseEvent) {
        if (this.hasMenuItems) {
            super._handleClick(event);
        }
    }


    // override private function
    [(() => '_setPosition')()](menu: MatMenu, positionStrategy: FlexibleConnectedPositionStrategy) {
        // super call
        // eslint-disable-next-line @typescript-eslint/dot-notation
        super['_setPosition'].call(this, menu, positionStrategy);

        if (this.triggersSubmenu()) {
            // affects nested menus only
            // adjust menu's offset-y for a 1px border added to its panel and an adjusted 0px padding of its content
            positionStrategy._preferredPositions.forEach(preferredPosition => {
                const aboveFactor = preferredPosition.originY === 'bottom' ? 1 : -1;
                preferredPosition.offsetY += aboveFactor * (1 - 8);
            });
        } else {
            // affects root menus only
            // eslint-disable-next-line @typescript-eslint/dot-notation
            const rect = (this['_element'] as ElementRef).nativeElement.getBoundingClientRect();
            positionStrategy._preferredPositions.forEach(preferredPosition => preferredPosition.offsetX = 0);
            // adjust menu's offset-x for the width of the trigger's element
            if (this.xcMenu.xNexttoTrigger) {
                positionStrategy._preferredPositions.forEach(preferredPosition => {
                    const afterFactor = preferredPosition.originX === 'start' ? 1 : -1;
                    preferredPosition.offsetX += afterFactor * rect.width;
                });
            }
            // adjust menu's offset-x/offset-y in order to center arrow (since the width of the menu can't be determined here,
            // we'll settle for the constant height of a menu item to position arrow in both cases, horizontally and vertically
            if (this.xcMenu.withArrow) {
                const itemHeight = 50;
                if (!this.xcMenu.xNexttoTrigger) {
                    positionStrategy._preferredPositions.forEach(preferredPosition => {
                        const beforeFactor = preferredPosition.originX === 'end' ? 1 : -1;
                        preferredPosition.offsetX += beforeFactor * ((1 + itemHeight - rect.width) / 2);
                    });
                }
                if (!this.xcMenu.yNexttoTrigger) {
                    positionStrategy._preferredPositions.forEach(preferredPosition => {
                        const aboveFactor = preferredPosition.originY === 'bottom' ? 1 : -1;
                        preferredPosition.offsetY += aboveFactor * ((1 + itemHeight - rect.height) / 2);
                    });
                }
            }
            // add custom offsets
            positionStrategy._preferredPositions.forEach(preferredPosition => {
                preferredPosition.offsetX += this.xcMenu.xOffset;
                preferredPosition.offsetY += this.xcMenu.yOffset;
            });
        }
    }
}
