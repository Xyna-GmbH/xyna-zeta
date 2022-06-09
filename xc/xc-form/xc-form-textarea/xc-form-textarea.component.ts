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
import { Component, forwardRef, Input } from '@angular/core';

import { coerceBoolean } from '@zeta/base';

import { XcFormBaseComponent } from '../xc-form-base/xc-form-base.component';


@Component({
    selector: 'xc-form-textarea',
    templateUrl: './xc-form-textarea.component.html',
    styleUrls: ['../xc-form-base/xc-form-base.component.scss', './xc-form-textarea.component.scss'],
    providers: [{ provide: XcFormBaseComponent, useExisting: forwardRef(() => XcFormTextareaComponent) }]
})
export class XcFormTextareaComponent extends XcFormBaseComponent {

    private _minLines = 5;
    private _maxLines = 5;
    private _textareaAutosize = true;

    /**
     * Sets height for the given number of lines
     */
    @Input('xc-form-textarea-lines')
    set lines(value: number) {
        this.minLines = value;
        this.maxLines = value;
        this._textareaAutosize = true;
    }

    /**
     * sets a minimum of lines in which the component finds
     * the optimized height for its current content
     * Note: works only if "xc-form-textarea-autosize" is true
     */
    @Input('xc-form-textarea-minlines')
    set minLines(value: number) {
        this._minLines = value;
    }

    get minLines(): number {
        return this._minLines;
    }

    /**
     * sets a maximum of lines in which the component finds
     * the optimized height for its current content
     * Note: works only if "xc-form-textarea-autosize" is true
     */
    @Input('xc-form-textarea-maxlines')
    set maxLines(value: number) {
        this._maxLines = value;
    }

    get maxLines(): number {
        return this._maxLines;
    }

    /**
     * de-/activates the search for the optimzed height for
     * the optimzed height for the current content
     * Autosize deactivated makes it easier for custom style to show effect
     */
    @Input('xc-form-textarea-autosize')
    set textareaAutosize(value: boolean) {
        this._textareaAutosize = coerceBoolean(value);
    }

    get textareaAutosize(): boolean {
        return this._textareaAutosize;
    }
}
