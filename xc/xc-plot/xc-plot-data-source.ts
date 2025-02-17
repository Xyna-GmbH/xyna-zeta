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
import { BehaviorSubject, Observable } from 'rxjs';

import { timeString } from '../../base';
import { XcDataSource } from '../shared/xc-data-source';
import { XcSelectionModel } from '../shared/xc-selection';
import { CartasianCoordinateSystem } from './classes/cartasian-coordinate-system.class';
import { XcPlotPointConnection } from './sub-classes/basics';
import { CartasianCoordinateSystemConnectionStyling, CartasianCoordinateSystemPointsStyling, XcPlotStyleHelper } from './xc-plot-style-helper.class';


export enum XcPlotDataChangeBehavior {
    OptimizeViewport = 'OptimizeViewport',
    ResetToPlotInfo = 'ResetToPlotInfo',
    Ignore = 'Ignore'
}

export class XcPlotDataInfo {
    constructor(
        public xMin?: number,
        public xMax?: number,
        public xUnit?: string,
        public xUnitLabel?: string, // if i18n is used, translate label
        public yMin?: number,
        public yMax?: number,
        public yUnit?: string,
        public yUnitLabel?: string, // if i18n is used, translate label
        public bootstrap = false
    ) { }

    clone(): XcPlotDataInfo {
        return new XcPlotDataInfo(
            this.xMin,
            this.xMax,
            this.xUnit,
            this.xUnitLabel,
            this.yMin,
            this.yMax,
            this.yUnit,
            this.yUnitLabel,
            this.bootstrap
        );
    }
}


export class XcPlotDataPair {

    static build(x: number, y: number): XcPlotDataPair {
        return new this(x, y);
    }

    private _drawX: number;
    get drawX(): number {
        return this._drawX;
    }

    private _drawY: number;
    get drawY(): number {
        return this._drawY;
    }

    get uid(): string {
        return this.x + '/' + this.y;
    }

    constructor(public x: number, public y: number) { }

    update(ccs: CartasianCoordinateSystem, offsetX = 0, offsetY = 0) {
        if (typeof this.x === 'number' && typeof this.y === 'number') {
            const own = ccs.getOwnCoordinate(this.x, this.y);
            this._drawX = own.x + offsetX;
            this._drawY = own.y + offsetY;
        }
    }

    // cubical tested if there is a hit
    isPointHit = (hpx: number, hpy: number, size = 20): boolean =>
        hpx - size / 2 <= this.drawX &&
        hpx + size / 2 >= this.drawX &&
        hpy - size / 2 <= this.drawY &&
        hpy + size / 2 >= this.drawY;

}

export class XcPlotDataSource extends XcDataSource<XcPlotDataPair> {

    private readonly defaultValueTransformationFunction = (value: number) => (Math.round(value * 100) / 100).toString(10);
    private readonly defaultTimeTransformationFunction = (val: number) => timeString(val, 'hh:mm:ss:msec');
    private readonly defaultPlotDataInfo = new XcPlotDataInfo(-1, 10, 'number', 'X', -1, 10, 'number', 'Y', true);

    private _xValueTransformationFunction = this.defaultValueTransformationFunction;
    private _yValueTransformationFunction = this.defaultValueTransformationFunction;

    private readonly pointConnectionTypeSubject = new BehaviorSubject<XcPlotPointConnection>(XcPlotPointConnection.None);
    private readonly plotDataInfoSubject = new BehaviorSubject<XcPlotDataInfo>(this.defaultPlotDataInfo);
    private readonly dataChangeBehaviorSubject = new BehaviorSubject<XcPlotDataChangeBehavior>(XcPlotDataChangeBehavior.Ignore);

    get plotDataInfo(): XcPlotDataInfo {
        return this.plotDataInfoSubject.value;
    }

    set plotDataInfo(value: XcPlotDataInfo) {
        if (value) {
            value.xMin = typeof value.xMin === 'number' ? value.xMin : this.getMinX();
            value.xMax = typeof value.xMax === 'number' ? value.xMax : this.getMaxX();

            value.yMin = typeof value.yMin === 'number' ? value.yMin : this.getMinY();
            value.yMax = typeof value.yMax === 'number' ? value.yMax : this.getMaxY();
        }
        this.plotDataInfoSubject.next(value);
    }

    get pointConnectionType(): XcPlotPointConnection {
        return this.pointConnectionTypeSubject.value;
    }

    set pointConnectionType(value: XcPlotPointConnection) {
        this.pointConnectionTypeSubject.next(value);
    }

    get pointConnectionTypeChange(): Observable<XcPlotPointConnection> {
        return this.pointConnectionTypeSubject.asObservable();
    }

    get dataChangeBehavior(): XcPlotDataChangeBehavior {
        return this.dataChangeBehaviorSubject.value;
    }

    set dataChangeBehavior(value: XcPlotDataChangeBehavior) {
        this.dataChangeBehaviorSubject.next(value);
    }

    get dataChangeBehaviorChange(): Observable<XcPlotDataChangeBehavior> {
        return this.dataChangeBehaviorSubject.asObservable();
    }

    get xValueTransformationFunction() {
        return this._xValueTransformationFunction;
    }

    get yValueTransformationFunction() {
        return this._yValueTransformationFunction;
    }

    selectionModel = new XcSelectionModel<XcPlotDataPair>();
    hoverModel = new XcSelectionModel<XcPlotDataPair>();

    allowMultiSelect: boolean;
    showGeneratedPopup: boolean;
    zoomOptimization: boolean;

    /**
     * A reference to the global style object, which is used if a respective property in the local style does not exist
     */
    styleHelper = XcPlotStyleHelper;

    localPointsStyling: CartasianCoordinateSystemPointsStyling = { selected: {}, hover: {} };
    localConnectionStyling: CartasianCoordinateSystemConnectionStyling = {};

    get pairs(): XcPlotDataPair[] {
        return this.data;
    }


    addPairs(pairs: XcPlotDataPair[]) {
        if (this.data) {
            this.data = [...this.data, ...pairs];
        } else {
            this.data = pairs;
        }
    }


    clear() {
        this.data = [];
        this.hoverModel.clear();
        this.selectionModel.clear();
    }


    refresh() {
        // eslint-disable-next-line no-self-assign
        this.data = this.data;
        super.refresh();
    }


    /**
     * @param criteria - which axis sets the criteria of sorting
     */
    sortPoints(criteria: 'x' | 'y' = 'x') {
        if (criteria === 'y') {
            this.data = this.data.sort((a, b) => a.y > b.y ? 1 : a.y === b.y ? 0 : -1);
        } else {
            this.data = this.data.sort((a, b) => a.x > b.x ? 1 : a.x === b.x ? 0 : -1);
        }
    }

    // provided from the data sources's data
    getLocalExtrema(): { xMin: number; xMax: number; yMin: number; yMax: number } {

        const allX = this.pairs.length ? this.pairs.map(dp => dp.x) : [this.defaultPlotDataInfo.xMin, this.defaultPlotDataInfo.xMax];
        const allY = this.pairs.length ? this.pairs.map(dp => dp.y) : [this.defaultPlotDataInfo.yMin, this.defaultPlotDataInfo.yMax];
        return {
            xMin: Math.min(...allX),
            xMax: Math.max(...allX),
            yMin: Math.min(...allY),
            yMax: Math.max(...allY)
        };
    }

    private getMinX(): number {
        return this.pairs.length ? Math.min(...this.data.map(dp => dp.x)) : this.defaultPlotDataInfo.xMin;
    }

    private getMaxX(): number {
        return this.pairs.length ? Math.max(...this.data.map(dp => dp.x)) : this.defaultPlotDataInfo.xMax;
    }

    private getMinY(): number {
        return this.pairs.length ? Math.min(...this.data.map(dp => dp.y)) : this.defaultPlotDataInfo.yMin;
    }

    private getMaxY(): number {
        return this.pairs.length ? Math.max(...this.data.map(dp => dp.y)) : this.defaultPlotDataInfo.yMax;
    }

    /**
     * changes the plot data source to a give XcPlotPointConnection or swaps to the next one in the enum
     */
    changePointConnectionType(to?: XcPlotPointConnection) {
        if (to) {
            this.pointConnectionType = to;
        } else {
            const keys = Object.keys(XcPlotPointConnection);
            const key = keys.find(attr => this.pointConnectionType === XcPlotPointConnection[attr]);
            const i = keys.indexOf(key);
            this.pointConnectionType = XcPlotPointConnection[keys[(i + 1) % keys.length]];
        }
    }

    setValueTransformationFunction(axis: 'x' | 'y', fn: (value: number) => string): boolean {
        if (axis === 'x') {
            this._xValueTransformationFunction = fn;
            return true;
        }
        if (axis === 'y') {
            this._yValueTransformationFunction = fn;
            return true;
        }
        return false;
    }

    setDefaultValueTransformationFunction(axis: 'x' | 'y'): boolean {
        if (axis === 'x') {
            this._xValueTransformationFunction = this.defaultValueTransformationFunction;
            return true;
        }
        if (axis === 'y') {
            this._yValueTransformationFunction = this.defaultValueTransformationFunction;
            return true;
        }
        return false;
    }

    setDefaultTimeTransformationFunction(axis: 'x' | 'y'): boolean {
        if (axis === 'x') {
            this._xValueTransformationFunction = this.defaultTimeTransformationFunction;
            return true;
        }
        if (axis === 'y') {
            this._yValueTransformationFunction = this.defaultTimeTransformationFunction;
            return true;
        }
        return false;
    }

}

