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
import { ComponentType } from '@angular/cdk/portal';
import { NgComponentOutlet } from '@angular/common';
import { AfterViewInit, Component, ComponentRef, EventEmitter, Injector, Input, Output, QueryList, ViewChild, ViewChildren } from '@angular/core';
import { MatLegacyTabGroup as MatTabGroup } from '@angular/material/legacy-tabs';

import { coerceBoolean } from '../../base';
import { I18nService, LocaleService } from '../../i18n';

import { Observable, of, Subject } from 'rxjs';
import { filter, tap } from 'rxjs/operators';

import { XcThemeableComponent } from '../../xc/shared/xc-themeable.component';
import { xcTabBarTranslations_deDE } from './locale/xc-tab-bar-translations.de-DE';
import { xcTabBarTranslations_enUS } from './locale/xc-tab-bar-translations.en-US';
import { XC_TAB_DATA, XcTabBarInterface, XcTabBarItem, XcTabComponent, XcTabRef } from './xc-tab.component';


@Component({
    selector: 'xc-tab-bar',
    templateUrl: './xc-tab-bar.component.html',
    styleUrls: ['./xc-tab-bar.component.scss']
})
export class XcTabBarComponent extends XcThemeableComponent implements XcTabBarInterface, AfterViewInit {

    private _tabGroup: MatTabGroup;
    private _componentOutlets: QueryList<NgComponentOutlet>;
    private readonly _componentInjectors = new Map<XcTabBarItem, Injector>();
    private readonly _componentSubjects = new Map<XcTabBarItem, Subject<XcTabComponent>>();
    private readonly _componentInitialized = new Set<XcTabBarItem>();
    private _focusedIndex = -1;
    private _showTooltips = false;
    private _busy = false;


    @Input('xc-tab-bar-items')
    items = new Array<XcTabBarItem>();

    @Output('xc-tab-bar-selectionChange')
    readonly selectionChange = new EventEmitter<XcTabBarItem>();


    constructor(private readonly injector: Injector, protected readonly i18n: I18nService) {
        super();
        this.i18n.setTranslations(LocaleService.DE_DE, xcTabBarTranslations_deDE);
        this.i18n.setTranslations(LocaleService.EN_US, xcTabBarTranslations_enUS);
        this.color = 'primary';
    }


    ngAfterViewInit(): void {
        // select first tab by default
        if (this.items.length > 0) {
            this.selection = this.items[0];
        }
    }


    private _getComponentInstance(item: XcTabBarItem): XcTabComponent | null {
        return this.componentOutlets.map(outlet =>
            // eslint-disable-next-line @typescript-eslint/dot-notation
            (outlet['_componentRef'] as ComponentRef<XcTabComponent>).instance
        ).find(instance =>
            instance.tabBarItem === item
        );
    }


    private activate(item: XcTabBarItem, idx: number) {
        if (item) {
            item.afterActivate?.(idx);
            setTimeout(() => {
                this._componentInitialized.add(item);
            }, 0);
        }
    }


    private deactivate(item: XcTabBarItem, idx: number) {
        if (item) {
            item.afterDeactivate?.(idx);
        }
    }


    private resetSelectionIndex() {
        // eslint-disable-next-line @typescript-eslint/dot-notation
        this.tabGroup['_selectedIndex'] = undefined;
    }


    private get focusedItem(): XcTabBarItem {
        return this.items[this._focusedIndex];
    }


    private get selectedBusyTab(): boolean {
        const tabs = this.tabGroup._tabs ? this.tabGroup._tabs.toArray() : [];
        const selected = tabs[this.tabGroup.selectedIndex];
        return !!selected && selected.ariaLabelledby === 'busy';
    }


    mouseup(event: MouseEvent, item: XcTabBarItem) {
        if (event.button === 1 && item.closable) {
            this.close(item).subscribe();
        }
    }


    @Input('xc-tab-bar-selection')
    set selection(value: XcTabBarItem) {
        const idx = this.items.indexOf(value);
        // reset selected index, if the busy tab got selected
        if (this.selectedBusyTab) {
            this.resetSelectionIndex();
        }
        // select tab idx
        if (idx >= 0) {
            const uninitialized = !this._componentInitialized.has(value);
            this.tabGroup.selectedIndex = idx;
            if (uninitialized) {
                this.activate(value, idx);
            }
            // quirk fix - selectedIndexChange doesn't trigger if the current index is undefined
            if (this.tabGroup.selectedIndex === undefined) {
                setTimeout(() => {
                    this.selectedIndexChange(idx);
                }, 0);
            }
        }
    }


    get selection(): XcTabBarItem {
        return this.items[this.tabGroup.selectedIndex];
    }


    @Input('xc-tab-bar-showtooltips')
    set showTooltips(value: boolean) {
        this._showTooltips = coerceBoolean(value);
    }


    get showTooltips(): boolean {
        return this._showTooltips;
    }


    @Input()
    set busy(value: boolean) {
        this._busy = coerceBoolean(value);
    }


    get busy(): boolean {
        return this._busy;
    }


    @ViewChild(MatTabGroup, { static: true })
    get tabGroup(): MatTabGroup {
        return this._tabGroup;
    }


    set tabGroup(value: MatTabGroup) {
        this._tabGroup = value;
        this.resetSelectionIndex();
        this.tabGroup.selectedIndexChange.subscribe((index: number) => this.selectedIndexChange(index));
    }


    private selectedIndexChange(index: number) {
        // prevent selecting the busy tab and omit events not changing the index
        if (!this.selectedBusyTab && this._focusedIndex !== index) {
            // call after-deactivate handler
            this.deactivate(this.focusedItem, this._focusedIndex);
            // change focused index
            this._focusedIndex = index;
            this.selectionChange.emit(this.focusedItem);
            // call after-activate handler
            this.activate(this.focusedItem, this._focusedIndex);
        }
    }


    @ViewChildren(NgComponentOutlet)
    set componentOutlets(value: QueryList<NgComponentOutlet>) {
        const completeItems = new Array<XcTabBarItem>();
        let instance: XcTabComponent;
        this._componentOutlets = value;
        this._componentSubjects.forEach((subject, item) => {
            if ((instance = this._getComponentInstance(item))) {
                // notify getComponentInstance() observers
                subject.next(instance);
                subject.complete();
                // remember item with complete subject
                completeItems.push(item);
            }
        });
        // remove all items with complete subjects from map
        completeItems.forEach(item => this._componentSubjects.delete(item));
    }


    get componentOutlets(): QueryList<NgComponentOutlet> {
        return this._componentOutlets;
    }


    getComponent(item: XcTabBarItem): ComponentType<XcTabComponent<any, any>> {
        return item.component;
    }


    getComponentInjector(item: XcTabBarItem): Injector {
        return this._componentInjectors.get(item) || this._componentInjectors.set(
            item, Injector.create({
                providers: [
                    { provide: XC_TAB_DATA, useValue: item.data },
                    { provide: XcTabRef, useValue: new XcTabRef(this, item) }
                ],
                parent: this.injector
            })
        ).get(item);
    }


    getComponentInstance(item: XcTabBarItem): Observable<XcTabComponent<any, any>> {
        const instance = this._getComponentInstance(item);
        return instance
            ? of(instance)
            : (this._componentSubjects.get(item) || this._componentSubjects.set(item, new Subject<XcTabComponent>()).get(item)).asObservable();
    }


    isComponentInitialized(item: XcTabBarItem): boolean {
        return this._componentInitialized.has(item);
    }


    getTooltip(item: XcTabBarItem): string {
        if (this.showTooltips) {
            return item.name;
        }
    }


    open(item: XcTabBarItem, beforeItem?: XcTabBarItem, inBackground = false): Observable<XcTabComponent<any, any>> {
        // insert new item before another item or at the end
        const idx = this.items.indexOf(beforeItem);
        this.items.splice(idx < 0 ? this.items.length : idx, 0, item);
        // switch to new item, if not opened in background
        if (!inBackground) {
            // necessary to counter-act angular material bugfix:
            // "maintain selected tab when new tabs are added or removed"
            // see: https://github.com/angular/material2/pull/9132/files
            this.tabGroup._tabs.forEach(tab => tab.isActive = false);
            // switch to new item
            this.selection = item;
        }
        return this.getComponentInstance(item);
    }


    close(item: XcTabBarItem, result?: any, selectItem?: XcTabBarItem): Observable<boolean> {
        const observable = this._getComponentInstance(item)?.beforeDismiss().pipe(filter(success => success));
        if (observable) {
            return observable.pipe(tap(() => {
                const tabInjector = this._componentInjectors.get(item);

                // check if tab is still open
                if (tabInjector) {
                    // remove injector and notify result
                    tabInjector.get(XcTabRef).notifyClose(result);
                    this._componentInjectors.delete(item);
                    // remove and complete subject, if any
                    const subject = this._componentSubjects.get(item);
                    if (subject) {
                        subject.complete();
                        this._componentSubjects.delete(item);
                    }
                    // remove initialized entry
                    this._componentInitialized.delete(item);
                    // remove from items array
                    const closedIdx = this.items.indexOf(item);
                    this.items.splice(closedIdx, 1);
                    // determine and set selected index
                    const selectedIdx = this.tabGroup.selectedIndex;
                    let selectIdx = this.items.indexOf(selectItem);
                    if (selectIdx < 0) {
                        selectIdx = closedIdx < selectedIdx
                            ? selectedIdx - 1
                            : selectedIdx;
                    }
                    this.tabGroup.selectedIndex = selectIdx;

                    // if no tab is left, reset focus
                    if (this.items.length === 0) {
                        this._focusedIndex = -1;
                    }

                    // tab index does not change (ie. closed tab got exchanged by another)
                    if (selectedIdx === selectIdx) {
                        // call after-deactivate handler on closed item
                        this.deactivate(item, selectedIdx);
                        // manually emit event, since the tab bar won't see any change
                        this.selectionChange.emit(this.focusedItem);
                        // call after-activate handler
                        this.activate(this.focusedItem, this._focusedIndex);
                    }
                }
            }));
        }
        return of(false);
    }


    closeFocusedTab() {
        const item = this.items[this._focusedIndex];
        if (item?.closable) {
            this._focusedIndex = -1;
            this.close(item).subscribe();
        }
    }


    initialized(): boolean {
        return !!this.tabGroup._tabs;
    }
}
