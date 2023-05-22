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
import { Component, ElementRef, HostBinding, Input, ViewChild } from '@angular/core';
import { ValidatorFn, Validators } from '@angular/forms';
import { MatInput } from '@angular/material/input';

import { I18nService } from '@zeta/i18n';

import { XcFormBaseComponent } from './xc-form-base.component';


@Component({
    template: ''
})
export class XcFormBaseInputComponent extends XcFormBaseComponent {

    private suffixToggled = false;
    private suffixUnfocusedInput = false;

    @HostBinding('attr.suffix')
    @Input('xc-form-field-suffix')
    suffix?: 'clear' | 'nullify' | 'password' | 'dropdown';

    @ViewChild(MatInput, {static: false})
    input: MatInput;

    @Input()
    type = 'text';

    required = false;


    constructor(element: ElementRef<HTMLElement>, i18n: I18nService) {
        super(element, i18n);

        this.required = this.element.nativeElement.hasAttribute('xc-form-validator-required');
    }


    get suffixVisible(): boolean {
        if (this.disabled) {
            return false;
        }
        if (this.suffix === 'clear') {
            return !!this.value;
        }
        if (this.suffix === 'nullify') {
            return this.value != null;
        }
        if (this.suffix === 'password') {
            return true;
        }
        if (this.suffix === 'dropdown') {
            return true;
        }
        return false;
    }


    get suffixContent(): string {
        if (this.suffix === 'clear') {
            return 'clear';
        }
        if (this.suffix === 'nullify') {
            return 'clear';
        }
        if (this.suffix === 'password') {
            return this.suffixToggled ? 'visibility_off' : 'visibility';
        }
        if (this.suffix === 'dropdown') {
            return 'expand_more';
        }
        return undefined;
    }


    protected suffixClickChangedValue(unfocusedInput: boolean) {
        this.input.focus();
    }


    suffixMouseDown(event: MouseEvent) {
        this.suffixUnfocusedInput = this.input.focused;
    }


    suffixClick(event: MouseEvent) {
        event.stopPropagation();
        if (!this.disabled && !this.readonly) {
            this.suffixToggled = !this.suffixToggled;

            if (this.suffix === 'clear') {
                this.formControl.setValue('');
            } else if (this.suffix === 'nullify') {
                this.formControl.setValue(null);
            } else if (this.suffix === 'password') {
                this.type = this.suffixToggled ? 'text' : 'password';
            }
            if (this.suffix === 'clear' || this.suffix === 'nullify') {
                this.formControl.markAsDirty();
                this.suffixClickChangedValue(this.suffixUnfocusedInput);
            }
        }
        this.suffixUnfocusedInput = false;
    }


    setFocus() {
        this.input?.focus();
    }


    addValidator(validator: ValidatorFn) {
        super.addValidator(validator);

        if (validator === Validators.required) {
            this.required = true;
        }
    }
}
