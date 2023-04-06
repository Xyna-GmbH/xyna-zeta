import { AfterViewInit, Component, ElementRef, HostListener, Input, Renderer2, ViewChild } from '@angular/core';

import { coerceBoolean } from '../../base';
import { XcDragOptions } from '../shared/xc-drag.directive';
import { XcResizeOptions } from '../shared/xc-resize.directive';


export enum XcDialogPositions {
    CENTER = 'center',
    NORDWEST = 'nordwest',
    NORDEAST = 'nordeast',
    SOUTHEAST = 'southeast',
    SOUTHWEST = 'southwest'
}


export interface XcDialogOptions {
    dragOptions?: XcDragOptions;
    resizeOptions?: XcResizeOptions;
    initialHeight?: string;
    initialWidth?: string;
    position?: XcDialogPositions;
}

@Component({
    selector: 'xc-dialog-wrapper',
    templateUrl: './xc-dialog-wrapper.component.html',
    styleUrls: ['./xc-dialog-wrapper.component.scss']
})
export class XcDialogWrapperComponent implements AfterViewInit {

    private _draggable = false;
    private _resizable = false;
    private _dialogOptions: XcDialogOptions = {};
    private defaultButton: HTMLButtonElement;

    @Input()
    set draggable(value: boolean) {
        this._draggable = coerceBoolean(value);
    }

    get draggable(): boolean {
        return this._draggable;
    }

    @Input()
    set resizable(value: boolean) {
        this._resizable = coerceBoolean(value);
    }

    get resizable(): boolean {
        return this._resizable;
    }

    @Input('xc-dialog-options')
    set dialogOptions(value: XcDialogOptions) {
        if (value) {
            this._dialogOptions.dragOptions = {
                dragX: coerceBoolean(value.dragOptions?.dragX),
                dragY: coerceBoolean(value.dragOptions?.dragY),
                dragInViewport: coerceBoolean(value.dragOptions?.dragInViewport)
            };
            this._dialogOptions.resizeOptions = {
                all: coerceBoolean(value.resizeOptions?.all),
                south: coerceBoolean(value.resizeOptions?.south),
                east: coerceBoolean(value.resizeOptions?.east),
                southEast: coerceBoolean(value.resizeOptions?.southEast),
                southWest: coerceBoolean(value.resizeOptions?.southWest),
                west: coerceBoolean(value.resizeOptions?.west),
                northWest: coerceBoolean(value.resizeOptions?.northWest),
                north: coerceBoolean(value.resizeOptions?.north),
                northEast: coerceBoolean(value.resizeOptions?.northEast),

                resizeInViewport: coerceBoolean(value.resizeOptions?.resizeInViewport),

                minHeight: value.resizeOptions?.minHeight,
                minWidth: value.resizeOptions?.minWidth,
                maxHeight: value.resizeOptions?.maxHeight,
                maxWidth: value.resizeOptions?.maxWidth
            };
            this._dialogOptions.initialHeight = value.initialHeight;
            this._dialogOptions.initialWidth = value.initialWidth;
            this._dialogOptions.position = value.position;
        }
    }

    get dialogOptions(): XcDialogOptions {
        return this._dialogOptions;
    }

    @ViewChild('dialogRoot', { static: false }) dialogRoot: ElementRef;

    dragEventTarget: MouseEvent | TouchEvent;

    constructor(protected readonly renderer: Renderer2, private readonly element: ElementRef) {
        this.element.nativeElement.style.setProperty('--resizable', this.resizable);
    }

    ngAfterViewInit() {
        this.center();

        this.defaultButton = this.element.nativeElement.querySelector('[color="primary"] button') ?? this.element.nativeElement.querySelectorAll('.footer button').item(0);
    }

    center() {
        if (this.dialogRoot) {
            this.renderer.setStyle(this.dialogRoot.nativeElement, 'height', this.dialogOptions.initialHeight ? this.dialogOptions.initialHeight : 'unset');
            this.renderer.setStyle(this.dialogRoot.nativeElement, 'width', this.dialogOptions.initialWidth ? this.dialogOptions.initialWidth : 'unset');
            const elementWidth = this.dialogRoot.nativeElement.offsetWidth;
            const elementHeight = this.dialogRoot.nativeElement.offsetHeight;
            this.renderer.setStyle(this.dialogRoot.nativeElement, 'height', this.dialogOptions.initialHeight ? this.dialogOptions.initialHeight : elementHeight > window.innerHeight ? '80vh' : 'auto');
            this.renderer.setStyle(this.dialogRoot.nativeElement, 'width', this.dialogOptions.initialWidth ? this.dialogOptions.initialWidth : elementWidth > window.innerWidth ? '80vw' : 'auto');
            this.setPosition();
        }
    }

    setPosition() {
        const elementWidth = this.dialogRoot.nativeElement.offsetWidth;
        const elementHeight = this.dialogRoot.nativeElement.offsetHeight;
        let left: number;
        let top: number;
        switch (this.dialogOptions.position) {
            case XcDialogPositions.CENTER:
                left = Math.max((window.innerWidth - elementWidth) / 2, 0);
                top = Math.max((window.innerHeight - elementHeight) / 2, 0);
                break;
            case XcDialogPositions.NORDWEST:
                left = 0;
                top = 0;
                break;
            case XcDialogPositions.NORDEAST:
                left = window.innerWidth - elementWidth;
                top = 0;
                break;
            case XcDialogPositions.SOUTHEAST:
                left = window.innerWidth - elementWidth;
                top = window.innerHeight - elementHeight;
                break;
            case XcDialogPositions.SOUTHWEST:
                left = 0;
                top = window.innerHeight - elementHeight;
                break;
            default:
                left = Math.max((window.innerWidth - elementWidth) / 2, 0);
                top = Math.max((window.innerHeight - elementHeight) / 2, 0);
        }

        this.renderer.setStyle(this.dialogRoot.nativeElement, 'left', left + 'px');
        this.renderer.setStyle(this.dialogRoot.nativeElement, 'top', top + 'px');
    }

    initDrag(event: MouseEvent | TouchEvent) {
        this.dragEventTarget = event;
    }

    @HostListener('keydown.enter', ['$event'])
    enterKey(event: KeyboardEvent) {
        // trigger default button, as long as there is no other interactive element under focus
        if (((event.target as HTMLElement).tabIndex === -1 || event.target === this.defaultButton) && !this.defaultButton.disabled) {
            this.defaultButton?.click();
        }
    }
}
