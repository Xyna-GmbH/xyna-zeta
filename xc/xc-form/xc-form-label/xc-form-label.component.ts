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
import { AfterContentInit, Component, ElementRef } from '@angular/core';

import { I18nService } from '../../../i18n';


@Component({
    selector: 'xc-form-label',
    templateUrl: './xc-form-label.component.html',
    styleUrls: ['./xc-form-label.component.scss'] /** @todo reuse xc-form-field.component.scss somehow */
})
export class XcFormLabelComponent implements AfterContentInit {

    constructor(private readonly elementRef: ElementRef<HTMLElement>, protected readonly i18n: I18nService) {
    }

    ngAfterContentInit() {
        const i18nContext = this.elementRef.nativeElement.getAttribute('xc-i18n');

        const el = this.elementRef.nativeElement;
        if (el && i18nContext !== undefined && i18nContext !== null) {
            el.textContent = this.i18n.translate(i18nContext ? i18nContext + '.' + el.textContent : el.textContent);
        }
    }
}
