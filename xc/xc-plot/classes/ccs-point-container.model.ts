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
import { XcCanvasHelper } from '@zeta/xc/xc-canvas/xc-canvas-helper.class';

import { Observable, Subscription } from 'rxjs/';

import { XcPlotPointConnection } from '../sub-classes/basics';
import { BezierSplineHelper, CurveControlPoints } from '../sub-classes/bezier-spline-helper.class';
import { XcPlotDataPair, XcPlotDataSource } from '../xc-plot-data-source';
import { CartasianCoordinateSystem } from './cartasian-coordinate-system.class';


/**
 * Draws the points and their connection line of a certain plot data source. This said data source is determined by
 * the item index within the datasource container
 */
export class CCSPointsContainer {

    private curveControlPointsCache: CurveControlPoints; // cache
    private cardinalCurvePointsCache: number[];

    dataSourceRef: XcPlotDataSource;
    dataSourceContainerRef: XcPlotDataSource[];
    subscription: Subscription = new Subscription();

    get pointConnectionType() {
        return this.dataSourceRef?.pointConnectionType;
    }

    constructor(dataSourceContainerRefChange: Observable<XcPlotDataSource[]>, protected containerItemIndex: number) {
        this.subscription.add(
            dataSourceContainerRefChange.subscribe(refs => {
                this.dataSourceRef = refs?.[containerItemIndex];
                this.dataSourceContainerRef = refs;
            })
        );
    }

    clearSubscriptions() {
        this.subscription?.unsubscribe();
        this.subscription = new Subscription();
    }

    getHitPoints(x: number, y: number, size = 8, allPoints = false): XcPlotDataPair[] {
        const hitPoints: XcPlotDataPair[] = [];
        const ds = this.dataSourceRef;
        if (allPoints) {
            hitPoints.push(...(ds.pairs.filter(p => p.isPointHit(x, y, size))));
        } else {
            hitPoints.push(ds.pairs.find(p => p.isPointHit(x, y, size)));
        }
        return hitPoints;
    }

    update(ccs: CartasianCoordinateSystem) {
        const ds = this.dataSourceRef;
        ds.pairs.forEach(p => p.update(ccs, ccs.x, ccs.y));

        if (this.pointConnectionType === XcPlotPointConnection.Bezier) {
            this.curveControlPointsCache = BezierSplineHelper.getCurveControlPoints(ds.pairs.map(p => ({x: p.drawX, y: p.drawY})));
        }

        if (this.pointConnectionType === XcPlotPointConnection.Cardinal) {
            const pointsArr: number[] = [];
            ds.pairs.forEach(p => pointsArr.push(p.drawX, p.drawY));
            this.cardinalCurvePointsCache = XcCanvasHelper.getCurvePoints(pointsArr);
        }
    }

    draw(c: CanvasRenderingContext2D) {

        const ds = this.dataSourceRef;

        // these values shall be dynamic and can be different with every function call
        const dynVals = {
            points: {
                color: this.dataSourceRef.localPointsStyling?.color ?? this.dataSourceRef.styleHelper.CCS.points.color,
                size: this.dataSourceRef.localPointsStyling?.size ?? this.dataSourceRef.styleHelper.CCS.points.size,
                glow: {
                    selected: {
                        color: this.dataSourceRef.localPointsStyling?.selected?.color ??  this.dataSourceRef.styleHelper.CCS.points.selected.color,
                        diameter: this.dataSourceRef.localPointsStyling?.selected?.circleDiameter ?? this.dataSourceRef.styleHelper.CCS.points.selected.circleDiameter
                    },
                    hover: {
                        color: this.dataSourceRef.localPointsStyling?.hover?.color ?? this.dataSourceRef.styleHelper.CCS.points.hover.color,
                        diameter: this.dataSourceRef.localPointsStyling?.hover?.circleDiameter ?? this.dataSourceRef.styleHelper.CCS.points.hover.circleDiameter
                    }
                }
            },
            connections: {
                color: this.dataSourceRef.localConnectionStyling?.color ?? this.dataSourceRef.styleHelper.CCS.connection.color,
                thickness: this.dataSourceRef.localConnectionStyling?.thickness ?? this.dataSourceRef.styleHelper.CCS.connection.thickness
            }
        };

        // drawing the connection of the points
        if (this.pointConnectionType && this.pointConnectionType !== XcPlotPointConnection.None) {
            c.strokeStyle = dynVals.connections.color;
            c.lineWidth = dynVals.connections.thickness;

            switch (this.pointConnectionType) {
                case XcPlotPointConnection.Linear: this.drawLinearLines(c); break;
                case XcPlotPointConnection.Cardinal: this.drawCardinalSpline(c); break;
                case XcPlotPointConnection.Interpolated: this.drawInterpolatedSpline(c); break;
                case XcPlotPointConnection.Bezier: this.drawBezierSpline(c); break;
            }
        }

        // drawing the points
        ds.pairs.forEach(p => {

            if (ds.selectionModel.isSelected(p)) {
                c.fillStyle = dynVals.points.glow.selected.color;
                XcCanvasHelper.fillCircle(c, p.drawX, p.drawY, dynVals.points.glow.selected.diameter, true);
            }

            if (ds.hoverModel.isSelected(p)) {
                c.fillStyle = dynVals.points.glow.hover.color;
                XcCanvasHelper.fillCircle(c, p.drawX, p.drawY, dynVals.points.glow.hover.diameter, true);
            }

            c.fillStyle = dynVals.points.color;
            XcCanvasHelper.fillCircle(c, p.drawX, p.drawY, dynVals.points.size, true);
        });

    }

    private drawLinearLines(c: CanvasRenderingContext2D) {

        const ds = this.dataSourceRef;

        if (ds.pairs && ds.pairs.length > 1) {
            let p = ds.pairs[0];
            c.beginPath();
            c.moveTo(p.drawX, p.drawY);
            for (let i = 1; i < ds.pairs.length; i++) {
                p = ds.pairs[i];
                c.lineTo(p.drawX, p.drawY);
            }
            c.stroke();
        }
    }

    private drawInterpolatedSpline(c: CanvasRenderingContext2D) {

        const ds = this.dataSourceRef;

        if (ds.pairs.length < 2) {
            return;
        }

        if (ds.pairs.length === 2) {
            this.drawLinearLines(c);
            return;
        }

        let i: number;
        let xc: number;
        let yc: number;
        let p: XcPlotDataPair;
        let p1: XcPlotDataPair;
        c.beginPath();
        p = ds.pairs[0];
        c.moveTo(p.drawX, p.drawY);
        for (i = 1; i < ds.pairs.length - 2; i++) {
            p = ds.pairs[i];
            p1 = ds.pairs[i + 1];
            xc = (p.drawX + p1.drawX) / 2;
            yc = (p.drawY + p1.drawY) / 2;
            c.quadraticCurveTo(p.drawX, p.drawY, xc, yc);
        }
        // curve through the last two points
        p = ds.pairs[i];
        p1 = ds.pairs[i + 1];
        c.quadraticCurveTo(p.drawX, p.drawY, p1.drawX, p1.drawY);
        c.stroke();
    }

    private drawCardinalSpline(c: CanvasRenderingContext2D) {
        const ds = this.dataSourceRef;

        if (!ds.pairs.length) {
            return;
        }

        c.moveTo(ds.pairs[0].drawX, ds.pairs[0].drawY);
        c.beginPath();
        XcCanvasHelper.strokeCurvePoints(c, this.cardinalCurvePointsCache);
        c.stroke();
    }

    private drawBezierSpline(c: CanvasRenderingContext2D) {
        const ds = this.dataSourceRef;

        if (!ds.pairs.length) {
            return;
        }

        let i: number;
        let p1: XcPlotDataPair;
        let p2: XcPlotDataPair;
        let cp1: {x: number; y: number};
        let cp2: {x: number; y: number};
        for (i = 0; i < this.curveControlPointsCache.first.length; i++) {

            p1 = ds.pairs[i];
            cp1 = this.curveControlPointsCache.first[i];
            cp2 = this.curveControlPointsCache.second[i];
            p2 = ds.pairs[i + 1];
            c.beginPath();
            c.moveTo(p1.drawX, p1.drawY);
            c.bezierCurveTo(
                cp1.x, cp1.y,
                cp2.x, cp2.y,
                p2.drawX, p2.drawY
            );
            c.stroke();
        }
    }

}
