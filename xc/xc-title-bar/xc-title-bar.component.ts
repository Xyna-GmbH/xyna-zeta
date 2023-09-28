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
import { Component, Input } from '@angular/core';

import { getBaseHref, isArray } from '@zeta/base';

import { ZetaVersion } from '../../version';
import { XcDialogService } from '../xc-dialog/xc-dialog.service';


@Component({
    selector: 'xc-title-bar',
    templateUrl: './xc-title-bar.component.html',
    styleUrls: ['./xc-title-bar.component.scss']
})
export class XcTitleBarComponent {

    @Input('xc-title-bar-application-name')
    applicationName: string;

    @Input('xc-title-bar-application-versions')
    applicationVersions: string[];

    @Input('xc-title-bar-icon-name')
    iconName: string;

    @Input('xc-title-bar-icon-style')
    iconStyle: string;

    @Input('xc-title-bar-company')
    company: string;

    @Input('xc-title-bar-year')
    year: string;


    constructor(private readonly dialogService: XcDialogService) {
    }


    private get copyright(): string {
        const company = this.company || '';
        const year = this.year || '';
        if (company || year) {
            return 'Copyright: ' + company + (company && year ? ', ' + year : '');
        }
        return '';
    }


    private get versions(): string {
        return 'Xyna Zeta: ' + ZetaVersion +
               (isArray(this.applicationVersions) ? '\n\n' + this.applicationVersions.join('\n') : '');
    }


    showAbout() {
        this.dialogService.about(
            this.applicationName || 'Info',
            this.copyright,
            this.versions,
            getBaseHref() + '3rdpartylicenses.txt'
        );
    }
}
