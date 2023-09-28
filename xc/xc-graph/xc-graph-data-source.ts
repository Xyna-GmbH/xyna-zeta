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
import { Subject } from 'rxjs';

import { floorBase, seconds } from '../../base';
import { XcDataSource } from '../shared/xc-data-source';
import { XcWebGLFontAlignment } from '../xc-webgl/xc-webgl-font';


export enum XcGraphLineStyle {
    NONE,
    AXIS,
    GRAPH
}


export enum XcGraphType {
    VOID = 'void',
    LINE = 'line',
    AREA = 'area',
    DOT  = 'dot',
    BAR  = 'bar'
}


export enum XcGraphOption {
    SIZE   = 'size',
    WIDTH  = 'width',
    PADDING_LEFT  = 'paddingLeft',
    PADDING_RIGHT = 'paddingRight'
}


export type XcGraphOptions = {
    [option in XcGraphOption]?: any
};


export interface XcTimeInterval {
    readonly timeAt: number;
    readonly timeTo: number;
}


export interface XcGraphSlice {
    readonly time: number;
    readonly values: number[];
}


export interface XcGraphData {
    readonly id: number;
    readonly type: XcGraphType;
    readonly slices: XcGraphSlice[];
    readonly voids: XcGraphSlice[];
}


export interface XcGraphDataRequestOptions {
    readonly resolution?: number;
    readonly intervals?: XcTimeInterval[];
}


export class XcGraphUtils {

    /**
     * Returns a time interval based on a resolution
     * @param timeAt Beginning of the time interval
     * @param timeTo End of the time interval
     * @param resolution Resolution to base interval on
     * @returns Time interval
     */
    static createTimeInterval(timeAt: number, timeTo: number, resolution: number): XcTimeInterval {
        return {timeAt: floorBase(timeAt, resolution), timeTo: floorBase(timeTo, resolution)};
    }


    /**
     * Returns a new interval by shifting another time interval by a time offset
     * @param timeInterval Time interval to shift
     * @param offset Time offset to shift time interval by
     * @returns Shifted time interval
     */
    static shiftTimeInterval(interval: XcTimeInterval, offset: number): XcTimeInterval {
        return {timeAt: interval.timeAt + offset, timeTo: interval.timeTo + offset};
    }


    /**
     * Returns the length of the slice in time
     * @param slice Slice
     * @param resolution Slice resolution
     * @returns Time length of the slice
     */
    static getSliceTimeLength(slice: XcGraphSlice, resolution: number): number {
        return slice.values.length * resolution;
    }


    /**
     * Returns the timestamp at the beginning of the slice (inclusive)
     * @param slice Slice
     * @param resolution Slice resolution
     * @returns Timestamp at the beginning
     */
    static getSliceTimeAt(slice: XcGraphSlice, resolution: number): number {
        return floorBase(slice.time, resolution);
    }


    /**
     * Returns the timestamp at the end of the slice (exclusive)
     * @param slice Slice
     * @param resolution Slice resolution
     * @returns Timestamp at the end
     */
    static getSliceTimeTo(slice: XcGraphSlice, resolution: number): number {
        return this.getSliceTimeAt(slice, resolution) + this.getSliceTimeLength(slice, resolution);
    }


    /**
     * Returns the first slice index that contains the given interval (either completely, only beginning or only end)
     * @param slices Slices to check the interval against
     * @param interval Interval to check
     * @param resolution Slice resolution
     * @returns Index of the slice or -1, if the interval is not contained in any slice
     */
    static getSliceIndex(slices: XcGraphSlice[], interval: XcTimeInterval, resolution: number): number {
        return slices.findIndex(value =>
            this.getSliceTimeTo(value, resolution) >  interval.timeAt &&
            this.getSliceTimeAt(value, resolution) <= interval.timeTo
        );
    }


    /**
     * Returns the first slice with the start time after the given timestamp
     * @param slices Slices to check the timestamp against
     * @param timestamp Timestamo to check
     * @param resolution Slice resolution
     */
    static getSliceIndexAfterTimestamp(slices: XcGraphSlice[], timestamp: number, resolution: number): number {
        // returns the first slice with the start time after the given timestamp
        return slices.findIndex(value =>
            this.getSliceTimeAt(value, resolution) > floorBase(timestamp, resolution)
        );
    }


    /**
     * Merges two overlapping or directly adjacent slices (sorted by timestamp, ascending) and returns their distance to each other
     * @param curSlice Current slice to merge next slice into
     * @param nxtSlice Next slice to merge into current slice
     * @param resolution Slice resolution
     * @returns Distance from current slice to next slice:
     *      x < 0, if the slices overlap each other by x values,
     *      x = 0, if the slices are directly adjacent to each other,
     *      x > 0, if there is a gap of x values between the slices
     */
    static mergeAdjacentSlices(curSlice: XcGraphSlice, nxtSlice: XcGraphSlice, resolution: number): number {
        const distance = (this.getSliceTimeAt(nxtSlice, resolution) - this.getSliceTimeTo(curSlice, resolution)) / resolution;
        // overlapping
        if (distance < 0) {
            // remove overlapping values from current slice
            const overlappingValues = nxtSlice.values.splice(0, -distance);
            curSlice.values.splice(curSlice.values.length + distance, overlappingValues.length, ...overlappingValues);
        }
        // overlapping or directly adjacent
        if (distance <= 0) {
            // add values from next slice
            curSlice.values.splice(curSlice.values.length, 0, ...nxtSlice.values);
        }
        return distance;
    }


    /**
     * Merges all overlapping or directly adjacent slices
     * @param slices Slices already sorted by timestamp, ascending
     * @param resolution Slice resolution
     */
    static mergeSlices(slices: XcGraphSlice[], resolution: number) {
        let sliceIdx = 0;
        while (sliceIdx < slices.length - 1) {
            const curSlice = slices[sliceIdx];
            const nxtSlice = slices[sliceIdx + 1];
            // try to merge the adjacent slices
            if (this.mergeAdjacentSlices(curSlice, nxtSlice, resolution) <= 0) {
                // remove next slice, since it has been merged into current slice
                slices.splice(sliceIdx + 1, 1);
            } else {
                // go on with the next pair of slices
                sliceIdx++;
            }
        }
    }


    /**
     * Inserts a slice into a list of slices at the correct index (sorted by timestamp, ascending)
     * @param slices Slices already sorted by timestamp, ascending
     * @param slice Slice to insert
     * @param resolution Slice resolution
     */
    static insertSlice(slices: XcGraphSlice[], slice: XcGraphSlice, resolution: number) {
        // inserted slice must have a length
        if (this.getSliceTimeLength(slice, resolution) > 0) {
            const len = slices.length + 1;
            const idx = (this.getSliceIndexAfterTimestamp(slices, slice.time, resolution) + len) % len;
            slices.splice(idx, 0, slice);
        }
    }


    static *generateSliceValues(timeAt: number, timeTo: number, resolution: number): IterableIterator<number> {
        let timestamp = timeAt;
        while (timestamp < timeTo) {
            yield timestamp;
            timestamp += resolution;
        }
    }


    static generateSlice(timeAt: number, timeTo: number, resolution: number): XcGraphSlice {
        return {
            time: timeAt,
            values: [...XcGraphUtils.generateSliceValues(
                timeAt,
                timeTo,
                resolution
            )]
        };
    }


    static getSliceValuesPtr(slice: XcGraphSlice, interval: XcTimeInterval, resolution: number): {globalOff: number; localOff: number; len: number} {
        const intervalTimeAt = floorBase(interval.timeAt, resolution);
        const intervalTimeTo = floorBase(interval.timeTo, resolution) + resolution;
        const sliceTimeAt = this.getSliceTimeAt(slice, resolution);
        const sliceTimeTo = this.getSliceTimeTo(slice, resolution);
        const sliceLength = slice.values.length;
        const off = (sliceTimeAt - intervalTimeAt) / resolution;
        // interval start is within slice
        if (intervalTimeAt >= sliceTimeAt && intervalTimeAt <  sliceTimeTo) {
            return { globalOff: 0,   localOff: -off, len: Math.min(sliceLength + off, (intervalTimeTo - intervalTimeAt) / resolution) };
        }
        // interval end is within slice
        if (intervalTimeTo >  sliceTimeAt && intervalTimeTo <= sliceTimeTo) {
            return { globalOff: off, localOff: 0,    len: Math.min(sliceLength,       (intervalTimeTo - sliceTimeAt)    / resolution) };
        }
        // interval contains slice
        if (intervalTimeAt <  sliceTimeAt && intervalTimeTo >  sliceTimeTo) {
            return { globalOff: off, localOff: 0,    len: sliceLength };
        }
    }
}


export abstract class XcGraphDataSource extends XcDataSource<XcGraphData> {

    private _derivative = false;
    private _resolution = seconds(1);
    private _timeOffset = 0;
    private _timeInterval: XcTimeInterval = {timeAt: 0, timeTo: 0};

    private readonly _graphRequest = new Subject<XcGraphDataRequestOptions>();
    private readonly _graphTimeSlices = new Array<XcGraphSlice>();
    private readonly _graphDataList = new Array<XcGraphData>();

    name = '';
    unit = '';
    nameFontSize = 10;
    unitFontSize = 9;

    indicateLiveOffset = true;

    timestampLineThickness = 0.5;
    timestampLineStyle = XcGraphLineStyle.GRAPH;
    timestampFontSize = 9;
    timestampAlignment = XcWebGLFontAlignment.LEFT;
    timestampLeadingZeroes = true;
    timestampSecondFormat = 'hh:mm:ss';
    timestampMinuteFormat = 'hh:mm';

    datestampLineThickness = 0.5;
    datestampLineStyle = XcGraphLineStyle.GRAPH;
    datestampFontSize = 9;
    datestampAlignment = XcWebGLFontAlignment.LEFT;
    datestampLeadingZeroes = true;
    datestampFormat = 'yyyy-mm-dd';

    valuestampLineThickness = 0.5;
    valuestampLineStyle = XcGraphLineStyle.AXIS;
    valuestampFontSize = 9;


    constructor() {
        super();
        this._graphRequest.subscribe(options => this.request(options));
    }


    protected mergeGraphData(receivedGraphDataList: XcGraphData[], options: XcGraphDataRequestOptions) {
        // guard against different resolution
        if (options.resolution !== this.resolution) {
            return;
        }

        // insert new time slices computed from option intervals
        options.intervals.forEach(interval =>
            XcGraphUtils.insertSlice(
                this._graphTimeSlices,
                XcGraphUtils.generateSlice(interval.timeAt, interval.timeTo, this.resolution),
                this.resolution
            )
        );
        XcGraphUtils.mergeSlices(this._graphTimeSlices, this.resolution);

        // go through all received graph data items
        receivedGraphDataList.forEach(receivedGraphData => {
            // find graph data with the same id as received graph data, ...
            let graphData: XcGraphData = this._graphDataList.find(value => value.id === receivedGraphData.id);
            // ... or create a new one
            if (!graphData) {
                graphData = {
                    id: receivedGraphData.id,
                    type: receivedGraphData.type,
                    slices: [],
                    voids: []
                };
                this._graphDataList.push(graphData);
            }
            // insert data slices
            receivedGraphData.slices.forEach(slice =>
                XcGraphUtils.insertSlice(graphData.slices, slice, this.resolution)
            );
            // insert void slices
            options.intervals.forEach(interval => {
                let time = interval.timeAt;
                receivedGraphData.slices.forEach(slice => {
                    if (slice.time > time) {
                        XcGraphUtils.insertSlice(graphData.voids, XcGraphUtils.generateSlice(time, slice.time, this.resolution), this.resolution);
                    }
                    time = XcGraphUtils.getSliceTimeTo(slice, this.resolution);
                });
                if (time < interval.timeTo) {
                    XcGraphUtils.insertSlice(graphData.voids, XcGraphUtils.generateSlice(time, interval.timeTo, this.resolution), this.resolution);
                }
            });
            // merge slices
            XcGraphUtils.mergeSlices(graphData.slices, this.resolution);
            XcGraphUtils.mergeSlices(graphData.voids, this.resolution);
        });

        // update with computed derivative or raw data
        this.data = this.derivative
            ? this._graphDataList.map(graphData =>
                <XcGraphData>{
                    id: graphData.id,
                    type: graphData.type,
                    slices: graphData.slices.map(slice =>
                        <XcGraphSlice>{
                            time: slice.time,
                            values: slice.values.map((value, idx, array) =>
                                idx === 0 ? 0 : (value - array[idx - 1]) * 1000 / this.resolution
                            )
                        }
                    ),
                    voids: graphData.voids
                }
            ) : this._graphDataList;
    }


    protected abstract request(options: XcGraphDataRequestOptions): void;


    clear() {
        // throw away time slices and graph data
        this._graphTimeSlices.splice(0);
        this._graphDataList.splice(0);
        this.triggerMarkForChange();
    }


    get derivative(): boolean {
        return this._derivative;
    }


    set derivative(value: boolean) {
        if (value !== this.derivative) {
            this._derivative = value;
            this.clear();
        }
    }


    get resolution(): number {
        return this._resolution;
    }


    set resolution(value: number) {
        if (value !== this.resolution) {
            this._resolution = value;
            this.clear();
        }
    }


    get timeOffset(): number {
        return this._timeOffset;
    }


    set timeOffset(value: number) {
        this._timeOffset = value;
    }


    get timeInterval(): XcTimeInterval {
        return this._timeInterval;
    }


    set timeInterval(value: XcTimeInterval) {
        // truncate to resolution
        value = XcGraphUtils.createTimeInterval(value.timeAt, value.timeTo, this.resolution);

        // ensure that timeTo is after timeAt
        if (value.timeTo > value.timeAt) {
            const timeIntervalChanged = (value.timeAt !== this.timeInterval.timeAt || value.timeTo !== this.timeInterval.timeTo);

            // gather missing intervals
            let timestamp = value.timeAt;
            const intervals: XcTimeInterval[] = [];
            this._graphTimeSlices.forEach(slice => {
                // interval starts before current slice
                if (XcGraphUtils.getSliceTimeAt(slice, this.resolution) > timestamp && timestamp < value.timeTo) {
                    intervals.push({
                        timeAt: timestamp,
                        timeTo: Math.min(XcGraphUtils.getSliceTimeAt(slice, this.resolution), value.timeTo)
                    });
                }
                // go to end of slice
                timestamp = Math.max(XcGraphUtils.getSliceTimeTo(slice, this.resolution), value.timeAt);
            });
            if (timestamp < value.timeTo) {
                // interval after last slice
                intervals.push({
                    timeAt: timestamp,
                    timeTo: value.timeTo
                });
            }

            // remember time interval
            this._timeInterval = value;

            // request missing intervals
            if (intervals.length > 0) {
                this._graphRequest.next({resolution: this.resolution, intervals});
            }

            // graph must be updated
            if (timeIntervalChanged) {
                this.triggerMarkForChange();
            }
        }
    }


    get graphTimeSlices(): XcGraphSlice[] {
        return this._graphTimeSlices;
    }


    getGraphData(): XcGraphData[] {
        return this.data;
    }


    getGraphColor(id: number, type: XcGraphType): number {
        return 0xffffff;
    }


    getGraphStyle(id: number, type: XcGraphType): number {
        return 0;
    }


    getGraphOptions(id: number, type: XcGraphType): XcGraphOptions {
        return {};
    }
}
