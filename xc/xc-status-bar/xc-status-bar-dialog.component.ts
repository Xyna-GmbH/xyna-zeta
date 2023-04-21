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
import { Component, Injector } from '@angular/core';

import { I18nService, LocaleService } from '../../i18n';
import { XcSortDirection } from '../shared/xc-sort';
import { XcDialogComponent } from '../xc-dialog/xc-dialog.component';
import { XcLocalTableDataSource } from '../xc-table/xc-local-table-data-source';
import { xcStatusBar_translations_de_DE } from './locale/xc-status-bar-translations.de-DE';
import { xcStatusBar_translations_en_US } from './locale/xc-status-bar-translations.en-US';
import { XcStatusBarEntry } from './xc-status-bar.service';


export interface XcStatusBarDialogData {
    entries: XcStatusBarEntry[];
}


@Component({
    templateUrl: './xc-status-bar-dialog.component.html',
    styleUrls: ['./xc-status-bar-dialog.component.scss']
})
export class XcStatusBarDialogComponent extends XcDialogComponent<boolean, XcStatusBarDialogData> {

    readonly dataSource: XcLocalTableDataSource;


    constructor(injector: Injector, i18n: I18nService) {
        super(injector);

        i18n.setTranslations(LocaleService.DE_DE, xcStatusBar_translations_de_DE);
        i18n.setTranslations(LocaleService.EN_US, xcStatusBar_translations_en_US);

        this.dataSource = new XcLocalTableDataSource(i18n);
        this.dataSource.localTableData = {
            rows: this.injectedData.entries,
            columns: [
                {path: 'time', name: i18n.translate('Timestamp'), disableFilter: true, shrink: true, pre: true},
                {path: 'message', name: i18n.translate('Message')}
            ]
        };
        this.dataSource.setSortPathAndDirection('time', XcSortDirection.dsc);
        // this.dataSource.refresh();
    }
}
