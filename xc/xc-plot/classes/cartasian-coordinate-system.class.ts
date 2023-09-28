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
import { Observable, Subscription } from 'rxjs';

import { CommonBorder, XcPlottableArea } from '../sub-classes/basics';
import { XcPlotDataSource } from '../xc-plot-data-source';
import { CCSPointsContainer } from './ccs-point-container.model';


/**
 * Represents a Cartesian coordinate system
 */
export class CartasianCoordinateSystem {

    nullpoint = {
        x: 0,
        y: this.height
    };

    private dataSourceRef: XcPlotDataSource;
    private pointsContainer: CCSPointsContainer[] = [];

    /**
     * Determins the value gap of the plot marks on the abscissa (x axis)
     */
    valuePerScaleX = 1;
    /**
     * Determins the value gap of the plot marks on the ordinate (y axis)
     */
    valuePerScaleY = 1;

    /**
     * Determins the number of pixels between two plot marks on the abscissa (x axis)
     */
    pixelPerScaleX = 30;
    /**
     * Determins the number of pixels between two plot marks on the ordinate (y axis)
     */
    pixelPerScaleY = 30;

    get valuePerPixelX() {
        return this.valuePerScaleX / this.pixelPerScaleX;
    }

    get valuePerPixelY() {
        return this.valuePerScaleY / this.pixelPerScaleY;
    }

    /* FLAGS */
    drawOrdinate = true;
    drawAbscissa = true;
    drawScaleMarksX = true;
    drawScaleMarksY = true;

    drawScaleHelpLines = true;

    borderThickness = 1;

    private readonly scaleMarkPositionX: number[] = [];
    private readonly scaleMarkPositionY: number[] = [];

    private readonly scaleMarkMapX = new Map<number, number>();
    private readonly scaleMarkMapY = new Map<number, number>();

    get scaleMarkValueMapX(): Map<number, number> {
        return this.scaleMarkMapX;
    }

    get scaleMarkValueMapY(): Map<number, number> {
        return this.scaleMarkMapY;
    }

    get scaleMarkPositions(): {axisX: number[]; axisY: number[]} {
        return {
            axisX: this.scaleMarkPositionX,
            axisY: this.scaleMarkPositionY
        };
    }

    subscription: Subscription;

    constructor(
        dataSourceContainerRefChange: Observable<XcPlotDataSource[]>,
        public x = 0,
        public y = 0,
        public width = 300,
        public height = 150
    ) {

        this.subscription =
        dataSourceContainerRefChange.subscribe(refs => {
            // only the first datasource holds the information needed to draw the c. coordinate system
            this.dataSourceRef = refs?.[0];
            // this.dataSourceContainerRef = refs;
            if (this.pointsContainer?.length) {
                this.pointsContainer.forEach(c => c.clearSubscriptions());
            }
            this.pointsContainer = [];
            refs?.forEach((ref, i) => {
                this.pointsContainer.push(new CCSPointsContainer(dataSourceContainerRefChange, i));
            });

        });
    }

    clearSubscriptions() {
        this.pointsContainer?.forEach(c => c.clearSubscriptions());
        this.subscription?.unsubscribe();
    }


    draw(c: CanvasRenderingContext2D, dt: number) {

        let i: number;
        let valx: number;
        let valy: number;
        let scaleMarkNumber: number;
        let scaleMarkIndex: number;

        c.save();

        if (this.dataSourceRef.styleHelper.CCS.backgroundColor) {
            c.fillStyle = this.dataSourceRef.styleHelper.CCS.backgroundColor;
            c.fillRect(this.x, this.y, this.width, this.height);
        }

        // if the Border is set then it will be drawn
        if (this.dataSourceRef.styleHelper.CCS.borderThickness > 0) {
            c.strokeStyle = this.dataSourceRef.styleHelper.CCS.borderColor;
            c.lineWidth = this.dataSourceRef.styleHelper.CCS.borderThickness;
            c.strokeRect(this.x, this.y, this.width, this.height);
        }

        this.clip(c);

        // gets the local nullpoint, whose position is for drawing
        const areaNP = {
            x: this.x + this.nullpoint.x,
            y: this.y + this.nullpoint.y
        };

        c.strokeStyle = this.dataSourceRef.styleHelper.CCS.axisColor;
        if (this.drawOrdinate) {
            // drawing the ordinate (y-axis)
            c.beginPath();
            c.moveTo(areaNP.x, this.y);
            c.lineTo(areaNP.x, this.y + this.height);
            c.stroke();
        }

        if (this.drawAbscissa) {
            // drawing the abscissa (x-axis)
            c.beginPath();
            c.moveTo(this.x, areaNP.y);
            c.lineTo(this.x + this.width, areaNP.y);
            c.stroke();
        }

        this.scaleMarkPositionX.splice(0, this.scaleMarkPositionX.length);
        this.scaleMarkPositionY.splice(0, this.scaleMarkPositionY.length);

        this.scaleMarkMapX.clear();
        this.scaleMarkMapY.clear();

        this.scaleMarkPositionX.push(areaNP.x);
        this.scaleMarkPositionY.push(areaNP.y);

        if (this.drawScaleHelpLines) {

            i = this.x + (this.nullpoint.x % this.pixelPerScaleX);

            while (i <= this.x + this.width) {

                // start - drawing the helpline
                c.lineWidth = 1;
                c.strokeStyle = this.dataSourceRef.styleHelper.CCS.scaleHelpLineColor;

                c.beginPath();
                c.moveTo(i, this.y);
                c.lineTo(i, this.y + this.height);
                c.stroke();
                c.closePath();
                // end - drawing the helpline

                // start - saving the axis value of the scale in a Map (for later use)
                valx = (i - areaNP.x) * this.valuePerPixelX;
                this.scaleMarkMapX.set(i, valx);
                // start - saving the axis value of the scale in a Map (for later use)

                // start - drawing scale mark on the abscissa
                scaleMarkNumber = Math.round(valx / this.valuePerScaleX);
                scaleMarkIndex = (scaleMarkNumber % 10) ? (scaleMarkNumber % 5) ? 0 : 1 : 2;
                c.lineWidth = this.dataSourceRef.styleHelper.CCS.scaleMark.thicknesses[scaleMarkIndex];
                c.strokeStyle = this.dataSourceRef.styleHelper.CCS.scaleMark.colors[scaleMarkIndex];
                c.beginPath();
                c.moveTo(i, areaNP.y);
                c.lineTo(i, areaNP.y - this.dataSourceRef.styleHelper.CCS.scaleMark.lengths[scaleMarkIndex]);
                c.stroke();
                c.closePath();
                // end - drawing scale mark on the abscissa

                // next scale mark
                i += this.pixelPerScaleX;
            }

            i = this.y + (this.nullpoint.y % this.pixelPerScaleY);

            while (i <= this.y + this.height) {

                // start - drawing the helpline
                c.lineWidth = 1;
                c.strokeStyle = this.dataSourceRef.styleHelper.CCS.scaleHelpLineColor;

                c.beginPath();
                c.moveTo(this.x, i);
                c.lineTo(this.x + this.width, i);
                c.stroke();
                c.closePath();
                // end - drawing the helpline

                // start - saving the axis value of the scale in a Map (for later use)
                valy = (areaNP.y - i) * this.valuePerPixelY;
                this.scaleMarkMapY.set(i, valy);
                // end - saving the axis value of the scale in a Map (for later use)

                // start - drawing scale mark on the ordinate
                scaleMarkNumber = Math.round(valy / this.valuePerScaleY);
                scaleMarkIndex = (scaleMarkNumber % 10) ? (scaleMarkNumber % 5) ? 0 : 1 : 2;
                c.lineWidth = this.dataSourceRef.styleHelper.CCS.scaleMark.thicknesses[scaleMarkIndex];
                c.strokeStyle = this.dataSourceRef.styleHelper.CCS.scaleMark.colors[scaleMarkIndex];
                c.beginPath();
                c.moveTo(areaNP.x, i);
                c.lineTo(areaNP.x + this.dataSourceRef.styleHelper.CCS.scaleMark.lengths[scaleMarkIndex], i);
                c.stroke();
                c.closePath();
                // end - drawing scale mark on the ordinate

                // next scale mark
                i += this.pixelPerScaleY;
            }

        }

        // draw points and its connection from the back to the front, so that the first datasource won't be overdrawn
        if (this.pointsContainer?.length) {
            let index: number;
            for (index = this.pointsContainer.length - 1; index >= 0; index--) {
                this.pointsContainer[index].draw(c);
            }
        }

        c.restore();

    }

    clip(c: CanvasRenderingContext2D) {
        c.beginPath();
        // nothing beyond this two commands will cause the canvas to draw over the coord-sys
        c.rect(this.x, this.y, this.width, this.height);
        c.closePath();
        c.clip();
    }

    clipOffSystem(c: CanvasRenderingContext2D, where: CommonBorder, offDistance: number) {
        let rect: XcPlottableArea;
        switch (where) {
            case CommonBorder.Left: rect = { x: this.x - offDistance, y: this.y, width: offDistance, height: this.height }; break;
            case CommonBorder.Right: rect = { x: this.x + this.width, y: this.y, width: offDistance, height: this.height }; break;
            case CommonBorder.Top: rect = { x: this.x, y: this.y - offDistance, width: this.width, height: offDistance }; break;
            case CommonBorder.Bottom: rect = { x: this.x, y: this.height + this.y, width: this.width, height: offDistance }; break;
        }
        c.beginPath();
        c.rect(rect.x, rect.y, rect.width, rect.height);
        c.closePath();
        c.clip();
    }

    zoom(xFactor = 1.1, yFactor = 1.1) {
        this.pixelPerScaleX *= xFactor;
        this.pixelPerScaleY *= yFactor;
        this.nullpoint.x = this.nullpoint.x * xFactor + (this.width * (1 - xFactor) / 2);
        this.nullpoint.y = this.nullpoint.y * yFactor + (this.height * (1 - yFactor) / 2);
    }

    move(dx: number, dy: number) {
        this.nullpoint.x += dx;
        this.nullpoint.y += dy;
    }

    center() {
        this.nullpoint = {
            x: this.width / 2,
            y: this.height / 2
        };
    }

    updatePoints() {
        this.pointsContainer?.forEach(c => c.update(this));
    }


    /**
     * gets the x/y-Value represented by the cartasian coordinate system
     * @param x - x-coordinate of the own area, in which the ccs is displayed (same as the absolute x-value if this.x = 0)
     * @param y - y-coordinate of the own area, in which the ccs is displayed (same as the absolute y-value if this.y = 0)
     */
    getValueCoordinate(x: number, y: number): {x: number; y: number} {
        const relX = x - this.nullpoint.x;
        const valX = relX * this.valuePerPixelX;

        const relY = this.nullpoint.y - y;
        const valY = relY * this.valuePerPixelY;

        return {x: valX, y: valY};
    }

    /**
     * gets the own position of the cartasian coordinate system
     * @param x - x value that is represented by the ccs
     * @param y - y value that is represented by the ccs
     */
    getOwnCoordinate(x: number, y: number): {x: number; y: number} {

        const relX = x / this.valuePerPixelX;
        const absX = relX + this.nullpoint.x;

        const relY = y / this.valuePerPixelY;
        const absY = this.nullpoint.y - relY;

        return {x: absX, y: absY};
    }

}
