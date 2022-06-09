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
import { AfterContentInit, Component, ElementRef, Input } from '@angular/core';

import { I18nService } from '../../../i18n';
import { ATTRIBUTE_VALUE } from '../../../xc/shared/xc-i18n-attributes';
import { XcFormComponent } from '../xc-form-base/xc-form-base.component';


@Component({
    selector: 'xc-form-text',
    templateUrl: './xc-form-text.component.html',
    styleUrls: ['./xc-form-text.component.scss']
})
export class XcFormTextComponent extends XcFormComponent implements AfterContentInit {

    protected _value;

    @Input()
    set value(value: any) {
        this._value = value;
        this.translate(ATTRIBUTE_VALUE);
    }

    get value(): any {
        return this._value;
    }

    constructor(el: ElementRef<HTMLElement>, i18n: I18nService) {
        super(el, i18n);
    }


    ngAfterContentInit() {
        super.ngAfterContentInit();

        if (this.value) {
            this.translate(ATTRIBUTE_VALUE);
        }
    }
}
