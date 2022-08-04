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
import { merge, Observable, Subject } from 'rxjs';

import { Comparable } from '../../base';
import { XcDataSource } from './xc-data-source';
import { XcSelectionModel } from './xc-selection';


export abstract class XcSelectionDataSource<T extends Comparable = Comparable, S extends XcSelectionModel<T> = XcSelectionModel<T>> extends XcDataSource<T> {

    /** Unique keys of all entries to select after refreshing the data source */
    private pendingSelectionKeys: string[];
    private beforeData: T[];

    private readonly restoreSelectionKeysFailedSubject = new Subject<string[]>();
    private _allowRestoreSelectionKeys = true;


    protected constructor(private readonly _selectionModel: S) {
        super();
        merge(_selectionModel.selectionChange, _selectionModel.focusedChange).subscribe(() =>
            this.triggerMarkForChange()
        );
    }


    protected beforeSetData(data: T[]) {
        this.beforeData = data;
        this.restoreSelectionKeys(
            this.pendingSelectionKeys ? this.pendingSelectionKeys : this.getSelectionKeys(),
            false
        );
    }


    getPendingSelectionKeys(): string[] {
        return (this.pendingSelectionKeys || []).concat();
    }


    getSelectionKeys(): string[] {
        return this.selectionModel.selection
            .map(entry => entry.uniqueKey)
            .filter(value => !!value);
    }


    restoreSelectionKeys(selectionKeys: string[], awaitRefresh = false) {
        if (!this.allowRestoreSelectionKeys) {
            return;
        }

        if (this.beforeData && !awaitRefresh) {
            const invalidSelectionKeys = [];
            // clear selection model and select all entries matching selection keys
            this.selectionModel.combineOperations(() => {
                this.selectionModel.clear();
                selectionKeys.filter(selectionKey => !!selectionKey).forEach(selectionKey => {
                    const selection = this.beforeData.find(value => selectionKey === value.uniqueKey);
                    if (selection) {
                        this.selectionModel.select(selection);
                    } else {
                        invalidSelectionKeys.push(selectionKey);
                    }
                });
            });
            // handle invalid selection restore
            if (invalidSelectionKeys.length > 0) {
                this.restoreSelectionKeysFailedSubject.next(invalidSelectionKeys);
            }
            // clear pending selection keys
            this.pendingSelectionKeys = undefined;
        } else {
            // store selection keys for next data source update
            this.pendingSelectionKeys = selectionKeys;
        }
    }


    get restoreSelectionKeysFailed(): Observable<string[]> {
        return this.restoreSelectionKeysFailedSubject.asObservable();
    }


    get selectionModel(): S {
        return this._selectionModel;
    }


    get allowRestoreSelectionKeys(): boolean {
        return this._allowRestoreSelectionKeys;
    }


    set allowRestoreSelectionKeys(value: boolean) {
        this._allowRestoreSelectionKeys = value;
    }
}
