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
import { AfterContentInit, Component, ElementRef, EventEmitter, HostBinding, Input, Output } from '@angular/core';
import { FormControl, ValidatorFn, Validators } from '@angular/forms';

import { coerceBoolean } from '../../../base';
import { I18nService, LocaleService } from '../../../i18n';
import { ATTRIBUTE_ARIALABEL, ATTRIBUTE_ICONTOOLTIP, ATTRIBUTE_LABEL, ATTRIBUTE_PLACEHOLDER } from '../../../xc/shared/xc-i18n-attributes';
import { xcFormTranslations_deDE } from '../locale/xc-translations.de-DE';
import { xcFormTranslations_enUS } from '../locale/xc-translations.en-US';


export enum FloatStyle {
    never = 'never',
    auto = 'auto',
    always = 'always'
}


@Component({
    template: ''
})
export class XcFormComponent implements AfterContentInit {

    protected _compact = false;
    protected _semiCompact = false;
    protected _label = '';
    protected _iconTooltip = '';
    protected _ariaLabel = '';

    @Input('xc-form-field-floatlabel')
    floatLabel: FloatStyle = FloatStyle.always;

    i18nContext: string;


    @Input()
    set label(value: string) {
        this._label = value;
        this.translate(ATTRIBUTE_LABEL);
    }


    get label(): string {
        return this._label;
    }


    @Input()
    set iconTooltip(value: string) {
        this._iconTooltip = value;
        this.translate(ATTRIBUTE_ICONTOOLTIP);
    }


    get iconTooltip(): string {
        return this._iconTooltip;
    }


    @Input('xc-form-field-aria-label')
    set ariaLabel(value: string) {
        this._ariaLabel = value;
        this.translate(ATTRIBUTE_ARIALABEL);
    }


    get ariaLabel(): string {
        return this._ariaLabel || this.label;
    }


    @HostBinding('class.compact')
    @Input('xc-form-field-compact')
    set compact(value: boolean) {
        this._compact = coerceBoolean(value);
    }


    get compact(): boolean {
        return this._compact;
    }


    @HostBinding('class.nolabel')
    protected get _xc_nolabel(): boolean {
        return !this.label || this.floatLabel === FloatStyle.never;
    }


    constructor(protected readonly element: ElementRef<HTMLElement>, protected readonly i18n: I18nService) {
    }


    ngAfterContentInit() {
        this.i18nContext = this.element.nativeElement.getAttribute('xc-i18n');
        if (this.label) {
            this.translate(ATTRIBUTE_LABEL);
        }
        if (this.ariaLabel) {
            this.translate(ATTRIBUTE_ARIALABEL);
        }
        if (this.iconTooltip) {
            this.translate(ATTRIBUTE_ICONTOOLTIP);
        }
    }


    protected translate(attribute: string) {
        if (this.i18nContext !== undefined && this.i18nContext !== null && this[attribute]) {
            this[attribute] = this.i18n.translate(this.i18nContext ? this.i18nContext + '.' + this[attribute] : this[attribute]);
        }
    }
}



@Component({
    template: ''
})
export class XcFormBaseComponent extends XcFormComponent implements AfterContentInit {

    protected _indicateChanges = false;
    protected _readonly = false;
    protected _placeholder = '';

    readonly formControl = new FormControl();

    @Output()
    readonly valueChange = this.formControl.valueChanges;

    @Output()
    readonly valueKeydown = new EventEmitter<KeyboardEvent>();

    @Output()
    // eslint-disable-next-line @angular-eslint/no-output-native
    readonly focus = new EventEmitter<FocusEvent>();

    @Output()
    // eslint-disable-next-line @angular-eslint/no-output-native
    readonly blur = new EventEmitter<FocusEvent>();

    @Input('xc-form-field-errorfunc')
    errorFunc: (key: string, data: any) => string;


    @Input('xc-form-field-callback')
    set callback(callback: (component: this) => void) {
        callback?.(this);
    }


    @HostBinding('class.indicatechanges')
    @Input('xc-form-field-indicatechanges')
    set indicateChanges(value: boolean) {
        this._indicateChanges = coerceBoolean(value);
    }


    get indicateChanges(): boolean {
        return this._indicateChanges;
    }


    @HostBinding('class.noerror')
    protected get _xc_noerror(): boolean {
        return !this.errorVisible;
    }


    @Input()
    set value(value: any) {
        this.formControl.setValue(value);
    }


    get value(): any {
        return this.formControl.value;
    }


    @Input()
    set disabled(value: boolean) {
        value = coerceBoolean(value);
        if (value) {
            this.formControl.disable({ emitEvent: false });
        } else {
            this.formControl.enable({ emitEvent: false });
        }
    }


    get disabled(): boolean {
        return this.formControl.disabled;
    }


    @Input()
    set readonly(value: boolean) {
        this._readonly = coerceBoolean(value);
    }


    get readonly(): boolean {
        return this._readonly;
    }


    @Input()
    set placeholder(value: string) {
        this._placeholder = value;
        this.translate(ATTRIBUTE_PLACEHOLDER);
    }


    get placeholder(): string {
        // space needed for style "align-items: baseline;" in class ".items-row" for proper alignment when text is missing
        return this._placeholder || ' ';
    }


    get errorVisible(): boolean {
        return this.formControl.errors !== null && this.formControl.touched && !this.readonly;
    }


    get errorContent(): string {
        const errorFunc = (key: string, data: any): string => {
            switch (key) {
                case 'email': return this.i18n.translate('zeta.xc-form-base.email');
                case 'max': return this.i18n.translate('zeta.xc-form-base.max') + data.max;
                case 'min': return this.i18n.translate('zeta.xc-form-base.min') + data.min;
                case 'maxlength': return this.i18n.translate('zeta.xc-form-base.maxlength') + data.requiredLength;
                case 'minlength': return this.i18n.translate('zeta.xc-form-base.minlength') + data.requiredLength;
                case 'number': return this.i18n.translate('zeta.xc-form-base.number', { key: '$0', value: (<string>data.format.toString()).toUpperCase() });
                case 'required': return this.i18n.translate('zeta.xc-form-base.required');
                case 'pattern': return this.i18n.translate('zeta.xc-form-base.pattern') + data.requiredPattern;
                case 'ipv4': return this.i18n.translate('zeta.xc-form-base.ipv4');
                case 'ipv6': return this.i18n.translate('zeta.xc-form-base.ipv6');
                case 'ip': return this.i18n.translate('zeta.xc-form-base.ip');
                case 'message': return data.message || this.i18n.translate('zeta.xc-form-base.message');
                default: return key;
            }
        };
        return Object.keys(this.formControl.errors).map(
            key => {
                const data = this.formControl.errors[key];
                const error = this.errorFunc ? this.errorFunc(key, data) : null;
                return error || errorFunc(key, data);
            }
        ).join(', ');
    }


    constructor(element: ElementRef<HTMLElement>, i18n: I18nService) {
        super(element, i18n);

        i18n.setTranslations(LocaleService.EN_US, xcFormTranslations_enUS);
        i18n.setTranslations(LocaleService.DE_DE, xcFormTranslations_deDE);
    }


    ngAfterContentInit() {
        super.ngAfterContentInit();

        if (this.placeholder) {
            this.translate(ATTRIBUTE_PLACEHOLDER);
        }
    }


    onkeydown(event: KeyboardEvent) {
        this.valueKeydown.emit(event);
        // stop bubbling up if someone presses the "Delete"-Key
        if (event.key === 'Delete' || event.code === 'Delete') {
            event.stopPropagation();
        }
    }


    addValidator(validator: ValidatorFn) {
        const composedValidators = Validators.compose([this.formControl.validator, validator]);
        this.formControl.setValidators(composedValidators);
    }
}
