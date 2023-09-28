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
import { Component, HostBinding } from '@angular/core';

import { XcDialogService } from '../xc-dialog/xc-dialog.service';
import { XcStatusBarDialogComponent } from './xc-status-bar-dialog.component';
import { XcStatusBarEntry, XcStatusBarEntryType, XcStatusBarService } from './xc-status-bar.service';


@Component({
    selector: 'xc-status-bar',
    templateUrl: './xc-status-bar.component.html',
    styleUrls: ['./xc-status-bar.component.scss']
})
export class XcStatusBarComponent {

    private readonly entries = new Array<XcStatusBarEntry>();
    private timeout: any;

    @HostBinding('attr.flashing')
    type: XcStatusBarEntryType;

    message: string;
    collapsed = true;


    constructor(
        private readonly dialogService: XcDialogService,
        private readonly statusBarService: XcStatusBarService
    ) {
        this.statusBarService.displayStatusBarEntry.subscribe(
            entry => this.add(entry)
        );
    }


    flash(type: XcStatusBarEntryType) {
        this.type = XcStatusBarEntryType.NONE;
        if (type !== XcStatusBarEntryType.NONE) {
            setTimeout(() => this.type = type, 0);
        }
    }


    show(message: string) {
        this.message = message;
        this.collapsed = false;
        clearTimeout(this.timeout);
        this.timeout = setTimeout(() => {
            this.collapsed = true;
            this.timeout = setTimeout(() => {
                this.timeout = undefined;
                this.message = undefined;
            }, 600);
        }, 5000);
    }


    open() {
        this.dialogService.custom(
            XcStatusBarDialogComponent,
            {entries: this.entries}
        ).afterDismissResult(true).subscribe(() =>
            this.clear()
        );
    }


    clear() {
        this.entries.splice(0);
    }


    add(entry: XcStatusBarEntry) {
        this.entries.push(entry);
        this.flash(entry.type);
        this.show(entry.message);
    }


    get count(): number {
        return this.entries.length;
    }
}
