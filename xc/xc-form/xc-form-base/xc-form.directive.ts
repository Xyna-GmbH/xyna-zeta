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
import { ChangeDetectorRef, ContentChildren, Directive, EventEmitter, OnDestroy, Output, QueryList } from '@angular/core';
import { FormControl } from '@angular/forms';

import { merge, Observable, Subscription } from 'rxjs';

import { XcFormBaseComponent } from './xc-form-base.component';
import { XcFormValidatorBaseDirective } from './xc-form-validator-base.directive';


@Directive({
    selector: '[xc-form]',
    exportAs: 'xc-form',
    standalone: false
})
export class XcFormDirective implements OnDestroy {

    private _invalid = false;
    private _validators: QueryList<XcFormValidatorBaseDirective>;
    private readonly _formControlInvalidMap = new Map<FormControl, boolean>();
    private _formControlStateChangeSubscription;

    @Output('xc-form-validity-change')
    private readonly validityChangeEmitter = new EventEmitter<XcFormDirective>();

    /**
     * Query all XcFormBaseComponents; No matter if they have a validator attached or not.
     * Additional Remark: Only affects elements inside the component of this directive. Sub-component's templates are black boxes to its ancestors (see doc of ContentChildren)
     */
    @ContentChildren(XcFormBaseComponent, { descendants: true })
    components = new QueryList<XcFormBaseComponent>();

    /**
     * Query all first validators* but only their host's FormControl is needed
     * See additional remark above
     * 1) if a single component has more than one XcFormValidatorBaseDirective, the QueryList will only contain the first one
     * This may be a change of the Ivy Engine
     */
    @ContentChildren(XcFormValidatorBaseDirective, { descendants: true })
    set validators(value: QueryList<XcFormValidatorBaseDirective>) {
        this._validators = value;

        this._formControlInvalidMap.clear();
        this._formControlStateChangeSubscription?.unsubscribe();
        this._formControlStateChangeSubscription = new Subscription();

        // save their host's FormControl in a Map with their invalid state.
        this._validators.forEach(validator => {
            this._formControlInvalidMap.set(validator.host.formControl, validator.host.formControl.invalid);
        });

        this._formControlInvalidMap.forEach((_, formControl) => {
            this._formControlStateChangeSubscription.add(
                formControl.statusChanges.subscribe(state => {
                    this._formControlInvalidMap.set(formControl, state === 'INVALID');
                    this.updateValueAndValidity();
                })
            );
        });

        // checks validity when the validators are found by @ContentChildren
        void Promise.resolve().then(() => {
            this.triggerUpdateValueAndValidity();
        });
    }


    get validators(): QueryList<XcFormValidatorBaseDirective> {
        return this._validators;
    }


    private updateInvalidState(value: boolean) {
        if (this._invalid !== value) {
            this._invalid = value;
            this.validityChangeEmitter.emit(this);
            this.cdr.detectChanges();
        }
    }


    constructor(private readonly cdr: ChangeDetectorRef) {}


    ngOnDestroy() {
        this._formControlStateChangeSubscription.unsubscribe();
        this._formControlInvalidMap.clear();
    }


    /**
     * @deprecated
     *  validates and checks components and sets _invalid property according to result
     */
    checkValidators() {
        void Promise.resolve().then(() => {
            this.updateInvalidState(this.components.some(component => {
                if (component.formControl.validator) {
                    return component.formControl.validator(component.formControl) !== null;
                }
                return component.formControl.invalid;
            }));
        });
    }


    /**
     * checks formControlInvalidMap, which contains all formControls and their invalid status, then sets _invalid property according to result
     * Note: through to the subscription to the formControl's statusChange, the map contains the live state as displayed in the GUI and the XcFormDirective
     * does not need to validate on its own again => saving performance
     */
    updateValueAndValidity() {
        let invalid = false;
        this._formControlInvalidMap.forEach((invalidFlag, _) => {
            invalid = invalid || invalidFlag;
        });
        this.updateInvalidState(invalid);
    }


    triggerUpdateValueAndValidity() {
        let invalid = false;
        this._formControlInvalidMap.forEach((_, formControl) => {
            formControl.updateValueAndValidity();
            invalid = invalid || formControl.invalid;
        });
        this.updateInvalidState(invalid);
    }


    get validityChange(): Observable<XcFormDirective> {
        return this.validityChangeEmitter.asObservable();
    }


    get valid(): boolean {
        return !this._invalid;
    }


    get invalid(): boolean {
        return this._invalid;
    }


    get pristine(): boolean {
        return !this.dirty;
    }


    get dirty(): boolean {
        return this.components.some(component => component.formControl.dirty);
    }


    get untouched(): boolean {
        return !this.touched;
    }


    get touched(): boolean {
        return this.components.some(component => component.formControl.touched);
    }


    get valueChanges(): Observable<any> {
        return merge(...this.components.map(component => component.formControl.valueChanges));
    }


    get statusChanges(): Observable<any> {
        return merge(...this.components.map(component => component.formControl.statusChanges));
    }


    markAsPristine() {
        this.components.forEach(component => component.formControl.markAsPristine());
    }


    markAsDirty() {
        this.components.forEach(component => component.formControl.markAsDirty());
    }


    markAsUntouched() {
        this.components.forEach(component => component.formControl.markAsUntouched());
    }


    markAsTouched() {
        this.components.forEach(component => component.formControl.markAsTouched());
    }
}
