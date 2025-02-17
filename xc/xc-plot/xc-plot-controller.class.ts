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
import { Observable } from 'rxjs';

import { XcCanvasComponent } from '../';
import { getMouseButton, MouseButton } from '../xc-canvas/xc-canvas-helper.class';
import { OrientationSide, Unit, XcCoord, XcDot, XcPlotPointConnection, XcPlottableArea } from './sub-classes/basics';
import { XcCanvasCartasianCoordinateSystemArea, XcCanvasPlotArea } from './xc-canvas-area.classes';
import { XcPlotDataPair, XcPlotDataSource } from './xc-plot-data-source';


export class XcPlotController {

    protected dataSourceRef: XcPlotDataSource;
    protected dataSourceContainerRef: XcPlotDataSource[];
    protected currentDataSourceIndex = 0;

    // used to detect points the ser hovers over
    protected oldMousePosition = { x: 0, y: 0 };

    plottableArea: XcPlottableArea;
    plotAreas: XcCanvasPlotArea[] = [];

    // control states influenced by the user
    dragging = false;
    zooming = false;

    constructor(protected canvas: HTMLCanvasElement, protected dataSourceContainerChange: Observable<XcPlotDataSource[]>) {
        this.plottableArea = this.canvas;
        this.dataSourceContainerChange.subscribe(dsc => {
            this.dataSourceRef = dsc?.[0];
            this.dataSourceContainerRef = dsc;
        });
    }

    protected addAreas(...pa: XcCanvasPlotArea[]) {
        this.plotAreas.push(...pa);
        this.plotAreas.forEach(a => {
            a.updateCalculations(this.plottableArea);
        });
    }

}

export class XcCartasianCoordinateSystemController extends XcPlotController {

    private static readonly X_AXIS_AREA_SIZE = 50;
    private static readonly Y_AXIS_AREA_SIZE = 50;

    ccsArea: XcCanvasCartasianCoordinateSystemArea;

    private selectedPointImage: HTMLImageElement;
    private hoverPointImage: HTMLImageElement;

    constructor(canvas: HTMLCanvasElement, dataSourceContainerChange: Observable<XcPlotDataSource[]>) {
        super(canvas, dataSourceContainerChange);

        this.ccsArea = new XcCanvasCartasianCoordinateSystemArea(
            new XcDot(
                new XcCoord(XcCartasianCoordinateSystemController.Y_AXIS_AREA_SIZE, Unit.Absolute, OrientationSide.Start),
                new XcCoord(0, Unit.Absolute, OrientationSide.Start)
            ),
            new XcDot(
                new XcCoord(100, Unit.Relative, OrientationSide.Start),
                new XcCoord(XcCartasianCoordinateSystemController.X_AXIS_AREA_SIZE, Unit.Absolute, OrientationSide.End)
            ),
            this.plottableArea,
            dataSourceContainerChange
        );

        this.addAreas(this.ccsArea);

    }

    clearSubscriptions() {
        this.plotAreas.forEach(a => {
            a.clearSubscriptions();
        });
    }

    zoom(xFactor = 1.1, yFactory = 1.1) {
        this.ccsArea.zoom(xFactor, yFactory);
    }

    move(dx: number, dy: number) {
        this.ccsArea.move(dx, dy);
    }

    mousemove(e: MouseEvent) {
        if (!this.dragging && !this.zooming) {
            this.ccsArea.updateOwnMouseInfo(e);

            if (this.ccsArea.mouseOver) {
                const mx = e.offsetX;
                const my = e.offsetY;

                if (this.oldMousePosition.x !== mx || this.oldMousePosition.y !== my) {
                    this.oldMousePosition.x = mx;
                    this.oldMousePosition.y = my;

                    let numberOfPointsCursorHoveredOver = 0;

                    this.dataSourceContainerRef?.forEach(ds => {

                        const hitCubeSize = ds?.localPointsStyling?.hitboxSize ?? ds.styleHelper.CCS.points.hitboxSize;

                        ds.pairs.forEach(p => {
                            const isHit = p.isPointHit(mx, my, hitCubeSize);
                            const already = ds.hoverModel.isSelected(p);
                            if (isHit && !already) {
                                ds.hoverModel.select(p);
                                // this.hoverPointImage = this.createPopupImageOfPoint(p, 'white');
                                this.createPopupImageOfPoint(p, ds, 'white').then(img => this.hoverPointImage = img, () => this.hoverPointImage = null);
                            }
                            if (!isHit && already) {
                                ds.hoverModel.deselect(p);
                            }
                        });

                        numberOfPointsCursorHoveredOver += ds.hoverModel.selection.length;

                    });

                    if (numberOfPointsCursorHoveredOver <= 0) {
                        this.hoverPointImage = null;
                    }

                }

            } else {
                this.dataSourceContainerRef?.forEach(ds => ds.hoverModel.clear());
            }

        } else {
            const dx = e.movementX;
            const dy = e.movementY;

            if (this.dragging) {
                this.ccsArea.move(dx, dy);
            }

            if (this.zooming) {
                const limiter = 3;
                const ldx = dx < limiter * (-1) || dx > limiter ? dx : 0;
                const ldy = dy < limiter * (-1) || dy > limiter ? dy : 0;

                this.zoom(1 + ldx / 20, 1 + ldy / 20);
            }
        }
    }

    mouseleave(e: MouseEvent) {
        this.ccsArea.mouseleave(e);
    }

    mousedown(e: MouseEvent, canvasComponent: XcCanvasComponent) {

        if (this.ccsArea.mouseOver && getMouseButton(e) === MouseButton.Secondary) {

            const pointerLock = canvasComponent.eventToPointerLock(e);
            pointerLock.whenLocked.subscribe(
                () => {
                    if (!e.ctrlKey) {
                        this.dragging = true;
                    }

                    if (e.ctrlKey) {
                        this.zooming = true;
                    }
                }
            );
            pointerLock.whenUnlocked.subscribe(
                () => {
                    this.dragging = false;
                    this.zooming = false;
                }
            );
        }

        const mx = e.offsetX;
        const my = e.offsetY;

        if (this.ccsArea.mouseOver && getMouseButton(e) === MouseButton.Main) {

            let numberOfPointsThatAreSelected = 0;

            this.dataSourceContainerRef.forEach(ds => {

                if (!e.ctrlKey || !ds.allowMultiSelect) {
                    ds.selectionModel.clear();
                }

                // only the points, over which the cursor hovers, can be selected -> ergo: they need to be in the hoverModel
                if (ds.hoverModel.selection.length) {
                    ds.hoverModel.selection.forEach(p => {
                        const hitCubeSize = ds.localPointsStyling?.hitboxSize ?? ds.styleHelper.CCS.points.hitboxSize;
                        const isHit = p.isPointHit(mx, my, hitCubeSize);
                        if (isHit) {
                            ds.selectionModel.select(p);
                            // this.selectedPointImage = this.createPopupImageOfPoint(p);
                            this.createPopupImageOfPoint(p, ds).then(img => this.selectedPointImage = img, () => this.selectedPointImage = null);
                        }
                    });
                }

                numberOfPointsThatAreSelected += ds.selectionModel.selection.length;

            });

            if (numberOfPointsThatAreSelected <= 0) {
                this.selectedPointImage = null;
            }

        }
    }

    private createPopupImageOfPoint(p: XcPlotDataPair, ds?: XcPlotDataSource, backgroundColor = '#ffe8a4'): Promise<HTMLImageElement> {

        const border = {
            width: 2,
            color: '#000'
        };

        const font = {
            height: 14,
            family: 'Arial',
            color: '#000',
            padding: 8,
            vertLineSpace: 6
        };

        const info = ds?.plotDataInfo || this.dataSourceRef.plotDataInfo;
        const xLabel = info.xUnitLabel + (info.xUnit ? ` (${info.xUnit})` : '');
        const yLabel = info.yUnitLabel + (info.yUnit ? ` (${info.yUnit})` : '');
        const lines = [
            `${xLabel} : ${this.dataSourceRef.xValueTransformationFunction(p.x)}`,
            `${yLabel} : ${this.dataSourceRef.yValueTransformationFunction(p.y)}`
        ];

        // offscreen canvas created
        const canvas = document.createElement('canvas');
        const c = canvas.getContext('2d');
        // save context state
        c.save();
        c.font = `${font.height}px ${font.family}`;

        // now that font and the text of the lines are defined => recalculationg width and height
        const lineLengths = lines.map<number>(l => c.measureText(l).width);
        const width = (2 * font.padding) + Math.max(...lineLengths);
        const height = Math.max(60, ((lines.length - 1) * font.vertLineSpace + (2 * font.padding) + (2 * font.height)));

        canvas.width = width;
        canvas.height = height;

        c.font = `${font.height}px ${font.family}`;

        c.clearRect(0, 0, width, height);

        // draw background
        c.fillStyle = backgroundColor;
        c.fillRect(0, 0, width, height);

        // draw border
        c.strokeStyle = border.color;
        c.lineWidth = border.width;
        const borderDiff = border.width / 2;
        c.strokeRect(0 + borderDiff, 0 + borderDiff, width - (2 * borderDiff), height - (2 * borderDiff));

        c.fillStyle = font.color;

        // const x = (width / 2);
        // c.textAlign = 'center';
        const x = borderDiff + font.padding;
        c.textAlign = 'left';
        c.textBaseline = 'middle';

        // calculating text lengths
        lines.forEach((line, i) => {

            const y = (height / (lines.length + 1)) * (i + 1);
            c.fillText(line, x, y, (width - borderDiff));

        });

        return new Promise<HTMLImageElement>((resolve, reject) => {
            // create HTMLImageElement
            const img = document.createElement('img');
            img.width = width;
            img.height = height;
            img.onload = () => resolve(img);
            img.onerror = e => reject(e);
            img.src = canvas.toDataURL();
        });
    }

    mouseup() {
        // this.ccsArea.mouseleave(e);
        document.exitPointerLock();
    }


    wheel(e: WheelEvent) {
        const fy = e.deltaY / 1000 * (-1);
        this.ccsArea.zoom(1 + fy, 1 + fy);
    }

    draw(c: CanvasRenderingContext2D, dt: number) {
        c.save();
        c.fillStyle = this.dataSourceRef.styleHelper.PLOT.backgroundColor;
        c.fillRect(this.plottableArea.x, this.plottableArea.y, this.plottableArea.width, this.plottableArea.height);
        c.restore();

        this.plotAreas.forEach(pa => pa.draw(c, dt));

        // Drawing popup images
        if (this.dataSourceRef.showGeneratedPopup) {
            const a = this.plottableArea;
            const s = this.selectedPointImage;
            const h = this.hoverPointImage;

            if (s && !h || !s && h) {
                const img = s || h;
                c.drawImage(img, (a.width / 2) - img.width / 2, 10);
            }

            if (s && h) {
                const len = s.width + 10 + h.width;
                if (len > c.canvas.width) {
                    // drawing vertically
                    c.drawImage(s, (a.width / 2) - s.width / 2, 10);
                    c.drawImage(h, (a.width / 2) - s.width / 2, 20 + s.height);
                } else {
                    // drawing horizontally
                    c.drawImage(s, (a.width / 2) - len / 2, 10);
                    c.drawImage(h, ((a.width / 2) - len / 2) + 10 + s.width, 10);
                }
            }
        }

        c.restore();
    }

    changePointConnectionType(to?: XcPlotPointConnection) {
        const ds = this.dataSourceContainerRef?.[this.currentDataSourceIndex];
        ds.changePointConnectionType(to);
    }

    setAxisAreaSize(axis: 'x' | 'y', size: number) {
        if (axis === 'x') {
            this.ccsArea.d2.y = new XcCoord(size, Unit.Absolute, OrientationSide.End);
        } else {
            this.ccsArea.d1.x = new XcCoord(size, Unit.Absolute, OrientationSide.Start);
        }
        this.ccsArea.updateCalculations(this.plottableArea);

        this.ccsArea.ccs.x = this.ccsArea.canvasOffsetX;
        this.ccsArea.ccs.y = this.ccsArea.canvasOffsetY;
        this.ccsArea.ccs.width = this.ccsArea.bottomRightPoint.x - this.ccsArea.canvasOffsetX;
        this.ccsArea.ccs.height = this.ccsArea.bottomRightPoint.y - this.ccsArea.canvasOffsetY;
    }

    setValuePerScale(x = 1, y = x) {
        this.ccsArea.setValuePerScale(x, y);
    }

    setScaleAspect(value: number) {
        this.ccsArea.setScaleAspect(value);
    }

    setPixelPerScale(value: number, aspect?: number) {
        if (aspect) {
            this.setScaleAspect(aspect);
        }
        this.ccsArea.setPixelPerScale(value);
    }

    refit() {
        this.plottableArea = { x: 0, y: 0, width: this.canvas.width, height: this.canvas.height };
        this.plotAreas.forEach(a => a.updateCalculations(this.plottableArea));
        this.ccsArea.updatePoints();
    }

}
