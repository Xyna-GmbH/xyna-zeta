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
import { Observable, Subscription } from 'rxjs/';

import { XcCanvasHelper } from '../xc-canvas/xc-canvas-helper.class';
import { CartasianCoordinateSystem } from './classes/cartasian-coordinate-system.class';
import { CommonBorder, OrientationSide, Unit, XcCoord, XcDot, XcPlottableArea } from './sub-classes/basics';
import { XcPlotDataChangeBehavior, XcPlotDataSource } from './xc-plot-data-source';


export class XcCanvasArea {

    protected _maxX = 0;
    protected _maxY = 0;
    protected _minX = 0;
    protected _minY = 0;

    protected subscriptions = new Subscription();

    private _plottableArea: XcPlottableArea;
    get plottableArea(): XcPlottableArea {
        return this._plottableArea;
    }
    set plottableArea(value: XcPlottableArea) {
        this._plottableArea = value;
        this.updateCalculations(value);
    }

    get aspect(): number {
        return this._plottableArea ? (this._plottableArea.width / this._plottableArea.height) : 1;
    }

    protected calculatedPoints: {x: number; y: number}[] = [];
    dots: XcDot[] = [];

    constructor(...dots: XcDot[]) {
        this.dots = dots;
    }

    updateCalculations(rect?: XcPlottableArea): this {
        if (rect) {
            this._plottableArea = rect;
        }
        this._maxX = -Infinity;
        this._maxY = -Infinity;
        this._minX = Infinity;
        this._minY = Infinity;
        this.dots.forEach((d, i) => {
            this.calculatedPoints[i] = d.calc(rect);
            this._maxX = Math.max(this._maxX, this.calculatedPoints[i].x);
            this._maxY = Math.max(this._maxY, this.calculatedPoints[i].y);
            this._minX = Math.min(this._minX, this.calculatedPoints[i].x);
            this._minY = Math.min(this._minY, this.calculatedPoints[i].y);
        });
        return this;
    }

    createAreaPath(c: CanvasRenderingContext2D) {
        let cap = this.calculatedPoints[0];
        c.beginPath();
        c.moveTo(cap.x, cap.y);
        for (let i = 1; i < this.calculatedPoints.length; i++) {
            cap = this.calculatedPoints[i];
            c.lineTo(cap.x, cap.y);
        }
    }

    clip(c: CanvasRenderingContext2D) {
        c.beginPath();
        // nothing beyond this two commands will cause the canvas to draw over the coord-sys
        this.createAreaPath(c);
        c.closePath();
        c.clip();
    }

    drawClipped(c: CanvasRenderingContext2D, drawFunc: (...args: any[]) => void, ...args: any[]) {
        this.clip(c);
        drawFunc(...args);
    }

    laysPointWithin(x: number, y: number): boolean {
        if (this.calculatedPoints && this.calculatedPoints.length > 2) {
            const ca = document.createElement('canvas');
            ca.width = this._maxX;
            ca.height = this._maxY;
            const co = ca.getContext('2d');

            this.createAreaPath(co);
            co.closePath();
            return co.isPointInPath(x, y);
        }
        return false;
    }

    draw(c: CanvasRenderingContext2D, dt: number) {}

    clearSubscriptions() {
        this.subscriptions?.unsubscribe();
        this.subscriptions = new Subscription();
    }

}

export class XcCanvasRectangleArea extends XcCanvasArea {

    protected _mouseOver: boolean;

    ownMousePosition = {x: 0, y: 0};

    get mouseOver(): boolean {
        return this._mouseOver;
    }

    get width(): number {
        return this.calculatedPoints && this.calculatedPoints.length === 4
            ? this.topRightPoint.x - this.canvasOffsetX
            : 0;
    }

    get height(): number {
        return this.calculatedPoints && this.calculatedPoints.length === 4
            ? this.bottomRightPoint.y - this.topRightPoint.y
            : 0;
    }

    get topLeftPoint(): {x: number; y: number} {
        return this.calculatedPoints[0];
    }

    get canvasOffsetX(): number {
        return this.topLeftPoint.x;
    }

    get canvasOffsetY(): number {
        return this.topLeftPoint.y;
    }

    get topRightPoint(): {x: number; y: number} {
        return this.calculatedPoints[1];
    }

    get bottomRightPoint(): {x: number; y: number} {
        return this.calculatedPoints[2];
    }

    get bottomLeftPoint(): {x: number; y: number} {
        return this.calculatedPoints[3];
    }

    /**
     * @param d1 - upper left dot
     * @param d2 - lower right dot
     */
    constructor(d1: XcDot, d2: XcDot) {
        super(d1, new XcDot(d2.x, d1.y), d2, new XcDot(d1.x, d2.y));
    }

    updateOwnMouseInfo(e: MouseEvent) {
        const mousePositionOnCanvasX = e.offsetX;
        const mousePositionOnCanvasY = e.offsetY;
        // own position
        this.ownMousePosition.x = mousePositionOnCanvasX - this.canvasOffsetX;
        this.ownMousePosition.y = mousePositionOnCanvasY - this.canvasOffsetY;

        this._mouseOver = this.laysPointWithin(mousePositionOnCanvasX, mousePositionOnCanvasY);
    }

    mouseleave(e: MouseEvent) {
        this.ownMousePosition.x = -1;
        this.ownMousePosition.y = -1;

        this._mouseOver = false;
    }

}

export class XcCanvasPlotArea extends XcCanvasRectangleArea {

    _dataSourceRef: XcPlotDataSource;

    constructor(public d1: XcDot, public d2: XcDot, protected dataSourceContainerRefChange: Observable<XcPlotDataSource[]>) {
        super(d1, d2);
    }

}

export class XcCanvasCartasianCoordinateSystemArea extends XcCanvasPlotArea {

    // Comfortable Pixel Per Scale On X Axis = ComfPPS_X
    private readonly comfPPS_X = {
        min: 80,
        default: 150,
        max: 250
    };

    private scaleAspect = 1;

    private get comfPPS_Y(): {min: number; default: number; max: number} {
        return {
            min: this.comfPPS_X.min / this.scaleAspect,
            default: this.comfPPS_X.default / this.scaleAspect,
            max: this.comfPPS_X.max / this.scaleAspect
        };
    }

    private xAxisRange = {min: 0, max: 0};
    private yAxisRange = {min: 0, max: 0};

    ccs: CartasianCoordinateSystem;
    offsideScaleMarkRenderingX = CommonBorder.Bottom;
    offsideScaleMarkRenderingY = CommonBorder.Left;

    get dataSourceRef(): XcPlotDataSource {
        return this._dataSourceRef;
    }

    set dataSourceRef(value: XcPlotDataSource) {
        this._dataSourceRef = value;
        if (value) {
            this.updatePoints();
        }
    }

    dataChangeSubscription: Subscription;
    pointConnectionTypeChangeSubscription: Subscription;

    get scaleMarkValueMapX(): Map<number, number> {
        return this.ccs.scaleMarkValueMapX;
    }

    get scaleMarkValueMapY(): Map<number, number> {
        return this.ccs.scaleMarkValueMapY;
    }

    constructor(
        public d1: XcDot,
        public d2: XcDot,
        rect: XcPlottableArea,
        dataSourceContainerRefChange: Observable<XcPlotDataSource[]>
    ) {
        super(d1, d2, dataSourceContainerRefChange);
        this.updateCalculations(rect);

        this.ccs = new CartasianCoordinateSystem(
            dataSourceContainerRefChange,
            this.canvasOffsetX,
            this.canvasOffsetY,
            this.bottomRightPoint.x - this.canvasOffsetX,
            this.bottomRightPoint.y - this.canvasOffsetY
        );
        this.ccs.borderThickness = 0;

        this.subscriptions.add(

            dataSourceContainerRefChange.subscribe(refs => {

                this.dataChangeSubscription?.unsubscribe();
                this.pointConnectionTypeChangeSubscription?.unsubscribe();
                this.dataChangeSubscription = new Subscription();
                this.pointConnectionTypeChangeSubscription = new Subscription();

                const fallbackDataSource = refs?.[0];
                this.dataSourceRef = fallbackDataSource;

                refs.forEach((ds, i) => {
                    const dataChangeSub = ds.dataChange.subscribe(data => {
                        switch (ds.dataChangeBehavior) {
                            case XcPlotDataChangeBehavior.OptimizeViewport: {
                                const extrema = ds.getLocalExtrema();
                                this.optimizeView(extrema.xMin, extrema.xMax, extrema.yMin, extrema.yMax);
                            } break;
                            case XcPlotDataChangeBehavior.ResetToPlotInfo: {
                                // minx?: number, maxx?: number, miny?: number, maxy?: number
                                const info = ds?.plotDataInfo || fallbackDataSource?.plotDataInfo;
                                this.optimizeView(info?.xMin, info?.xMax, info?.yMin, info?.yMax);
                            } break;
                        }
                        this.updatePoints();
                    });
                    this.dataChangeSubscription.add(dataChangeSub);
                    const conTypeChangeSub = ds.pointConnectionTypeChange.subscribe(_ => this.updatePoints());
                    this.pointConnectionTypeChangeSubscription.add(conTypeChangeSub);
                });
            })
        );

    }

    clearSubscriptions() {
        super.clearSubscriptions();
        this.dataChangeSubscription?.unsubscribe();
        this.pointConnectionTypeChangeSubscription?.unsubscribe();
    }

    draw(c: CanvasRenderingContext2D, dt: number) {
        if (this.dataSourceRef) {

            const info = this.dataSourceRef.plotDataInfo;

            // drawing of the CartasianCoordinateSystem
            this.ccs.draw(c, dt);

            // offside scale marks drawing
            const markLength = this.dataSourceRef.styleHelper.CCS.offside.scales.mark.length;

            let y: number;
            let x: number;

            // TODO: write offSide drawing for CommonBorder.Top
            // and
            // TODO: write offSide drawing for CommonBorder.Right

            if (this.offsideScaleMarkRenderingX === CommonBorder.Bottom) {
                c.save();
                this.ccs.clipOffSystem(c, this.offsideScaleMarkRenderingX, this.canvasOffsetX);

                y = this.bottomRightPoint.y;

                c.strokeStyle = this.dataSourceRef.styleHelper.CCS.offside.scales.color;
                c.lineWidth = 2; // half of the line is clipped so the axis is only 1px wide

                c.beginPath();
                c.moveTo(this.bottomLeftPoint.x, y);
                c.lineTo(this.bottomRightPoint.x, y);
                c.stroke();

                // draw all offside x axis scale marks and its values
                c.strokeStyle = this.dataSourceRef.styleHelper.CCS.offside.scales.mark.color;

                this.ccs.scaleMarkValueMapX.forEach((value, scaleMarkX) => {
                    c.beginPath();
                    c.moveTo(scaleMarkX, y);
                    c.lineTo(scaleMarkX, y + markLength);
                    c.stroke();

                    const str = this.dataSourceRef.xValueTransformationFunction(value);

                    c.textBaseline = 'top';
                    c.fillStyle = this.dataSourceRef.styleHelper.CCS.offside.scales.mark.fontColor;
                    c.fillText(str, scaleMarkX + 10, y + 5);
                });

                // draw the unit label
                const fontSize = this.dataSourceRef.styleHelper.CCS.offside.label.fontSize;
                XcCanvasHelper.setFontSize(c, fontSize);
                const label = info.xUnitLabel ? (info.xUnitLabel + (info.xUnit ? ` (${info.xUnit})` : '')) : '';
                const w = c.measureText(label).width;
                const padding = this.dataSourceRef.styleHelper.CCS.offside.label.padding;

                const rectx = c.canvas.width - w - padding * 2 - 5;
                const recty = c.canvas.height - fontSize - padding * 2 - 5;

                c.strokeStyle = this.dataSourceRef.styleHelper.CCS.offside.label.borderColor;
                c.lineWidth = this.dataSourceRef.styleHelper.CCS.offside.label.borderThickness;
                c.fillStyle = this.dataSourceRef.styleHelper.CCS.offside.label.backgroundColor;

                c.fillRect(rectx, recty, w + padding * 2, fontSize + padding * 2);
                c.strokeRect(rectx, recty, w + padding * 2, fontSize + padding * 2);

                c.textBaseline = 'top';
                c.fillStyle = this.dataSourceRef.styleHelper.CCS.offside.label.fontColor;
                c.fillText(label, rectx + padding, recty + padding);

                c.restore();
            }

            if (this.offsideScaleMarkRenderingY === CommonBorder.Left) {
                c.save();
                const scaleMarkValuePaddingRight = 8;
                const offsideSize = this.topLeftPoint.x; // 70 by default

                //#region - the code in the following region is needed to detect if the
                // Y Label Box overlapps with the Y scale mark values
                // calculate how much is needed from the scale mark values
                let scaleMarkValueMaxLength = 0;
                this.ccs.scaleMarkValueMapY.forEach(value => {
                    const str = this.dataSourceRef.yValueTransformationFunction(value);
                    const strWidth = c.measureText(str).width + scaleMarkValuePaddingRight;
                    scaleMarkValueMaxLength = Math.max(scaleMarkValueMaxLength, strWidth);
                });
                // calculate the rectangle height of the label box (its height, because it is turned by 90 degrees)
                const labelBoxHeight = this.dataSourceRef.styleHelper.CCS.offside.label.fontSize + 2 * this.dataSourceRef.styleHelper.CCS.offside.label.padding;

                const comfortableCombinedSize = scaleMarkValueMaxLength + labelBoxHeight + 5;

                if (offsideSize < comfortableCombinedSize) {
                    // it needs to be increased
                    // code taken from XcCartasianCoordinateSystemController.setAxisAreaSize('y', size)
                    this.d1.x = new XcCoord(comfortableCombinedSize, Unit.Absolute, OrientationSide.Start);
                    this.updateCalculations(this.plottableArea);

                    this.ccs.x = this.canvasOffsetX;
                    this.ccs.y = this.canvasOffsetY;
                    this.ccs.width = this.bottomRightPoint.x - this.canvasOffsetX;
                    this.ccs.height = this.bottomRightPoint.y - this.canvasOffsetY;
                    this.updatePoints();
                }
                //#endregion

                this.ccs.clipOffSystem(c, this.offsideScaleMarkRenderingY, offsideSize);

                x = this.canvasOffsetX;

                c.strokeStyle = this.dataSourceRef.styleHelper.CCS.offside.scales.color;
                c.lineWidth = 2; // half of the line is clipped so the axis is only 1px wide

                c.beginPath();
                c.moveTo(x, this.canvasOffsetY);
                c.lineTo(x, this.bottomLeftPoint.y);
                c.stroke();

                // draw all offside y axis scale marks and its values
                c.strokeStyle = this.dataSourceRef.styleHelper.CCS.offside.scales.mark.color;

                this.ccs.scaleMarkValueMapY.forEach((value, scaleMarkY) => {
                    c.beginPath();
                    c.moveTo(x, scaleMarkY);
                    c.lineTo(x - markLength, scaleMarkY);
                    c.stroke();

                    const str = this.dataSourceRef.yValueTransformationFunction(value);
                    const strWidth = c.measureText(str).width;

                    c.textBaseline = 'top';
                    c.fillStyle = this.dataSourceRef.styleHelper.CCS.offside.scales.mark.fontColor;
                    c.fillText(str, x - scaleMarkValuePaddingRight - strWidth, scaleMarkY + 5);
                });

                // draw the unit label
                XcCanvasHelper.setFontSize(c, this.dataSourceRef.styleHelper.CCS.offside.label.fontSize);
                const label = info.yUnitLabel ? (info.yUnitLabel + (info.yUnit ? ` (${info.yUnit})` : '')) : '';
                const w = c.measureText(label).width;

                const padding = this.dataSourceRef.styleHelper.CCS.offside.label.padding;

                // const rect_cx = this.canvasOffsetX - 45;
                const rectw = w + padding * 2;
                const recth = this.dataSourceRef.styleHelper.CCS.offside.label.fontSize + 2 * padding;

                const rect_cx = recth / 2 + 5;
                const rect_cy = rectw / 2 + 5;

                const rad = (-90) * Math.PI / 180;
                c.translate(rect_cx, rect_cy);
                c.rotate(rad);

                // XcCanvasHelper.strokeCircle(c, 0, 0, 5, true);


                c.strokeStyle = this.dataSourceRef.styleHelper.CCS.offside.label.borderColor;
                c.lineWidth = this.dataSourceRef.styleHelper.CCS.offside.label.borderThickness;
                c.fillStyle = this.dataSourceRef.styleHelper.CCS.offside.label.backgroundColor;

                c.fillRect(0 - rectw / 2, 0 - recth / 2, rectw, recth);
                c.strokeRect(0 - rectw / 2, 0 - recth / 2, rectw, recth);

                c.textAlign = 'center';
                c.textBaseline = 'middle';

                c.fillStyle = this.dataSourceRef.styleHelper.CCS.offside.label.fontColor;
                c.fillText(label, 0, 0);

                c.restore();
            }
        }
    }

    updateCalculations(rect?: XcPlottableArea): this {
        super.updateCalculations(rect);
        if (this.ccs) {
            this.ccs.x = this.canvasOffsetX;
            this.ccs.y = this.canvasOffsetY;
            this.ccs.width = this.bottomRightPoint.x - this.canvasOffsetX;
            this.ccs.height = this.bottomRightPoint.y - this.canvasOffsetY;
        }
        return this;
    }

    updatePoints() {
        if (this.dataSourceRef) {
            this.ccs.updatePoints();
        }
    }


    optimizeView(minx?: number, maxx?: number, miny?: number, maxy?: number) {

        // const bundle = this.plotDataBundle;
        // const info = bundle.infos[0];

        minx = typeof minx === 'number' ? minx : this.xAxisRange.min;
        maxx = typeof maxx === 'number' ? maxx : this.xAxisRange.max;
        miny = typeof miny === 'number' ? miny : this.yAxisRange.min;
        maxy = typeof maxy === 'number' ? maxy : this.yAxisRange.max;

        this.ccs.pixelPerScaleX = this.comfPPS_X.default; // (px / scale)
        this.ccs.pixelPerScaleY = this.comfPPS_Y.default; // (px / scale)

        // find optimized View if the following conditions are met
        if (minx < maxx && this.width > 0) {
            this.ccs.valuePerScaleX = this.findComfortableValuePerScale(minx, maxx, this.comfPPS_X.default, this.width);
        }

        // find optimized View if the following conditions are met
        if (miny < maxy && this.height > 0) {
            this.ccs.valuePerScaleY = this.findComfortableValuePerScale(miny, maxy, this.comfPPS_Y.default, this.height);
        }

        this.ccs.nullpoint.x = -(minx / this.ccs.valuePerPixelX);
        this.ccs.nullpoint.y = (this.height + (miny / this.ccs.valuePerPixelY));
    }

    // centerView() {

    //     // TODO
    //     if (this.dataSourceRef) {
    //         const info = this.dataSourceRef.plotDataInfo;
    //         if (info) {
    //             const localExtrema = this.dataSourceRef.getLocalExtrema();

    //             const graph = {
    //                 minx: -(localExtrema.xMin / this.ccs.valuePerPixelX),
    //                 maxx: -(localExtrema.xMax / this.ccs.valuePerPixelX),
    //                 miny: (this.height + (localExtrema.yMin / this.ccs.valuePerPixelY)),
    //                 maxy: (this.height + (localExtrema.yMax / this.ccs.valuePerPixelY))
    //             };

    //             const deltaX = (graph.maxx - graph.minx);
    //             const deltaY = (graph.maxy - graph.miny);

    //             const offset = {
    //                 x: (this.width) / 2 - deltaX / 2,
    //                 y: (this.height) / 2 - deltaY / 2
    //             };

    //             this.ccs.nullpoint.x = graph.minx + offset.x;
    //             this.ccs.nullpoint.y = graph.miny - offset.y;

    //             this.updatePoints();

    //         }
    //     }
    // }

    resetAxisRange() {
        this.xAxisRange = {min: 0, max: 0};
        this.yAxisRange = {min: 0, max: 0};
    }

    private findComfortableValuePerScale(minValue: number, maxValue: number, comfortablePixelPerScale: number, displayLength: number): number {

        let loopCounter = 0;
        const breakPoint = 100000;

        const cpps = comfortablePixelPerScale; // (px / scale)
        let currentValuePerScale = 0; // (unit / scale)
        let ok = false;

        while (!ok) {
            loopCounter++;
            currentValuePerScale += (!ok ? 1 : 0);

            // px = unit / (unit / scale) * (px / scale)
            const min = minValue / currentValuePerScale * cpps;
            // px = unit / (unit / scale) * (px / scale)
            const max = maxValue / currentValuePerScale * cpps;
            const valueRangeInPixel = max - min;

            if (valueRangeInPixel <= displayLength || loopCounter > breakPoint) {
                ok = true;
            }
        }
        return currentValuePerScale;
    }

    zoom(xFactor = 1.1, yFactor = 1.1) {
        this.ccs.zoom(xFactor, yFactor);

        if (this.dataSourceRef.zoomOptimization) {

            const rearrangePixelPerScaleOnAxisX = () => {
                // console.log('rearrange pixel per scale on the x axis - cuurent: ', this.ccs.pixelPerScaleX);
                let min = Infinity;
                let max = -Infinity;
                this.ccs.scaleMarkValueMapX.forEach((value, scaleMarkX) => {
                    min = Math.min(min, value);
                    max = Math.max(max, value);
                });
                // console.log('--- min/max value of scaleMarkValueMapX are: ', min, max);
                this.xAxisRange.min = min;
                this.xAxisRange.max = max;
            };

            const rearrangePixelPerScaleOnAxisY = () => {
                // console.log('rearrange pixel per scale on the y axis - current: ', this.ccs.pixelPerScaleY);
                let min = Infinity;
                let max = -Infinity;
                this.ccs.scaleMarkValueMapY.forEach((value, scaleMarkY) => {
                    min = Math.min(min, value);
                    max = Math.max(max, value);
                });
                // console.log('--- min/max value of scaleMarkValueMapX are: ', min, max);
                this.yAxisRange.min = min;
                this.yAxisRange.max = max;
            };

            if (
                this.ccs.pixelPerScaleX < this.comfPPS_X.min || this.ccs.pixelPerScaleX > this.comfPPS_X.max
                ||
                this.ccs.pixelPerScaleY < this.comfPPS_Y.min || this.ccs.pixelPerScaleY > this.comfPPS_Y.max
            ) {
                rearrangePixelPerScaleOnAxisX();
                rearrangePixelPerScaleOnAxisY();
                this.optimizeView(this.xAxisRange.min, this.xAxisRange.max, this.yAxisRange.min, this.yAxisRange.max);
            }


        }

        this.updatePoints();
    }

    move(dx: number, dy: number) {
        this.ccs.move(dx, dy);
        this.updatePoints();
    }

    /**
     * gets the x/y-Value represented by the cartasian coordinate system
     * @param x - x-coordinate of the own area, in which the ccs is displayed (same as the absolute x-value if this.x = 0)
     * @param y - y-coordinate of the own area, in which the ccs is displayed (same as the absolute y-value if this.y = 0)
     */
    getValueCoordinate(x: number, y: number): {x: number; y: number} {
        return this.ccs.getValueCoordinate(x, y);
    }

    /**
     * gets the own position of the cartasian coordinate system
     * @param x - x value that is represented by the ccs
     * @param y - y value that is represented by the ccs
     */
    getOwnCoordinate(x: number, y: number): {x: number; y: number} {
        return this.ccs.getOwnCoordinate(x, y);
    }

    setValuePerScale(x: number, y: number) {
        this.ccs.valuePerScaleX = x;
        this.ccs.valuePerScaleY = y;

        this.ccs.valuePerScaleX = this.ccs.valuePerScaleX >= 1 ? this.ccs.valuePerScaleX : 1;
        this.ccs.valuePerScaleY = this.ccs.valuePerScaleY >= 1 ? this.ccs.valuePerScaleY : 1;

        this.updatePoints();
    }

    setScaleAspect(value?: number) {
        this.scaleAspect = value ? value : this.aspect;
        this.updatePoints();
    }

    setPixelPerScale(value: number) {
        this.ccs.pixelPerScaleX = value;
        this.ccs.pixelPerScaleY = value / this.scaleAspect;
        this.updatePoints();
    }

    resetScaleAspect() {
        this.setScaleAspect();
    }

}
