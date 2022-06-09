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
import { AfterViewInit, Directive, ElementRef, EventEmitter, HostListener, Input, OnDestroy, Output, Renderer2 } from '@angular/core';

import { fromEvent, Subscription } from 'rxjs/';
import { takeUntil } from 'rxjs/operators';

import { coerceBoolean } from '../../base';


// https://github.com/mazdik/ng-modal
export interface XcResizeOptions {
    all?: boolean;
    south?: boolean;
    east?: boolean;
    southEast?: boolean;
    southWest?: boolean;
    west?: boolean;
    northWest?: boolean;
    north?: boolean;
    northEast?: boolean;

    resizeInViewport?: boolean;

    minHeight?: string;
    minWidth?: string;
    maxHeight?: string;
    maxWidth?: string;
}

export interface ResizableEvent {
    width: number;
    height: number;
    event?: MouseEvent | Touch;
    direction?: 'horizontal' | 'vertical';
}


@Directive({
    selector: '[xc-resize]'
})
export class XcResizeDirective implements AfterViewInit, OnDestroy {

    @Input('xc-resize')
    enabled = true;

    private _resizeOptions: XcResizeOptions = {};

    @Input('xc-resize-options')
    set resizeOptions(value: XcResizeOptions) {
        this._resizeOptions.all = coerceBoolean(value?.all) || true;
        this._resizeOptions.south = coerceBoolean(value?.south) || false;
        this._resizeOptions.east = coerceBoolean(value?.east) || false;
        this._resizeOptions.southEast = coerceBoolean(value?.southEast) || false;
        this._resizeOptions.southWest = coerceBoolean(value?.southWest) || false;
        this._resizeOptions.west = coerceBoolean(value?.west) || false;
        this._resizeOptions.northWest = coerceBoolean(value?.northWest) || false;
        this._resizeOptions.north = coerceBoolean(value?.north) || false;
        this._resizeOptions.northEast = coerceBoolean(value?.northEast) || false;

        this._resizeOptions.resizeInViewport = coerceBoolean(value?.resizeInViewport) || true;

        if (value) {
            this._resizeOptions.minHeight = value.minHeight;
            this._resizeOptions.minWidth = value.minWidth;
            this._resizeOptions.maxHeight = value.maxHeight;
            this._resizeOptions.maxWidth = value.maxWidth;
        }
    }

    get resizeOptions(): XcResizeOptions {
        return this._resizeOptions;
    }

    @Output() readonly resizeBegin: EventEmitter<any> = new EventEmitter();
    @Output() readonly resizing: EventEmitter<ResizableEvent> = new EventEmitter();
    @Output() readonly resizeEnd: EventEmitter<ResizableEvent> = new EventEmitter();

    element: HTMLElement;
    private subscription: Subscription;
    private newWidth: number;
    private newHeight: number;
    private newLeft: number;
    private newTop: number;
    private resizingS: boolean;
    private resizingE: boolean;
    private resizingSE: boolean;
    private resizingSW: boolean;
    private resizingW: boolean;
    private resizingNW: boolean;
    private resizingN: boolean;
    private resizingNE: boolean;

    private minWidth: number;
    private maxWidth: number;
    private minHeight: number;
    private maxHeight: number;

    private top: number;
    private left: number;

    constructor(protected readonly elementRef: ElementRef, protected readonly renderer: Renderer2) {
        this.element = elementRef.nativeElement;
    }

    ngAfterViewInit() {
        if (this.enabled) {
            if (this.resizeOptions.south || this.resizeOptions.east || this.resizeOptions.southEast || this.resizeOptions.southWest || this.resizeOptions.west || this.resizeOptions.northWest || this.resizeOptions.north || this.resizeOptions.northEast) {
                this.resizeOptions.all = false;
            }

            if (this.resizeOptions.all) {
                this.createHandle('resize-handle-s');
                this.createHandle('resize-handle-e');
                this.createHandle('resize-handle-se');
                this.createHandle('resize-handle-sw');
                this.createHandle('resize-handle-w');
                this.createHandle('resize-handle-nw');
                this.createHandle('resize-handle-n');
                this.createHandle('resize-handle-ne');
            } else {
                if (this.resizeOptions.south) {
                    this.createHandle('resize-handle-s');
                }
                if (this.resizeOptions.east) {
                    this.createHandle('resize-handle-e');
                }
                if (this.resizeOptions.southEast) {
                    this.createHandle('resize-handle-se');
                }
                if (this.resizeOptions.southWest) {
                    this.createHandle('resize-handle-sw');
                }
                if (this.resizeOptions.west) {
                    this.createHandle('resize-handle-w');
                }
                if (this.resizeOptions.northWest) {
                    this.createHandle('resize-handle-nw');
                }
                if (this.resizeOptions.north) {
                    this.createHandle('resize-handle-n');
                }
                if (this.resizeOptions.northEast) {
                    this.createHandle('resize-handle-ne');
                }
            }

            if (this.resizeOptions.minHeight) {
                this.renderer.setStyle(this.element, 'minHeight', this.resizeOptions.minHeight);
            }
            if (this.resizeOptions.minWidth) {
                this.renderer.setStyle(this.element, 'minWidth', this.resizeOptions.minWidth);
            }
            if (this.resizeOptions.maxHeight) {
                this.renderer.setStyle(this.element, 'maxHeight', this.resizeOptions.maxHeight);
            }
            if (this.resizeOptions.maxWidth) {
                this.renderer.setStyle(this.element, 'maxWidth', this.resizeOptions.maxWidth);
            }

            const computedStyle = window.getComputedStyle(this.element);
            this.minWidth = parseFloat(computedStyle.minWidth);
            this.maxWidth = parseFloat(computedStyle.maxWidth);
            this.minHeight = parseFloat(computedStyle.minHeight);
            this.maxHeight = parseFloat(computedStyle.maxHeight);
        }
    }

    ngOnDestroy() {
        this.destroySubscription();
    }

    @HostListener('mousedown', ['$event'])
    @HostListener('touchstart', ['$event'])
    onMousedown(event: MouseEvent | TouchEvent) {
        if (this.enabled) {
            const classList = ((event.target) as HTMLElement).classList;
            const isSouth = classList.contains('resize-handle-s');
            const isEast = classList.contains('resize-handle-e');
            const isSouthEast = classList.contains('resize-handle-se');
            const isSouthWest = classList.contains('resize-handle-sw');
            const isWest = classList.contains('resize-handle-w');
            const isNorthWest = classList.contains('resize-handle-nw');
            const isNorth = classList.contains('resize-handle-n');
            const isNorthEast = classList.contains('resize-handle-ne');

            const evt = this.getEvent(event);
            const screenX = evt.screenX;
            const screenY = evt.screenY;
            const width = this.element.clientWidth;
            const height = this.element.clientHeight;
            this.left = this.element.offsetLeft;
            this.top = this.element.offsetTop;

            const isTouchEvent = event.type.startsWith('touch');
            const moveEvent = isTouchEvent ? 'touchmove' : 'mousemove';
            const upEvent = isTouchEvent ? 'touchend' : 'mouseup';

            if (isSouth || isEast || isSouthEast || isSouthWest || isWest || isNorthWest || isNorth || isNorthEast) {
                this.initResize(event, isSouth, isEast, isSouthEast, isSouthWest, isWest, isNorthWest, isNorth, isNorthEast);

                const mouseup = fromEvent(document, upEvent);
                this.subscription = mouseup
                    .subscribe((ev: MouseEvent | TouchEvent) => this.onMouseup(ev));

                const mouseMoveSub = fromEvent(document, moveEvent)
                    .pipe(takeUntil(mouseup))
                    .subscribe((e: MouseEvent | TouchEvent) => this.move(e, width, height, this.top, this.left, screenX, screenY));

                this.subscription.add(mouseMoveSub);
            }
        }
    }

    move(event: MouseEvent | TouchEvent, width: number, height: number, top: number, left: number, screenX: number, screenY: number) {
        const evt = this.getEvent(event);
        const movementX = evt.screenX - screenX;
        const movementY = evt.screenY - screenY;

        this.newWidth = width - (this.resizingSW || this.resizingW || this.resizingNW ? movementX : -movementX);
        this.newHeight = height - (this.resizingNW || this.resizingN || this.resizingNE ? movementY : -movementY);
        this.newLeft = left + movementX;
        this.newTop = top + movementY;

        this.resizeWidth(evt);
        this.resizeHeight(evt);
    }

    onMouseup(event: MouseEvent | TouchEvent) {
        this.endResize(event);
        this.destroySubscription();
    }

    private destroySubscription() {
        if (this.subscription) {
            this.subscription.unsubscribe();
            this.subscription = undefined;
        }
    }

    private createHandle(edgeClass: string) {
        const node = this.renderer.createElement('span');
        node.className = edgeClass;
        this.renderer.setStyle(node, 'position', 'absolute');

        switch (edgeClass) {
            case 'resize-handle-e':
                this.renderer.setStyle(node, 'cursor', 'e-resize');
                this.renderer.setStyle(node, 'height', '100%');
                this.renderer.setStyle(node, 'width', '8px');
                this.renderer.setStyle(node, 'right', '-4px');
                this.renderer.setStyle(node, 'top', '0');
                this.renderer.setStyle(node, 'z-index', '1000');
                break;
            case 'resize-handle-se':
                this.renderer.setStyle(node, 'cursor', 'se-resize');
                this.renderer.setStyle(node, 'height', '16px');
                this.renderer.setStyle(node, 'width', '16px');
                this.renderer.setStyle(node, 'right', '0');
                this.renderer.setStyle(node, 'bottom', '0');
                this.renderer.setStyle(node, 'z-index', '1000');
                break;
            case 'resize-handle-s':
                this.renderer.setStyle(node, 'cursor', 's-resize');
                this.renderer.setStyle(node, 'height', '8px');
                this.renderer.setStyle(node, 'width', '100%');
                this.renderer.setStyle(node, 'bottom', '-4px');
                this.renderer.setStyle(node, 'left', '0');
                this.renderer.setStyle(node, 'z-index', '1000');
                break;
            case 'resize-handle-sw':
                this.renderer.setStyle(node, 'cursor', 'sw-resize');
                this.renderer.setStyle(node, 'height', '16px');
                this.renderer.setStyle(node, 'width', '16px');
                this.renderer.setStyle(node, 'bottom', '0');
                this.renderer.setStyle(node, 'left', '0');
                this.renderer.setStyle(node, 'z-index', '1000');
                break;
            case 'resize-handle-w':
                this.renderer.setStyle(node, 'cursor', 'w-resize');
                this.renderer.setStyle(node, 'height', '100%');
                this.renderer.setStyle(node, 'width', '8px');
                this.renderer.setStyle(node, 'left', '-4px');
                this.renderer.setStyle(node, 'top', '0');
                this.renderer.setStyle(node, 'z-index', '1000');
                break;
            case 'resize-handle-nw':
                this.renderer.setStyle(node, 'cursor', 'nw-resize');
                this.renderer.setStyle(node, 'height', '16px');
                this.renderer.setStyle(node, 'width', '16px');
                this.renderer.setStyle(node, 'top', '0');
                this.renderer.setStyle(node, 'left', '0');
                this.renderer.setStyle(node, 'z-index', '1000');
                break;
            case 'resize-handle-n':
                this.renderer.setStyle(node, 'cursor', 'n-resize');
                this.renderer.setStyle(node, 'height', '8px');
                this.renderer.setStyle(node, 'width', '100%');
                this.renderer.setStyle(node, 'top', '-4px');
                this.renderer.setStyle(node, 'left', '0');
                this.renderer.setStyle(node, 'z-index', '1000');
                break;
            case 'resize-handle-ne':
                this.renderer.setStyle(node, 'cursor', 'ne-resize');
                this.renderer.setStyle(node, 'height', '16px');
                this.renderer.setStyle(node, 'width', '16px');
                this.renderer.setStyle(node, 'top', '0');
                this.renderer.setStyle(node, 'right', '0');
                this.renderer.setStyle(node, 'z-index', '1000');
                break;
        }

        this.element.appendChild(node);
    }

    initResize(event: MouseEvent | TouchEvent, isSouth: boolean, isEast: boolean, isSouthEast: boolean, isSouthWest: boolean, isWest: boolean, isNorthWest: boolean, isNorth: boolean, isNorthEast: boolean) {
        this.renderer.setStyle(this.element, 'user-select', 'none');

        if (isSouth) {
            this.resizingS = true;
        }
        if (isEast) {
            this.resizingE = true;
        }
        if (isSouthEast) {
            this.resizingSE = true;
        }
        if (isSouthWest) {
            this.resizingSW = true;
        }
        if (isWest) {
            this.resizingW = true;
        }
        if (isNorthWest) {
            this.resizingNW = true;
        }
        if (isNorth) {
            this.resizingN = true;
        }
        if (isNorthEast) {
            this.resizingNE = true;
        }
        this.newWidth = this.element.clientWidth;
        this.newHeight = this.element.clientHeight;
        this.newLeft = this.element.clientLeft;
        this.newTop = this.element.clientTop;
        event.stopPropagation();
        this.resizeBegin.emit();
    }

    endResize(event: MouseEvent | TouchEvent) {
        this.renderer.removeStyle(this.element, 'user-select');

        this.resizingS = false;
        this.resizingE = false;
        this.resizingSE = false;
        this.resizingSW = false;
        this.resizingW = false;
        this.resizingNW = false;
        this.resizingN = false;
        this.resizingNE = false;

        this.resizeEnd.emit({ event: this.getEvent(event), width: this.newWidth, height: this.newHeight });
    }

    resizeWidth(event: MouseEvent | Touch) {
        let maxLeftWidth = true;
        let maxRightWidth = true;

        if (this.resizeOptions.resizeInViewport) {
            maxLeftWidth = this.newLeft >= 0;
            maxRightWidth = (this.left + this.newWidth) <= window.innerWidth;
        }

        const overMinWidth = !this.minWidth || this.newWidth >= this.minWidth;
        const underMaxWidth = !this.maxWidth || this.newWidth <= this.maxWidth;

        if (this.resizingSE || this.resizingE || this.resizingNE) {
            if (overMinWidth && underMaxWidth && maxRightWidth) {
                this.renderer.setStyle(this.element, 'width', `${this.newWidth}px`);
            }
        }
        if (this.resizingSW || this.resizingW || this.resizingNW) {
            if (overMinWidth && underMaxWidth && maxLeftWidth) {
                this.renderer.setStyle(this.element, 'left', `${this.newLeft}px`);
                this.renderer.setStyle(this.element, 'width', `${this.newWidth}px`);
            }
        }
        this.resizing.emit({ event, width: this.newWidth, height: this.newHeight, direction: 'horizontal' });

    }

    resizeHeight(event: MouseEvent | Touch) {
        let maxTopHeight = true;
        let maxBottomHeight = true;

        if (this.resizeOptions.resizeInViewport) {
            maxTopHeight = this.newTop >= 0;
            maxBottomHeight = (this.top + this.newHeight) <= window.innerHeight;
        }

        const overMinHeight = !this.minHeight || this.newHeight >= this.minHeight;
        const underMaxHeight = !this.maxHeight || this.newHeight <= this.maxHeight;
        if (this.resizingSE || this.resizingS || this.resizingSW) {
            if (overMinHeight && underMaxHeight && maxBottomHeight) {
                this.renderer.setStyle(this.element, 'height', `${this.newHeight}px`);
            }
        }

        if (this.resizingNW || this.resizingN || this.resizingNE) {
            if (overMinHeight && underMaxHeight && maxTopHeight) {
                this.renderer.setStyle(this.element, 'top', `${this.newTop}px`);
                this.renderer.setStyle(this.element, 'height', `${this.newHeight}px`);
            }
        }
        this.resizing.emit({ event, width: this.newWidth, height: this.newHeight, direction: 'vertical' });
    }

    getEvent(event: MouseEvent | TouchEvent): MouseEvent | Touch {
        if (event.type === 'touchend' || event.type === 'touchcancel') {
            return (event as TouchEvent).changedTouches[0];
        }
        return event.type.startsWith('touch') ? (event as TouchEvent).targetTouches[0] : event as MouseEvent;
    }
}
