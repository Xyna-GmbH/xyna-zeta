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
import { AfterViewInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, EventEmitter, HostBinding, HostListener, Input, NgZone, OnDestroy, Output } from '@angular/core';

import { downloadFile, MimeTypes, NOP } from '@zeta/base';

import { Observable } from 'rxjs';
import * as THREE from 'three';


export interface XcWebGLInteraction {
    mouse?: {
        x: number;
        y: number;
        down?: boolean;
        up?: boolean;
        enter?: boolean;
        leave?: boolean;
        click?: boolean;
        dblclick?: boolean;
        altKey?: boolean;
        ctrlKey?: boolean;
        shiftKey?: boolean;
    };
}


@Component({
    selector: 'xc-webgl',
    templateUrl: './xc-webgl.component.html',
    styleUrls: ['./xc-webgl.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class XcWebGLComponent implements AfterViewInit, OnDestroy {

    private _animationId: number;
    private _frames = 0;
    private _fps = 0;
    private _dt = 0;

    private _renderer: THREE.WebGLRenderer;
    private _width: number;
    private _height: number;

    @Input('xc-webgl-init')
    init = () => {};

    @Input('xc-webgl-destroy')
    destroy = () => {};

    @Output('xc-webgl-resize')
    private readonly resizeEmitter = new EventEmitter<void>();

    @Output('xc-webgl-interaction')
    private readonly interactionEmitter = new EventEmitter<XcWebGLInteraction>();


    constructor(private readonly cdRef: ChangeDetectorRef, private readonly elementRef: ElementRef<HTMLElement>, private readonly zone: NgZone) {
        /** @todo use injection tokens to customize renderer options */
    }


    ngAfterViewInit() {
        this._renderer = new THREE.WebGLRenderer({
            alpha: true,
            antialias: true,
            preserveDrawingBuffer: true
        });

        this.renderer.autoClear = false;
        this.renderer.setPixelRatio(devicePixelRatio);
        this.renderer.setClearColor(new THREE.Color(0), 1);

        this.elementRef.nativeElement.appendChild(this.renderer.domElement);
        this.init();
        this.updateSize();
    }


    ngOnDestroy() {
        this.destroy();
        this.elementRef.nativeElement.removeChild(this.renderer.domElement);
        this.renderer.forceContextLoss();
        this.renderer.dispose();
    }


    private getMouseInteraction(event: MouseEvent, callback?: (interaction: XcWebGLInteraction) => void): XcWebGLInteraction {
        event.preventDefault();
        const rect = (this.elementRef.nativeElement as Element).getBoundingClientRect();
        const interaction = {
            mouse: {
                x: Math.trunc(Math.min(Math.max(event.clientX - rect.left + 1, 1), rect.width)),
                y: Math.trunc(Math.min(Math.max(this.height - (event.clientY - Math.trunc(rect.top)), 1), rect.height)),
                altKey: event.altKey,
                ctrlKey: event.ctrlKey,
                shiftKey: event.shiftKey
            }
        };
        if (callback) {
            callback(interaction);
        }
        return interaction;
    }


    @HostBinding('attr.fps')
    get fps(): number {
        return this._fps;
    }


    get dt(): number {
        return this._dt;
    }


    get renderer(): THREE.WebGLRenderer {
        return this._renderer;
    }


    get width(): number {
        return this._width;
    }


    get height(): number {
        return this._height;
    }


    get resize(): Observable<void> {
        return this.resizeEmitter.asObservable();
    }


    get interaction(): Observable<XcWebGLInteraction> {
        return this.interactionEmitter.asObservable();
    }


    updateSize() {
        this.renderer.setSize(320, 240);
        const resize = () => {
            this._width = this.elementRef.nativeElement.clientWidth;
            this._height = this.elementRef.nativeElement.clientHeight;
            this.renderer.setSize(this.width, this.height);
            this.resizeEmitter.next();
        };
        requestAnimationFrame(resize);
    }


    @HostListener('mousemove', ['$event'])
    mouseMove(event: MouseEvent) {
        this.interactionEmitter.emit(this.getMouseInteraction(event));
    }


    @HostListener('mousedown', ['$event'])
    mouseDown(event: MouseEvent) {
        this.interactionEmitter.emit(this.getMouseInteraction(event, i => i.mouse.down = true));
    }


    @HostListener('mouseup', ['$event'])
    mouseUp(event: MouseEvent) {
        this.interactionEmitter.emit(this.getMouseInteraction(event, i => i.mouse.up = true));
    }


    @HostListener('mouseenter', ['$event'])
    mouseEnter(event: MouseEvent) {
        this.interactionEmitter.emit(this.getMouseInteraction(event, i => i.mouse.enter = true));
    }


    @HostListener('mouseleave', ['$event'])
    mouseLeave(event: MouseEvent) {
        this.interactionEmitter.emit(this.getMouseInteraction(event, i => i.mouse.leave = true));
    }


    @HostListener('click', ['$event'])
    click(event: MouseEvent) {
        this.interactionEmitter.emit(this.getMouseInteraction(event, i => i.mouse.click = true));
    }


    @HostListener('dblclick', ['$event'])
    dblclick(event: MouseEvent) {
        this.interactionEmitter.emit(this.getMouseInteraction(event, i => i.mouse.dblclick = true));
    }


    startRenderLoop(advance: (dt: number) => void = NOP) {
        this.stopRenderLoop();

        let t0 = performance.now();
        let t1 = t0;
        let loop: () => void;
        (loop = () => {
            this.zone.runOutsideAngular(() => {

                advance(this._dt = performance.now() - t1);

                t1 = performance.now();
                if (t1 - t0 > 1000) {
                    t0 += 1000;
                    this._fps = this._frames;
                    this._frames = 0;
                    this.zone.run(() => this.cdRef.markForCheck());
                }
                this._frames++;

                this._animationId = requestAnimationFrame(loop);
            });
        })();
    }


    stopRenderLoop() {
        if (this._animationId) {
            cancelAnimationFrame(this._animationId);
        }
    }


    downloadFrame(filename: string) {
        this.renderer.domElement.toBlob(
            blob => downloadFile(blob, filename, MimeTypes.png),
            MimeTypes.png,
            1.0
        );
    }
}
