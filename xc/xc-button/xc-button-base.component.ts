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
import { AfterContentInit, Component, ElementRef, HostBinding, HostListener, Input, OnInit, ViewChild } from '@angular/core';
import { MatRipple } from '@angular/material/core';

import { coerceBoolean } from '../../base';
import { I18nService } from '../../i18n';
import { ATTRIBUTE_ARIALABEL } from '../shared/xc-i18n-attributes';
import { XcThemeableComponent } from '../shared/xc-themeable.component';


@Component({
    template: ''
})
export class XcButtonBaseComponent extends XcThemeableComponent implements OnInit, AfterContentInit {

    private _ariaLabel: string;
    protected _tabDisabled = false;
    protected _disabled = false;
    protected _busy = false;
    protected _focusInitial = false;

    @Input()
    type = 'button';

    @ViewChild('button', { read: ElementRef, static: false })
    buttonElementRef: ElementRef;

    /** material design ripple directive of the button */
    @ViewChild(MatRipple, { static: false })
    ripple: MatRipple;


    i18nContext: string;


    constructor(protected elementRef: ElementRef, protected readonly i18n: I18nService) {
        super();
        (elementRef.nativeElement as HTMLElement).onclick = (event: MouseEvent) => {
            // prevent clicks outside of button dom element
            if (!this.buttonElementRef.nativeElement.contains(event.target)) {
                event.stopPropagation();
            }
        };
    }


    protected setAriaLabel(value: string) {
        this._ariaLabel = value;
    }


    ngOnInit() {
        // initially, the setter has to be triggered to get a default value for ariaLabel
        this.setAriaLabel(this.ariaLabel);
    }


    ngAfterContentInit() {
        this.i18nContext = this.elementRef.nativeElement.getAttribute('xc-i18n');
        if (this.ariaLabel) {
            this.translate(ATTRIBUTE_ARIALABEL);
        }
    }


    protected translate(attribute: string) {
        if (this.i18nContext !== undefined && this.i18nContext !== null && this[attribute]) {
            this[attribute] = this.i18n.translate(this.i18nContext ? this.i18nContext + '.' + this[attribute] : this[attribute]);
        }
    }


    @Input()
    set tabDisabled(value: boolean) {
        this._tabDisabled = coerceBoolean(value);
    }


    get tabDisabled(): boolean {
        return this._tabDisabled;
    }


    @HostBinding('class.disabled')
    @Input()
    set disabled(value: boolean) {
        this._disabled = coerceBoolean(value);
    }


    get disabled(): boolean {
        return this._disabled;
    }


    @HostBinding('class.busy')
    @Input()
    set busy(value: boolean) {
        this._busy = coerceBoolean(value);
    }


    get busy(): boolean {
        return this._busy;
    }


    get focusInitial(): boolean {
        return this._focusInitial;
    }


    @Input('xc-focus-initial')
    set focusInitial(value: boolean) {
        this._focusInitial = coerceBoolean(value);
    }


    @Input('xc-button-aria-label')
    set ariaLabel(value: string) {
        this.setAriaLabel(value);
        this.translate(ATTRIBUTE_ARIALABEL);
    }


    get ariaLabel(): string {
        return this._ariaLabel;
    }


    @HostListener('keydown.enter')
    @HostListener('keydown.space')
    launchRipple() {
        this.ripple.launch(0, 0, { centered: true });
    }


    @HostListener('mousedown', ['$event'])
    @HostListener('click', ['$event'])
    prevent(event: Event) {
        // prevents table selection when user clicks on an actionElement (XcIconButton)
        event.stopPropagation();
    }
}
