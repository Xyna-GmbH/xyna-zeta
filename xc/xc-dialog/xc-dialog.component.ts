
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
import { Component, HostListener, InjectionToken, Injector, Optional } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

import { Observable } from 'rxjs';

import { XcDynamicDismissableComponent } from '../shared/xc-dynamic-dismissable.component';


@Component({
    template: '',
    standalone: false
})
export abstract class XcDialogComponent<R = void, D = void> extends XcDynamicDismissableComponent<R, D> {

    private readonly dialogRef: MatDialogRef<any>;

    private _maximized = false;
    private _preMaximizeRootWidth: number;
    private _preMaximizeRootHeight: number;
    private _preMaximizePageX: number;
    private _preMaximizePageY: number;

    constructor(@Optional() injector: Injector) {
        super(injector);
        this.dialogRef = injector.get(MatDialogRef);
    }


    protected getToken(): InjectionToken<D> {
        return MAT_DIALOG_DATA;
    }


    @HostListener('keydown.Escape')
    dismiss(result?: R) {
        this.dialogRef.close(result);
    }


    afterDismiss(): Observable<R> {
        return this.dialogRef.afterClosed();
    }

    toggleMaximize(event) {
        const element = document.querySelector('xc-dialog-wrapper').firstChild;

        if (this._maximized) {
            this._revertMaximize(element as HTMLElement);
        } else {
            this._maximize(element as HTMLElement);
        }
        event.preventDefault();
    }

    private _maximize(element: HTMLElement) {
        this._preMaximizePageX = parseFloat(element.style.top);
        this._preMaximizePageY = parseFloat(element.style.left);
        this._preMaximizeRootWidth = element.offsetWidth;
        this._preMaximizeRootHeight = element.offsetHeight;

        element.style.top = '0px';
        element.style.left = '0px';
        element.style.width = '100vw';
        element.style.height = '100vh';

        this._maximized = true;
    }

    private _revertMaximize(element: HTMLElement) {
        element.style.top = this._preMaximizePageX + 'px';
        element.style.left = this._preMaximizePageY + 'px';
        element.style.width = this._preMaximizeRootWidth + 'px';
        element.style.height = this._preMaximizeRootHeight + 'px';

        this._maximized = false;
    }
}
