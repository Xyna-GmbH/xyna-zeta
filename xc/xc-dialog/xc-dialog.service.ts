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
import { ComponentType } from '@angular/cdk/portal';
import { Injectable } from '@angular/core';
import { MatDialog, MatDialogConfig, MatDialogRef } from '@angular/material/dialog';

import { filter, mapTo } from 'rxjs/operators';

import { AuthEventService } from '../../auth/auth-event.service';
import { I18nService } from '../../i18n';
import { xcDialogTranslations_deDE } from './locale/xc-dialog-translations.de-DE';
import { xcDialogTranslations_enUS } from './locale/xc-dialog-translations.en-US';
import { XcAboutDialogComponent, XcAboutDialogConfig } from './xc-about-dialog.component';
import { XcConfirmDialogComponent } from './xc-confirm-dialog.component';
import { XcDialogOptions } from './xc-dialog-wrapper.component';
import { XcDialogComponent } from './xc-dialog.component';
import { XcInfoDialogComponent } from './xc-info-dialog.component';
import { XcMessageDialogComponent } from './xc-message-dialog.component';


@Injectable()
export class XcDialogService {
    static defaultErrorTitle = 'zeta.xc-dialog.info-dialog.error-header';

    private readonly dialogRefStack = new Array<MatDialogRef<any>>();


    constructor(
        private readonly dialog: MatDialog,
        authEventService: AuthEventService,
        protected readonly i18n: I18nService
    ) {
        this.i18n.setTranslations('de-DE', xcDialogTranslations_deDE);
        this.i18n.setTranslations('en-US', xcDialogTranslations_enUS);

        authEventService.didLogout.subscribe(() => {
            // close all opened dialogs in reverse order (top to bottom)
            this.dialogRefStack.reverse().forEach(dialogRef => {
                dialogRef.close();
            });
            // clear stack
            this.dialogRefStack.splice(0);
        });
    }


    private openDialog<T extends XcDialogComponent<any, any>>(componentType: ComponentType<T>, data: any, ariaLabel?: string, panelClass?: string, overrideConfig?: MatDialogConfig): MatDialogRef<T, any> {
        const defaultConfig: MatDialogConfig = {
            data,
            panelClass,
            role: 'dialog',
            disableClose: true,
            autoFocus: 'first-heading',
            ariaLabel: ariaLabel
            // width, height, ...
        };

        if (overrideConfig) {
            Object.keys(overrideConfig).forEach(key => defaultConfig[key] = overrideConfig[key]);
        }

        // open dialog and store ref
        const dialogRef = this.dialog.open(componentType, defaultConfig);
        this.dialogRefStack.push(dialogRef);

        // subscribe to closed event in order to remove ref
        dialogRef.afterClosed().pipe(
            mapTo(this.dialogRefStack.indexOf(dialogRef)), filter(idx => idx !== -1)
        ).subscribe(
            idx => this.dialogRefStack.splice(idx, 1)
        );

        return dialogRef;
    }


    private openMessageDialog<T extends XcMessageDialogComponent<any, any>>(componentType: ComponentType<T>, title: string, message: string, data: any, ariaLabel?: string, details?: string, draggable = false, resizable = false, dialogOptions: XcDialogOptions = {}, overrideConfig?: MatDialogConfig): T {
        const dialogRef = this.openDialog(componentType, data, ariaLabel, '', overrideConfig);
        dialogRef.componentInstance.title = title;
        dialogRef.componentInstance.message = message;
        dialogRef.componentInstance.details = details;
        dialogRef.componentInstance.draggable = draggable;
        dialogRef.componentInstance.resizable = resizable;
        dialogRef.componentInstance.dialogOptions = dialogOptions;
        return dialogRef.componentInstance;
    }


    confirm(title: string, message: string, ariaLabel?: string, draggable = false, resizable = false, dialogOptions: XcDialogOptions = {}): XcConfirmDialogComponent {
        const overrideConfig: MatDialogConfig = {
            ariaDescribedBy: 'xc-confirm-dialog-message-container',
            role: 'dialog'
        };
        return this.openMessageDialog(XcConfirmDialogComponent, title, message, null, ariaLabel, null, draggable, resizable, dialogOptions, overrideConfig);
    }


    info(title: string, message: string, ariaLabel?: string, details?: string, draggable = false, resizable = false, dialogOptions: XcDialogOptions = {}): XcInfoDialogComponent {
        const overrideConfig: MatDialogConfig = {
            ariaDescribedBy: 'xc-info-dialog-message-container',
            role: 'dialog'
        };
        return this.openMessageDialog(XcInfoDialogComponent, title, message, null, ariaLabel, details, draggable, resizable, dialogOptions, overrideConfig);
    }


    error(message: string, ariaLabel?: string, stackTrace?: string, draggable = false, resizable = false, dialogOptions: XcDialogOptions = {}): XcInfoDialogComponent {
        const overrideConfig: MatDialogConfig = {
            ariaDescribedBy: 'xc-info-dialog-message-container',
            role: 'alertdialog'
        };
        return this.openMessageDialog(XcInfoDialogComponent, this.i18n.translate(XcDialogService.defaultErrorTitle), message, null, ariaLabel, stackTrace, draggable, resizable, dialogOptions, overrideConfig);
    }


    about(title: string, copyright: string, versions: string, detailsLink?: string, ariaLabel?: string, draggable = false, resizable = false, dialogOptions: XcDialogOptions = {}): XcAboutDialogComponent {
        const overrideConfig: MatDialogConfig = {
            ariaDescribedBy: 'xc-about-dialog-message-container',
            role: 'dialog'
        };
        const config: XcAboutDialogConfig = {
            title: title,
            copyright: copyright,
            versions: versions,
            detailsLink: detailsLink,
            dialogOptions: dialogOptions,
            draggable: draggable,
            resizable: resizable
        };
        return this.openDialog(XcAboutDialogComponent, config, ariaLabel, '', overrideConfig).componentInstance;
    }


    custom<R = any, D = any, T extends XcDialogComponent<R, D> = XcDialogComponent<R, D>>(componentType: ComponentType<T>, data: D = null, ariaLabel?: string, panelClass?: string): T {
        return this.openDialog(componentType, data, ariaLabel, panelClass).componentInstance;
    }


    isDialogOpen(): boolean {
        return this.dialogRefStack.length > 0;
    }
}
