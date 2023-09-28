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
import { AfterContentInit, AfterViewInit, ChangeDetectorRef, Component, ElementRef, EventEmitter, HostBinding, Input, OnDestroy, Output } from '@angular/core';

import { I18nService, LocaleService } from '../../i18n';

import { coerceBoolean } from '../../base';
import { xcPanelTranslations_deDE } from './locale/xc-panel-translations.de-DE';
import { xcPanelTranslations_enUS } from './locale/xc-panel-translations.en-US';


@Component({
    selector: 'xc-panel',
    templateUrl: './xc-panel.component.html',
    styleUrls: ['./xc-panel.component.scss']
})
export class XcPanelComponent implements AfterViewInit, AfterContentInit, OnDestroy {

    private static readonly headerQuerySelector = 'header';
    private static readonly headerLabelQuerySelector = XcPanelComponent.headerQuerySelector + ' > label';
    private static readonly toggleQuerySelector = 'xc-panel > .collapse-toggle';
    private static readonly toggleButtonQuerySelector = XcPanelComponent.toggleQuerySelector + ' > button';
    private static readonly headerMouseDownEventName = 'mousedown';
    private static readonly headerMouseUpEventName = 'mouseup';

    private _headerElement: Element;
    private _headerLabelElement: Element;
    private _toggleElement: Element;
    private _toggleButtonElement: Element;
    private _ariaLabel: string;
    private _collapsed = false;
    private _collapsable = false;
    private _mouseDown = false;

    tooltip: string;


    private readonly _targetIsSelectable = (target: EventTarget) =>
        target instanceof HTMLElement && target.classList.contains('items-selectable');


    private readonly _headerMouseDownListener = (event: MouseEvent) => {
        if (!this._targetIsSelectable(event.target)) {
            this._mouseDown = true;
        }
    };

    private readonly _headerMouseUpListener = (event: MouseEvent) => {
        if (!this._targetIsSelectable(event.target) && this._mouseDown) {
            this._mouseDown = false;
            this.togglePanel();
        }
    };


    @Output('xc-panel-collapsedChange')
    readonly collapsedChange = new EventEmitter<boolean>();


    constructor(private readonly elementRef: ElementRef, private readonly cdr: ChangeDetectorRef, private readonly i18n: I18nService) {
        this.i18n.setTranslations(LocaleService.DE_DE, xcPanelTranslations_deDE);
        this.i18n.setTranslations(LocaleService.EN_US, xcPanelTranslations_enUS);

        this.tooltip = this.i18n.translate('zeta.xc-panel.collapse-toggle');
    }

    ngAfterContentInit(): void {
        this._headerElement = this.elementRef.nativeElement.querySelector(XcPanelComponent.headerQuerySelector);
        this._headerLabelElement = this.elementRef.nativeElement.querySelector(XcPanelComponent.headerLabelQuerySelector);
    }

    ngAfterViewInit() {
        this._toggleElement = this.elementRef.nativeElement.querySelector(XcPanelComponent.toggleQuerySelector);
        this._toggleButtonElement = this._toggleElement.querySelector(XcPanelComponent.toggleButtonQuerySelector);
        this._toggleElement?.parentElement?.removeChild(this._toggleElement);

        // default: set aria-label to header label
        if (this.ariaLabel === undefined && this._headerLabelElement?.textContent) {
            this._toggleButtonElement?.setAttribute('aria-label', this._headerLabelElement.textContent);
        }

        // configures header element
        // * adds event listeners, if collapsable
        // * sets aria-attributes
        this.collapsable = this._collapsable;
        this.collapsed = this._collapsed;
    }


    ngOnDestroy() {
        // removes event listener, if collapsable
        this.collapsable = false;
    }


    togglePanel() {
        this.collapsed = !this.collapsed;
        this.collapsedChange.emit(this.collapsed);
        this.cdr.markForCheck();
    }


    @Input('xc-panel-aria-label')
    set ariaLabel(ariaLabel: string) {
        this._ariaLabel = ariaLabel;
        if (ariaLabel) {
            this._headerLabelElement?.setAttribute('aria-label', ariaLabel);
            this._headerElement?.setAttribute('aria-label', ariaLabel);
        } else {
            this._headerLabelElement?.removeAttribute('aria-label');
            this._headerElement?.removeAttribute('aria-label');
        }
    }

    get ariaLabel(): string {
        return this._ariaLabel;
    }

    @HostBinding('class.collapsable')
    @Input('xc-panel-collapsable')
    set collapsable(value: boolean) {
        this._collapsable = coerceBoolean(value);
        if (this._headerElement) {
            if (this.collapsable) {
                this._headerElement.prepend(this._toggleElement);
                this._headerElement.addEventListener(XcPanelComponent.headerMouseDownEventName, this._headerMouseDownListener);
                this._headerElement.addEventListener(XcPanelComponent.headerMouseUpEventName, this._headerMouseUpListener);
                // aria-label is already applied to the toggle-button, header-label/header should not be selectable via keyboard
                this._headerElement.removeAttribute('tabindex');
                this._headerLabelElement?.removeAttribute('tabindex');
            } else {
                this._toggleElement?.parentElement?.removeChild(this._toggleElement);
                this._headerElement.removeEventListener(XcPanelComponent.headerMouseDownEventName, this._headerMouseDownListener);
                this._headerElement.removeEventListener(XcPanelComponent.headerMouseUpEventName, this._headerMouseUpListener);
                // make header-label/header selectable via keyboard to read its textContent/aria-label
                if (this._headerLabelElement) {
                    this._headerLabelElement.setAttribute('tabindex', '0');
                } else if (this.ariaLabel) {
                    this._headerElement.setAttribute('tabindex', '0');
                }
            }
        }
    }


    get collapsable(): boolean {
        return this._collapsable;
    }


    @HostBinding('class.collapsed')
    @Input('xc-panel-collapsed')
    set collapsed(value: boolean) {
        this._collapsed = coerceBoolean(value);
        if (this._toggleButtonElement && this.collapsable) {
            this._toggleButtonElement.setAttribute('aria-expanded', this.collapsed ? 'false' : 'true');
        }
    }


    get collapsed(): boolean {
        return this._collapsed;
    }
}
