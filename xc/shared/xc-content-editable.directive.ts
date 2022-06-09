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
import { Directive, ElementRef, EventEmitter, HostBinding, HostListener, Input, Output } from '@angular/core';

import { coerceBoolean } from '../../base';


export type XcContentEditableMode = 'none' | 'mousedown' | 'dblclick';


@Directive({
    selector: '[xc-content-editable]'
})
export class XcContentEditableDirective {
    private static readonly PLAINTEXT_ONLY = 'plaintext-only';
    private static contentEditableValue: string;

    static getContentEditableValue(): string {
        if (XcContentEditableDirective.contentEditableValue === undefined) {
            const div = window.document.createElement('div');
            div.setAttribute('contenteditable', XcContentEditableDirective.PLAINTEXT_ONLY);
            XcContentEditableDirective.contentEditableValue = div.contentEditable?.toLowerCase() === XcContentEditableDirective.PLAINTEXT_ONLY
                ? XcContentEditableDirective.PLAINTEXT_ONLY
                : 'true';
        }
        return this.contentEditableValue;
    }

    private _mode: XcContentEditableMode;
    private _multiline = false;

    @HostBinding('class.xc-content-editable-active')
    private _active = false;

    @Output('xc-content-editable-enter')
    readonly enter = new EventEmitter<XcContentEditableDirective>();

    @Output('xc-content-editable-leave')
    readonly leave = new EventEmitter<XcContentEditableDirective>();

    @Output('xc-content-editable-textChange')
    readonly textChange = new EventEmitter<string>();


    constructor(private readonly elementRef: ElementRef) {
    }


    @Input('xc-content-editable')
    set contentEditable(mode: XcContentEditableMode) {
        this._mode = mode || 'none';
    }


    get contentEditable(): XcContentEditableMode {
        return this._mode;
    }


    @Input('xc-content-editable-multiline')
    set multiline(value: boolean) {
        this._multiline = coerceBoolean(value);
    }


    get multiline(): boolean {
        return this._multiline;
    }


    @Input('xc-content-editable-text')
    set text(value: string) {
        this.elementRef.nativeElement.textContent = value || '';
    }


    get text(): string {
        return this.elementRef.nativeElement.textContent;
    }


    private activate(selectText: boolean) {
        this._active = true;
        this.enter.emit(this);

        // set content editable attribute
        this.elementRef.nativeElement.contentEditable = XcContentEditableDirective.getContentEditableValue();

        // select text content
        if (selectText) {
            const range = window.document.createRange();
            range.selectNodeContents(this.elementRef.nativeElement);
            const selection = window.getSelection();
            selection.removeAllRanges();
            selection.addRange(range);
        }
    }


    private deactivate() {
        // unset content editable attribute
        this.elementRef.nativeElement.contentEditable = 'false';

        this.textChange.emit(this.text);
        this.leave.emit(this);
        this._active = false;
    }


    @HostListener('mousedown')
    private mousedown() {
        if (!this._active && this._mode === 'mousedown') {
            this.activate(false);
        }
    }


    @HostListener('dblclick')
    private dblclick() {
        if (!this._active && this._mode === 'dblclick') {
            this.activate(true);
        }
    }


    @HostListener('blur')
    private blur() {
        if (this._active) {
            this.deactivate();
        }
    }


    @HostListener('keydown.enter')
    private enterKey() {
        if (!this.multiline) {
            this.deactivate();
        }
    }


    @HostListener('keydown.delete', ['$event'])
    private deleteKey(event: Event) {
        if (this._active) {
            event.stopPropagation();
        }
    }
}
