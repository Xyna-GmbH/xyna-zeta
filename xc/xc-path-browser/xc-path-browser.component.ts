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
import { Component, InjectionToken, Injector, Input, Optional } from '@angular/core';

import { I18nService } from '../../i18n';
import { XcDynamicComponent } from '../shared/xc-dynamic.component';
import { XcOptionItem } from '../shared/xc-item';
import { XC_COMPONENT_DATA } from '../xc-template/xc-template';
import { xcPathBrowserTranslations_deDE } from './locale/xc-path-browser-translations.de-DE';
import { xcPathBrowserTranslations_enUS } from './locale/xc-path-browser-translations.en-US';


export interface XcPathOptionItem extends XcOptionItem {
    path: string;
    parents?: this[];
    children?: this[];
}


export interface XcPathBrowserObserver {
    beforeVisitOptionItem(item: XcPathOptionItem): void;
    getInitialOptionItem(): XcPathOptionItem;
    getRootOptionItem(): XcPathOptionItem;
    pathChanged(path: string): void;
}


export interface XcPathBrowserTemplateData {
    observer?: XcPathBrowserObserver;
    initialPath?: string;
    pathUpwardsToken?: string;
    pathSeparator?: string;
    rootPathToken?: string;
}


@Component({
    selector: 'xc-path-browser',
    templateUrl: './xc-path-browser.component.html',
    styleUrls: ['./xc-path-browser.component.scss']
})
export class XcPathBrowserComponent extends XcDynamicComponent<XcPathBrowserTemplateData> {

    private _currentItem: XcPathOptionItem;
    private _pathSeparator = '/';
    private _path: string[] = [];
    private _pathString: string;
    private _initialPath = '';
    private _observer: XcPathBrowserObserver;

    @Input()
    pathUpwardsToken = '..';

    @Input()
    rootPathToken = null;


    constructor(@Optional() injector: Injector, protected readonly i18n: I18nService) {
        super(injector);

        this.i18n.setTranslations('de-DE', xcPathBrowserTranslations_deDE);
        this.i18n.setTranslations('en-US', xcPathBrowserTranslations_enUS);

        if (this.injectedData) {
            this.observer = this.injectedData.observer;
            if (this.injectedData.initialPath) {
                this.initialPath = this.injectedData.initialPath;
            }
            if (this.injectedData.pathUpwardsToken) {
                this.pathUpwardsToken = this.injectedData.pathUpwardsToken;
            }
            if (this.injectedData.pathSeparator) {
                this.pathSeparator = this.injectedData.pathSeparator;
            }
            if (this.injectedData.rootPathToken) {
                this.rootPathToken = this.injectedData.rootPathToken;
            }
        }
    }


    @Input()
    set initialPath(value: string) {
        this._initialPath = value;
        this.parseInitialPath();
    }


    get initialPath(): string {
        return this._initialPath;
    }


    @Input()
    set pathSeparator(value: string) {
        this._pathSeparator = value;
        this.parseInitialPath();
    }


    get pathSeparator(): string {
        return this._pathSeparator;
    }


    @Input()
    set observer(value: XcPathBrowserObserver) {
        this._observer = value;
        this.parseInitialPath();
    }


    get observer(): XcPathBrowserObserver {
        return this._observer;
    }


    get currentItem(): XcPathOptionItem {
        if (!this._currentItem && this.observer) {
            this._currentItem = this.observer.getInitialOptionItem();
        }
        return this._currentItem;
    }


    get currentPath(): string {
        return this._pathString;
    }


    private updatePath() {
        this._pathString = this._path.join(this.pathSeparator);
        this.observer?.pathChanged(this.currentPath);
    }


    select(item: XcPathOptionItem) {
        // inform observer
        if (this.observer) {
            this.observer.beforeVisitOptionItem(item || this.observer.getRootOptionItem()); // root if null
        }

        if (!item) {
            // SELECT ROOT
            // -----------
            this.clearPath();
            if (this.rootPathToken) {
                this.pushPathPart(this.rootPathToken);
            }
            item = this.observer ? this.observer.getRootOptionItem() : null;
        } else if (this._currentItem.parents?.indexOf(item) >= 0) {
            // SELECT PARENT
            // -------------
            if (this.emptyPath() || this.lastPathPart === this.pathUpwardsToken) {
                // path is empty or solely consists of upwards steps: Append another upwards step
                this.pushPathPart(this.pathUpwardsToken);
            } else {
                // selected item is last item from path: Step one upward in current path
                this.popPathPart();
            }
        } else {
            // SELECT CHILD
            // ------------
            this.pushPathPart(item.path);
        }
        this._currentItem = item;
    }



    // ==================================================================================================
    // MODIFY PATH
    // ==================================================================================================

    private emptyPath(): boolean {
        return this._path.length === 0;
    }


    private get lastPathPart(): string {
        return this.emptyPath() ? '' : this._path[this._path.length - 1];
    }


    private parseInitialPath() {
        if (this.initialPath && this.pathSeparator) {
            const parts = this.initialPath.split(this.pathSeparator);

            // parse path parts along item-nodes
            for (const part of parts) {
                if (part === this.pathUpwardsToken) {
                    this.select(this.currentItem?.parents?.length > 0 ? this.currentItem.parents[0] : null);
                } else {
                    const nextNode = (this.currentItem?.children || []).find(child => child.path === part);
                    this.select(nextNode);
                }
            }

            this.updatePath();
        }
    }


    private clearPath() {
        this._path = [];
        this.updatePath();
    }


    private pushPathPart(value: string) {
        this._path.push(value);
        this.updatePath();
    }


    private popPathPart() {
        this._path.pop();
        this.updatePath();
    }


    /**
     * Matches parents of current item with path.
     * @returns Parent of current item that matches the path. If none doesn't, returns all parents
     */
    parentsFromPath(): XcPathOptionItem[] {
        if (!this.currentItem) {
            return [];
        }

        // second last item of path is the path-part of the parent
        const parentPath = this._path.length > 1 ? this._path[this._path.length - 2] : '';
        for (const parent of (this.currentItem.parents || [])) {
            if (parent.path === parentPath) {
                return [parent];
            }
        }
        return this.currentItem.parents || [];
    }


    protected getToken(): InjectionToken<string> {
        return XC_COMPONENT_DATA;
    }
}
