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
import { Component, Input, OnDestroy, ViewChild } from '@angular/core';

import { BehaviorSubject, Observable, Subject, Subscription } from 'rxjs/';
import { map } from 'rxjs/operators';

import { MouseEventType, XcCanvasMouseEventsOption } from '../xc-canvas/xc-canvas-helper.class';
import { XcCanvasComponent, XcCanvasController, XcCanvasObserver } from '../xc-canvas/xc-canvas.component';
import { XcCartasianCoordinateSystemController, XcPlotController } from './xc-plot-controller.class';
import { XcPlotDataSource } from './xc-plot-data-source';


@Component({
    selector: 'xc-plot',
    templateUrl: './xc-plot.component.html',
    styleUrls: ['./xc-plot.component.scss']
})
export class XcPlotComponent implements OnDestroy, XcCanvasController, XcCanvasObserver {

    private _canvasComponent: XcCanvasComponent;
    private readonly dataSourceContainerChangeSubject = new BehaviorSubject<XcPlotDataSource[]>(null);
    private readonly initializedChangeSubject = new Subject<XcPlotController>();
    private initializedSubscription: Subscription;

    stepEveryXFrame = 0;

    @ViewChild(XcCanvasComponent, {static: true})
    set canvasComponent(value: XcCanvasComponent) {
        this._canvasComponent = value;
        this.initializedSubscription = this._canvasComponent.initializedChange.subscribe(
            initialized => {
                if (initialized) {
                    this.init();
                }
            }
        );
    }

    get canvasComponent(): XcCanvasComponent {
        return this._canvasComponent;
    }

    /**
     * @deprecated - use dataSourceContainer instead
     */
    @Input()
    set dataSource(value: XcPlotDataSource) {
        this.dataSourceContainerChangeSubject.next([value]);
    }

    /**
     * @deprecated - use dataSourceContainer instead
     */
    get dataSource(): XcPlotDataSource {
        return this.dataSourceContainerChangeSubject?.value?.[0];
    }

    /**
     * @deprecated - use dataSourceContainerChange instead
     */
    get dataSourceChange(): Observable<XcPlotDataSource> {
        return this.dataSourceContainerChangeSubject.asObservable().pipe(map(container => container?.[0]));
    }

    @Input()
    set dataSourceContainer(value: XcPlotDataSource[]) {
        this.dataSourceContainerChangeSubject.next(value);
    }

    get dataSourceContainer(): XcPlotDataSource[] {
        return this.dataSourceContainerChangeSubject.value;
    }

    get dataSourceContainerChange(): Observable<XcPlotDataSource[]> {
        return this.dataSourceContainerChangeSubject.asObservable();
    }

    get c(): CanvasRenderingContext2D {
        return this._canvasComponent.context;
    }

    get width(): number {
        return this._canvasComponent.width;
    }

    get height(): number {
        return this._canvasComponent.height;
    }

    // XcPlot's initialization observable (don't confuse it with XcCanvas's)
    get initializedChange(): Observable<XcPlotController> {
        return this.initializedChangeSubject.asObservable();
    }

    controller: XcCartasianCoordinateSystemController;

    initialized: boolean;

    mouseEventsOption: XcCanvasMouseEventsOption = {
        eventsListenTo: [
            MouseEventType.mousemove,
            MouseEventType.mousedown,
            MouseEventType.mouseup,
            MouseEventType.wheel,
            MouseEventType.mouseleave
        ]
    };

    private init() {
        this.canvasComponent.resizeToParent();
        this.controller = new XcCartasianCoordinateSystemController(this.c.canvas, this.dataSourceContainerChange);
        this.canvasComponent.startLoop();

        this.initialized = true;
        this.initializedChangeSubject.next(this.controller);
    }

    ngOnDestroy() {
        this.initializedSubscription?.unsubscribe();
        this.controller.clearSubscriptions();
    }

    keyboardInput(dt: number, keyboardEvent: KeyboardEvent, keys: Set<string>) {

        if (keys.has('t')) {
            keys.delete('t');
            this.controller.changePointConnectionType();
        }

        if (keys.has('a') || keys.has('d') || keys.has('w') || keys.has('s') || keys.has('i') || keys.has('o')) {
            const d = 0.05;
            let zfx = 1;
            let zfy = 1;

            zfx += keys.has('i') ? d : 0;
            zfy += keys.has('i') ? d : 0;
            zfx -= keys.has('o') ? d : 0;
            zfy -= keys.has('o') ? d : 0;

            zfx += keys.has('d') ? d : 0;
            zfx -= keys.has('a') ? d : 0;

            zfy += keys.has('w') ? d : 0;
            zfy -= keys.has('s') ? d : 0;

            this.controller.zoom(zfx, zfy);
        }

        if (keys.has('ArrowLeft') || keys.has('ArrowRight') || keys.has('ArrowUp') || keys.has('ArrowDown')) {
            let dx = 0;
            let dy = 0;
            const d = 10;
            dx -= keys.has('ArrowRight') ? d : 0;
            dx += keys.has('ArrowLeft') ? d : 0;
            dy -= keys.has('ArrowDown') ? d : 0;
            dy += keys.has('ArrowUp') ? d : 0;
            if (dx !== 0 || dy !== 0) {
                this.controller.move(dx, dy);
            }
        }

    }

    draw(c: CanvasRenderingContext2D, dt: number) {
        c.save();
        c.clearRect(0, 0, this.width, this.height);
        this.controller.draw(c, dt);
        c.restore();
    }

    mouse(e: MouseEvent) {
        if (e.type === MouseEventType.mousemove) {
            this.controller.mousemove(e);
        }

        if (e.type === MouseEventType.mouseleave) {
            this.controller.mouseleave(e);
        }

        if (e.type === MouseEventType.mousedown) {
            this.controller.mousedown(e, this.canvasComponent);
        }

        if (e.type === MouseEventType.mouseup) {
            this.controller.mouseup(e);
        }
    }

    wheel(e: WheelEvent) {
        if (e.type === MouseEventType.wheel && e.ctrlKey) {
            this.controller.wheel(e);
            e.preventDefault();
        }
    }

    setValuePerScale(x = 1, y = x): boolean {
        if (this.initialized) {
            this.controller.setValuePerScale(x, y);
        }
        return this.initialized;
    }

    setPixelPerScale(value: number, aspect?: number): boolean {
        if (this.initialized) {
            this.controller.setPixelPerScale(value, aspect);
        }
        return this.initialized;
    }

    setScaleAspect(value: number): boolean {
        if (this.initialized) {
            this.controller.setScaleAspect(value);
        }
        return this.initialized;
    }

    fit() {
        if (this.controller) {
            this.controller.refit();
        }
    }


}
