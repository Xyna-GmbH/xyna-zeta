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
import { Observable } from 'rxjs';

import { Xo } from '../../api';
import { Comparable } from '../../base';
import { XcSortPredicate } from '../shared/xc-sort';
import { XcTemplate } from '../xc-template/xc-template';
import { XcTableData, XcTableDataFilter, XcTableDataRequestOptions, XcTableDataSort, XcTableDataSource } from './xc-table-data-source';


export class XcLocalTableDataSource<T extends Comparable = Comparable> extends XcTableDataSource<T> {

    protected _localTableData: XcTableData<T>;
    protected _localTableDataAsync: Observable<any>;




    protected request(options: XcTableDataRequestOptions) {
        const process = () => {
            let rows = this.localTableData.rows.concat();
            const columns = this.localTableData.columns;
            // filter rows first
            if (options.filter) {
                rows = this.filter(rows, options.filter);
            }
            // sort rows afterwards
            if (options.sort && options.sort.path) {
                rows = this.sort(rows, options.sort);
            }

            this.tableCounts.totalCount = rows.length;

            // skip leading rows
            if (options.skip > 0) {
                rows = this.skipRows(rows, options.skip);
            }
            // limit remaining rows
            if (options.limit >= 0) {
                rows = this.limitRows(rows, options.limit);
            }
            // set data
            this.tableData = {
                rows: rows,
                columns: columns
            };

            this.tableCounts.displayedCount = rows.length;
            this.countSubject.next(this.tableCounts);
        };

        if (this.localTableDataAsync) {
            this.localTableDataAsync.subscribe(() => process());
        } else {
            process();
        }
    }


    protected filter(rows: T[], filter: XcTableDataFilter): T[] {
        return rows.filter(row => {
            for (const keyValue of filter.map) {
                const resolved = this.resolve(row, keyValue[0]);
                if (resolved) {
                    const valueString  = filter.caseSensitive ? resolved.toString() : resolved.toString().toLowerCase();
                    const filterString = filter.caseSensitive ? keyValue[1]         : keyValue[1].toLowerCase();
                    if (valueString.indexOf(filterString) < 0) {
                        return false;
                    }
                }
            }
            return true;
        });
    }


    protected sort(rows: T[], sort: XcTableDataSort): T[] {
        return rows.sort(XcSortPredicate(sort.direction, row => this.resolve(row, sort.path)));
    }


    protected skipRows(rows: T[], skip: number): T[] {
        return rows.slice(skip);
    }


    protected limitRows(rows: T[], limit: number): T[] {
        return rows.slice(0, limit);
    }


    // eslint-disable-next-line @typescript-eslint/no-wrapper-object-types
    resolve(row: T, path: string): XcTemplate[] | Object {
        return row instanceof Xo
            ? this.resolveXo(row, path)
            : row[path];
    }


    clear() {
        super.clear();
        if (this.localTableData) {
            this.localTableData.rows = [];
        }
    }


    remove(row: T) {
        super.remove(row);
        if (this.localTableData) {
            const idx = this.localTableData.rows.indexOf(row);
            if (idx >= 0) {
                this.localTableData.rows.splice(idx, 1);
            }
        }
    }


    add(row: T) {
        super.add(row);
        if (this.localTableData) {
            this.localTableData.rows.push(row);
        }
    }


    get localTableData(): XcTableData<T> {
        return this._localTableData;
    }


    set localTableData(data: XcTableData<T>) {
        this._localTableData = data;
    }


    get localTableDataAsync(): Observable<any> {
        return this._localTableDataAsync;
    }


    set localTableDataAsync(value: Observable<any>) {
        this._localTableDataAsync = value;
        this.debounceTime = value ? XcTableDataSource.DEFAULT_DEBOUNCE_TIME : 0;
    }
}
