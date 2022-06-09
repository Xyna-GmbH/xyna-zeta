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
import { Component, ElementRef, HostBinding, Input } from '@angular/core';

import { coerceBoolean } from '../../base';
import { I18nService } from '../../i18n/i18n.service';
import { XcButtonBaseComponent } from './xc-button-base.component';


@Component({
    selector: 'xc-icon-button',
    templateUrl: './xc-icon-button.component.html',
    styleUrls: ['./xc-button-base.component.scss', './xc-icon-button.component.scss']
})
export class XcIconButtonComponent extends XcButtonBaseComponent {

    private _iconMaterial = false;

    @Input('xc-icon-name')
    iconName: string;

    @Input('xc-icon-style')
    iconStyle: string;

    @HostBinding('attr.size')
    @Input('xc-icon-size')
    iconSize: 'small' | 'medium' | 'large' | 'extra-large' = 'medium';


    constructor(elementRef: ElementRef, private readonly i18nService: I18nService) {
        super(elementRef, i18nService);
    }


    protected setAriaLabel(value: string) {
        super.setAriaLabel(value || (this.iconName ? this.i18nService.translate(this.iconName) : ''));
    }


    @Input('xc-icon-material')
    set iconMaterial(value: boolean) {
        this._iconMaterial = coerceBoolean(value);
    }


    get iconMaterial(): boolean {
        return this._iconMaterial;
    }
}
