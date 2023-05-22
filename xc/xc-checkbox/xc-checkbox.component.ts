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
import { AfterContentInit, Component, ElementRef, EventEmitter, HostBinding, Input, OnInit, Output, ViewChild } from '@angular/core';
import { MatCheckbox, MatCheckboxChange } from '@angular/material/checkbox';
import { MatRipple } from '@angular/material/core';

import { XcI18nTranslateDirective } from '@zeta/i18n/i18n.directive';

import { coerceBoolean, defineAccessorProperty } from '../../base';
import { I18nService } from '../../i18n';
import { ATTRIBUTE_LABEL } from '../shared/xc-i18n-attributes';
import { XcThemeableComponent } from '../shared/xc-themeable.component';


@Component({
    selector: 'xc-checkbox',
    templateUrl: './xc-checkbox.component.html',
    styleUrls: ['./xc-checkbox.component.scss'],
    providers: [XcI18nTranslateDirective]
})
export class XcCheckboxComponent extends XcThemeableComponent implements OnInit, AfterContentInit {

    private static uniqueId = 0;
    private readonly _labelRef: string;

    protected _checked = false;
    protected _indeterminate = false;
    protected _disabled = false;
    protected _readonly = false;
    protected _label = '';

    @Input()
    set label(value: string) {
        this._label = value;
        this.translate(ATTRIBUTE_LABEL);
    }

    get label(): string {
        return this._label;
    }

    @Output()
    readonly checkedChange = new EventEmitter<boolean>();


    i18nContext: string;


    constructor(private readonly elementRef: ElementRef, protected readonly i18n: I18nService) {
        super();
        this._labelRef = 'xc-checkbox-unique-label-id-' + XcCheckboxComponent.uniqueId++;
    }


    ngAfterContentInit(): void {
        this.i18nContext = this.elementRef.nativeElement.getAttribute('xc-i18n');
        if (this.label) {
            this.translate(ATTRIBUTE_LABEL);
        }
    }


    ngOnInit() {
        const input = (this.elementRef.nativeElement as HTMLElement).querySelector('input');
        if (input) {
            input.tabIndex = -1;
        }


    }


    protected translate(attribute: string) {
        if (this.i18nContext !== undefined && this.i18nContext !== null && this[attribute]) {
            this[attribute] = this.i18n.translate(this.i18nContext ? this.i18nContext + '.' + this[attribute] : this[attribute]);
        }
    }


    get labelRef(): string {
        return this._labelRef;
    }


    @ViewChild(MatCheckbox, { static: false })
    set checkbox(value: MatCheckbox) {
        if (value?.ripple) {
            // introduce property to force radius to be 20
            defineAccessorProperty<MatRipple, number>(
                value.ripple,
                'radius',
                () => 20,
                () => { }
            );
        }
    }


    @Input()
    set checked(value: boolean) {
        value = coerceBoolean(value);
        if (this._checked !== value) {
            this._checked = value;
        }
    }


    get checked(): boolean {
        return this._checked;
    }


    @Input()
    @HostBinding('class.disabled')
    set disabled(value: boolean) {
        this._disabled = coerceBoolean(value);
    }


    get disabled(): boolean {
        return this._disabled;
    }


    @Input()
    @HostBinding('class.readonly')
    set readonly(value: boolean) {
        this._readonly = coerceBoolean(value);
    }


    get readonly(): boolean {
        return this._readonly;
    }


    @Input()
    set indeterminate(value: boolean) {
        this._indeterminate = coerceBoolean(value);
    }


    get indeterminate(): boolean {
        return this._indeterminate;
    }


    change(event: MatCheckboxChange) {
        this.checked = event.checked;
        this.checkedChange.emit(this.checked);
    }


    toggle(event: Event) {
        if (!this.disabled && !this.readonly) {
            this.checked = !this.checked;
            this.checkedChange.emit(this.checked);
        }
        event.stopPropagation();
        event.preventDefault();
    }
}
