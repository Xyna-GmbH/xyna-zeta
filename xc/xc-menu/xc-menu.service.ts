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
import { Directive, Injectable, Input, OnDestroy, TemplateRef, ViewContainerRef } from '@angular/core';

import { Subject, Subscription } from 'rxjs';

import { XcMenuComponent, XcMenuItem, XcMenuOptions, XcMenuOptionsDefault } from './xc-menu.component';


@Injectable()
export class XcMenuService {

    private _component: XcMenuComponent;
    private _items: XcMenuItem[];
    private _options: XcMenuOptions;
    private readonly subscriptions = new Array<Subscription>();
    private readonly selectItem = new Subject<XcMenuItem>();


    constructor() {
        this.set();
    }


    set component(value: XcMenuComponent) {
        this.subscriptions.forEach(subscription => subscription.unsubscribe());
        this.subscriptions.splice(0);
        this._component = value;
        if (value) {
            this.subscriptions.push(
                value.menu.closed.subscribe(() => this.set()),
                value.select.subscribe((item: XcMenuItem) => this.selectItem.next(item))
            );
        }
    }


    get component(): XcMenuComponent {
        return this._component;
    }


    get items(): XcMenuItem[] {
        return this._items;
    }


    get options(): XcMenuOptions {
        return this._options;
    }


    set(items: XcMenuItem[] = [], options: XcMenuOptions = {}) {
        this._items = items;
        const defaultOptions = XcMenuOptionsDefault();
        options.xNexttoTrigger ??= defaultOptions.xNexttoTrigger;
        options.yNexttoTrigger ??= defaultOptions.yNexttoTrigger;
        options.withArrow ??= defaultOptions.withArrow;
        options.xOffset ??= defaultOptions.xOffset;
        options.yOffset ??= defaultOptions.yOffset;
        options.xPosition ??= defaultOptions.xPosition;
        options.yPosition ??= defaultOptions.yPosition;
        this._options = options;
    }
}



@Directive({
    selector: '[xc-menu-service]'
})
export class XcMenuServiceDirective implements OnDestroy {

    constructor(
        private readonly viewContainerRef: ViewContainerRef,
        private readonly templateRef: TemplateRef<any>,
        private readonly menuService: XcMenuService
    ) {
    }


    ngOnDestroy() {
        this.viewContainerRef.clear();
    }


    @Input('xc-menu-service')
    set value(visible: boolean) {
        if (visible) {
            this.viewContainerRef.createEmbeddedView(this.templateRef, {$implicit: this.menuService});
        } else {
            this.viewContainerRef.clear();
        }
    }
}
