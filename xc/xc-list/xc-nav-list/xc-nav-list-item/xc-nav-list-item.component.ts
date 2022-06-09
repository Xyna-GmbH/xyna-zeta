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
import { animate, state, style, transition, trigger } from '@angular/animations';
import { Component, EventEmitter, HostBinding, Input, OnInit, Output } from '@angular/core';

import { coerceBoolean, isBoolean } from '../../../../base';
import { XcItem } from '../../../shared/xc-item';
import { XcThemeableComponent } from '../../../shared/xc-themeable.component';
import { XcTooltipPosition } from '../../../xc-tooltip/xc-tooltip.directive';
import { XcNavListOrientation } from '../xc-nav-list.component';


export interface XcNavListItem extends XcItem {
    link?: string;
    class?: string;
    children?: this[];
    collapsed?: boolean;
    tooltip?: string;
}


@Component({
    selector: 'xc-nav-list-item',
    templateUrl: './xc-nav-list-item.component.html',
    styleUrls: ['./xc-nav-list-item.component.scss'],
    animations: [
        trigger('toggleAnimation', [
            state('collapsed', style({
                'display': 'none'
            })),
            state('expanded', style({
                'display': 'block'
            })),
            transition('* => *', animate('0ms ease-in'))
        ])
    ]
})
export class XcNavListItemComponent extends XcThemeableComponent implements OnInit {

    private static _num = 0;
    uniquePanelId = 'xc-nav-list-panel-' + XcNavListItemComponent._num++;

    @Input()
    item: XcNavListItem;

    @Input()
    size: 'small' | 'medium' | 'large' | 'extra-large' = 'medium';

    @HostBinding('attr.depth')
    @Input()
    depth: number;

    @Input()
    set shrink(value: boolean) { this._shrink = coerceBoolean(value); }
    get shrink(): boolean { return this._shrink; }
    private _shrink = false;

    @Input()
    orientation: XcNavListOrientation;

    @Output()
    readonly focusChange = new EventEmitter<XcNavListItem>();


    constructor() {
        super();
        this.color = 'primary';
    }


    @HostBinding('attr.collapsed')
    get collapsed() {
        return this.item
            ? this.item.collapsed
            : true;
    }


    set collapsed(value: boolean) {
        this.item.collapsed = value;
    }


    ngOnInit() {
        this.collapsed = (this.item && isBoolean(this.item.collapsed))
            ? this.item.collapsed
            : false;
    }


    toggleChildren() {
        this.collapsed = !this.collapsed;
    }


    expandChildren() {
        if (this.collapsed) {
            this.toggleChildren();
        }
    }


    collapseChildren() {
        if (!this.collapsed) {
            this.toggleChildren();
        }
    }


    get tooltipPosition(): string {
        switch (this.orientation) {
            case XcNavListOrientation.TOP: return XcTooltipPosition.bottom;
            case XcNavListOrientation.RIGHT: return XcTooltipPosition.left;
            case XcNavListOrientation.BOTTOM: return XcTooltipPosition.top;
            case XcNavListOrientation.LEFT: return XcTooltipPosition.right;
            default: return undefined;
        }
    }


    get toggleAnimation(): string {
        return this.collapsed ? 'collapsed' : 'expanded';
    }


    getItemClassList(): string[] {
        const list: string[] = [];
        if (this.item.class) {
            list.push(this.item.class);
        }
        if (this.item.disabled) {
            list.push('disabled');
        }
        if (this.item.children && this.item.children.length) {
            list.push('parent');
        }
        return list;
    }
}
