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
import { Directive, ElementRef, Input, OnInit } from '@angular/core';

import { trim } from '@zeta/base';

import { I18nService } from './i18n.service';


export abstract class XcI18nBase {

    protected readonly attributeName = 'xc-i18n-context';

    getContext(element: HTMLElement): string {
        if (element) {
            let currentEl = element;

            while (currentEl?.parentElement) {
                const parentEl = currentEl.parentElement;
                const parentAttribute = parentEl.getAttribute(this.attributeName);
                if (parentAttribute) {
                    return parentAttribute;
                }
                currentEl = parentEl;
            }
        }
        return undefined;
    }
}



@Directive({
    selector: '[xc-i18n-context]'
})
export class XcI18nContextDirective extends XcI18nBase implements OnInit {

    private context: string;

    @Input('xc-i18n-context')
    set i18nContext(value: string) {
        this.context = value;
        this.evaluateContext();
    }

    constructor(private readonly elementRef: ElementRef<HTMLElement>) {
        super();
    }

    ngOnInit() {
        this.evaluateContext();
    }

    private evaluateContext() {
        const generatedContext = this.getContext(this.elementRef.nativeElement);
        this.elementRef.nativeElement.setAttribute(this.attributeName, generatedContext ? generatedContext + '.' + this.context : this.context);
    }
}



@Directive({
    selector: '[xc-i18n]'
})
export class XcI18nTranslateDirective extends XcI18nBase implements OnInit {

    private _context: string;

    readonly element: HTMLElement;

    constructor(elementRef: ElementRef<HTMLElement>, private readonly i18n: I18nService) {
        super();

        this.element = elementRef.nativeElement;
    }

    ngOnInit() {
        this._context = this.getContext(this.element);
        this.element.setAttribute('xc-i18n', this._context ?? '');

        const isXc = this.element.tagName.startsWith('XC-');

        const content = trim(this.element.textContent);

        if (content && !isXc) {
            const translation = this.i18n.getTranslation(this._context ? this._context + '.' + content : content);
            this.element.textContent = translation?.value;

            if (translation?.pronunciationLanguage) {
                this.element.setAttribute('lang', translation.pronunciationLanguage);
            }
        }
    }
}

