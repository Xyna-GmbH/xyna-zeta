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


export enum MouseEventType {
    click = 'click',
    contextmenu = 'contextmenu',
    dblclick = 'dblclick',
    mousedown = 'mousedown',
    mouseenter = 'mouseenter',
    mouseleave = 'mouseleave',
    mousemove = 'mousemove',
    // mouseout = 'mouseout', // Because the canvas won't have any children, this event will trigger exactly like 'mouseleave'
    mouseover = 'mouseover',
    mouseup = 'mouseup',
    wheel = 'wheel'
}

export interface XcCanvasMouseEventsOption {
    eventsListenTo: MouseEventType[];
}

interface HTMLCanvasElementCapStream extends HTMLCanvasElement {
    captureStream: (framesPerSecond?: number) => MediaStream;
}

class BlobEvent extends Event {
    data: any;
}

declare class MediaRecorder {

    constructor(mediaStream: MediaStream);
    audioBitsPerSecond: number;
    mimeType: string;
    ondataavailable: (e: BlobEvent) => void;
    onerror: (e: Event) => void;
    onpause: (e: Event) => void;
    onresume: (e: Event) => void;
    onstart: (e: Event) => void;
    onstop: (e: Event) => void;
    start: () => void;
    stop: () => void;
    state: string;
    stream: MediaStream;
    videoBitsPerSecond: number;
}


export class CanvasHelperRecording {
    stream: MediaStream;
    recorder: MediaRecorder;
    chunks: any[];
    file: Blob;
    filename: string;

    get recording(): boolean {
        return this.recorder ? this.recorder.state === 'recording' : false;
    }

    private readonly behaviorSubject = new BehaviorSubject<CanvasHelperRecording>(null);

    get readyChanged(): Observable<CanvasHelperRecording> {
        return this.behaviorSubject.asObservable();
    }

    constructor(canvas: HTMLCanvasElement) {
        this.stream = (canvas as HTMLCanvasElementCapStream).captureStream(25);
        this.recorder = new MediaRecorder(this.stream);
        this.chunks = [];

        this.recorder.ondataavailable = e => {
            this.chunks.push(e.data);
        };
    }

    start() {
        this.recorder.start();
    }

    stop() {
        this.recorder.onstop = e => {
            this.file = new Blob(this.chunks, { type: 'video/mp4' });
            this.filename = 'record_' + Date.now() + '.mp4';
            this.behaviorSubject.next(this);
        };

        this.recorder.onerror = e => {
            this.behaviorSubject.error(e);
        };

        this.recorder.stop();
    }
}

/**
 * Follow commentaries rely on default "left to right" button layout
 *
 * Main: usually "Left"
 * Auxiliary: usually "Middle"
 * Secondary: usually "Right"
 * Fourth: often used as "Browser Back"
 * Fifth: often used as "Browser Forward"
 */
export enum MouseButton {
    Main = 0,
    Auxiliary = 1,
    Secondary = 2,
    Fourth = 3,
    Fifth = 4
}

export function getMouseButton(e: MouseEvent): MouseButton {
    return e.button as MouseButton;
}

export enum CanvasFillRule {
    nonzero = 'nonzero',
    evenodd = 'evenodd'
}


export class ScreenInfo {
    get aspect(): number {
        return this.width / this.height;
    }
    constructor(public width = 0, public height = 0) { }
}


export class XcCanvasHelper {

    /**
     * Creates a circle path with the radius r. The circle touches the axis of x and y if centroid is false
     * Is it true than x,y will be the centroid of the circle
     * @param x - x coordinate
     * @param y - y coordinate
     * @param r - radius of the circle
     * @param centroid  - is x/y the centroid of the circle or the upper left corner
     * @param clockwise - draw the circle clockwise if true (only important for CanvasFillRule and more than one circle)
     */
    static circle(c: CanvasRenderingContext2D, x: number, y: number, r: number, centroid = true, clockwise = true) {
        if (!centroid) {
            x += r;
            y += r;
        }
        c.moveTo(x + r, y);
        if (clockwise) {
            c.arcTo(x + r, y + r, x, y + r, r);
            c.arcTo(x - r, y + r, x - r, y, r);
            c.arcTo(x - r, y - r, x, y - r, r);
            c.arcTo(x + r, y - r, x + r, y, r);
        } else {
            c.arcTo(x + r, y - r, x, y - r, r);
            c.arcTo(x - r, y - r, x - r, y, r);
            c.arcTo(x - r, y + r, x, y + r, r);
            c.arcTo(x + r, y + r, x + r, y, r);
        }
    }

    /**
     * Creates a circle path with the radius r and fills it. The circle touches the axis of x and y if centroid is false
     * Is it true than x,y will be the centroid of the circle.
     * @param x - x-value of drawing point
     * @param y - y-value of drawing point
     * @param r - radius of the circle
     * @param centroid - drawing point is the centroid of the circle or the upper left corner
     */
    static fillCircle(c: CanvasRenderingContext2D, x: number, y: number, r: number, centroid = true) {
        c.beginPath();
        XcCanvasHelper.circle(c, x, y, r, centroid);
        c.fill();
        c.closePath();
    }

    /**
     * Creates a circle path with the radius r and outlines it. The circle touches the axis of x and y if centroid is false
     * Is it true than x,y will be the centroid of the circle.
     * @param x - x-value of drawing point
     * @param y - y-value of drawing point
     * @param r - radius of the circle
     * @param centroid - drawing point is the centroid of the circle or the upper left corner
     */
    static strokeCircle(c: CanvasRenderingContext2D, x: number, y: number, r: number, centroid = true) {
        c.beginPath();
        XcCanvasHelper.circle(c, x, y, r, centroid);
        c.stroke();
        c.closePath();
    }

    /**
     * Creates a path in the form of an arrow. From the point (x/y), with a certain length and an overall-thickness
     * A degree value can be specified. arrow 0 = points right, 90 = points down ... and so on.
     * @param x - x-value
     * @param y - y-value
     * @param th - overall thickness (= thickness of the arrow head)
     * @param len - overall length
     * @param degree - number of degree
     * @param hlr - (optional) head-length-ratio - length of the head relative to the overall length [0-1], default: 0.2
     * @param bhr - (optional) body-head-ratio - thickness of the body relative to the overall thickness [0-1], default: 0.5
     * @param clockwise - (optional) arrow path will be drawn clockwise or not. important with the fill-rule, default: true
     */
    static arrow(c: CanvasRenderingContext2D, x: number, y: number, th: number, len: number, degree = 0, hlr = 0.2, bhr = 0.5, clockwise = true) {

        const rad = degree * Math.PI / 180;
        const bth = th * bhr;

        c.save();
        c.translate(x, y);
        c.rotate(rad);

        c.moveTo(0, 0);
        if (clockwise) {
            c.lineTo(0, -bth / 2);
            c.lineTo(len - len * hlr, -bth / 2);
            c.lineTo(len - len * hlr, -th / 2);
            c.lineTo(len, 0); // arrow peak
            c.lineTo(len - len * hlr, th / 2);
            c.lineTo(len - len * hlr, bth / 2);
            c.lineTo(0, bth / 2);
        } else {
            c.lineTo(0, bth / 2);
            c.lineTo(len - len * hlr, bth / 2);
            c.lineTo(len - len * hlr, th / 2);
            c.lineTo(len, 0); // arrow peak
            c.lineTo(len - len * hlr, -th / 2);
            c.lineTo(len - len * hlr, -bth / 2);
            c.lineTo(0, -bth / 2);
        }
        c.lineTo(0, 0);
        c.restore();
    }

    /**
     * Draws a filled arrow. From the point (x/y), with a certain length and an overall-thickness
     * A degree value can be specified. 0 = arrow points right, 90 = points down ... and so on.
     * @param x - x-value
     * @param y - y-value
     * @param th - overall thickness (= thickness of the arrow head)
     * @param len - overall length
     * @param degree - number of degree
     * @param hlr - (optional) head-length-ratio - length of the head relative to the overall length [0-1], default: 0.2
     * @param bhr - (optional) body-head-ratio - thickness of the body relative to the overall thickness [0-1], default: 0.5
     */
    static fillArrow(c: CanvasRenderingContext2D, x: number, y: number, th: number, len: number, degree = 0, hlr?: number, bhr?: number) {
        c.beginPath();
        XcCanvasHelper.arrow(c, x, y, th, len, degree, hlr, bhr);
        c.fill();
    }

    /**
     * Drows a stroked arrow. From the point (x/y), with a certain length and an overall-thickness
     * A degree value can be specified. 0 = arrow points right, 90 = points down ... and so on.
     * @param x - x-value
     * @param y - y-value
     * @param th - overall thickness (= thickness of the arrow head)
     * @param len - overall length
     * @param degree - number of degree
     * @param hlr - (optional) head-length-ratio - length of the head relative to the overall length [0-1], default: 0.2
     * @param bhr - (optional) body-head-ratio - thickness of the body relative to the overall thickness [0-1], default: 0.5
     */
    static strokeArrow(c: CanvasRenderingContext2D, x: number, y: number, th: number, len: number, degree?: number, hlr?: number, bhr?: number) {
        c.beginPath();
        XcCanvasHelper.arrow(c, x, y, th, len, degree, hlr, bhr);
        c.stroke();
    }

    /**
     * Creating an arrow path by defining two points
     * @param x1 x-value of first point
     * @param y1 y-value of first point
     * @param x2 x-value of second point
     * @param y2 y-value of second point
     * @param th - (optional) overall thickness, default = 15% of length
     * @param hlr - (optional) head-to-length ration - how long is the head compared to the overall length, default = 0.2
     * @param btr - (optional) body-to-thickness ration, default = 0.5
     * @param clockwise - TODO
     */
    static arrow2(c: CanvasRenderingContext2D, x1: number, y1: number, x2: number, y2: number, th: number, hlr = 0.2, btr = 0.5, clockwise = true) {


        const b = (x2 - x1); // deltaX
        const a = (y2 - y1); // deltaY
        const len = Math.pow(Math.pow(a, 2) + Math.pow(b, 2), 0.5);

        th = (typeof th === 'undefined' || th === null) ? (len * 0.25) : (th * 0.5);

        // body thickness
        const bth = th * btr;
        // head thicknes
        const hth = th;
        // body length
        const blen = len * (1 - hlr);

        let rad = Math.atan2(a, b);
        if (rad < 0) {
            rad = (rad + 2 * Math.PI) % (2 * Math.PI);
        }

        const leftAngle = rad - (Math.PI / 2);
        const rightAngle = rad + (Math.PI / 2);

        const p = [];
        p[0] = { x: x1, y: y1 };

        // path from the start point to the arrow peak, going there from the left side
        p[1] = { x: Math.cos(leftAngle) * bth + p[0].x, y: Math.sin(leftAngle) * bth + p[0].y };
        p[2] = { x: p[1].x + Math.cos(rad) * blen, y: p[1].y + Math.sin(rad) * blen };
        p[3] = { x: p[2].x + Math.cos(leftAngle) * hth, y: p[2].y + Math.sin(leftAngle) * hth };

        p[4] = { x: x2, y: y2 }; // arrow peak

        // path from the start point to the arrow peak, going there from the right side
        p[7] = { x: Math.cos(rightAngle) * bth + p[0].x, y: Math.sin(rightAngle) * bth + p[0].y };
        p[6] = { x: p[7].x + Math.cos(rad) * blen, y: p[7].y + Math.sin(rad) * blen };
        p[5] = { x: p[6].x + Math.cos(rightAngle) * hth, y: p[6].y + Math.sin(rightAngle) * hth };

        c.moveTo(p[0].x, p[0].y);

        if (clockwise) {
            for (let i = 1; i < p.length; i++) {
                c.lineTo(p[i].x, p[i].y);
            }
        } else {
            for (let i = p.length - 1; i > 0; i--) {
                c.lineTo(p[i].x, p[i].y);
            }
        }

        c.lineTo(p[0].x, p[0].y);
    }

    /**
     * Draws a filled arrow. From the point (x1/y1) to the point (x2/y2) with a given thickness.
     * @param x1 x-value of first point
     * @param y1 y-value of first point
     * @param x2 x-value of second point
     * @param y2 y-value of second point
     * @param th - (optional) overall thickness, default = 15% of length
     * @param hlr - (optional) head-to-length ration - how long is the head compared to the overall length, default = 0.2
     * @param btr - (optional) body-to-thickness ration, default = 0.5
     */
    static fillArrow2(c: CanvasRenderingContext2D, x1: number, y1: number, x2: number, y2: number, th?: number, hlr?: number, btr?: number) {
        c.beginPath();
        XcCanvasHelper.arrow2(c, x1, y1, x2, y2, th, hlr, btr);
        c.fill();
    }

    /**
     * variety of arrow2
     */
    static arrow3(c: CanvasRenderingContext2D, x1: number, y1: number, x2: number, y2: number, th: number, hlr = 0.2, btr = 0.5, clockwise = true) {

        const b = (x2 - x1); // deltaX
        const a = (y2 - y1); // deltaY
        const len = Math.pow(Math.pow(a, 2) + Math.pow(b, 2), 0.5);

        th = typeof th === 'number' ? th : len * 0.15;

        // body thickness
        const bth = th * btr;
        // head thicknes
        const hth = th - bth;
        // body length
        const blen = len * (1 - hlr);

        let rad = Math.atan2(a, b);
        if (rad < 0) {
            rad = (rad + 2 * Math.PI) % (2 * Math.PI);
        }

        // const degree = rad * 180 / Math.PI;

        const leftAngle = rad - (Math.PI / 2);
        const rightAngle = rad + (Math.PI / 2);

        const p = [];
        p[0] = { x: x1, y: y1 };

        // path from the start point to the arrow peak, going there from the left side
        p[1] = { x: Math.cos(leftAngle) * bth + p[0].x, y: Math.sin(leftAngle) * bth + p[0].y };
        p[2] = { x: p[1].x + Math.cos(rad) * blen, y: p[1].y + Math.sin(rad) * blen };
        p[3] = { x: p[2].x + Math.cos(leftAngle) * hth, y: p[2].y + Math.sin(leftAngle) * hth };

        p[4] = { x: x2, y: y2 }; // arrow peak

        // path from the start point to the arrow peak, going there from the right side
        p[7] = { x: Math.cos(rightAngle) * bth + p[0].x, y: Math.sin(rightAngle) * bth + p[0].y };
        p[6] = { x: p[7].x + Math.cos(rad) * blen, y: p[7].y + Math.sin(rad) * blen };
        p[5] = { x: p[6].x + Math.cos(rightAngle) * hth, y: p[6].y + Math.sin(rightAngle) * hth };

        c.moveTo(p[0].x, p[0].y);

        if (clockwise) {
            for (let i = 1; i < p.length; i++) {
                c.lineTo(p[i].x, p[i].y);
            }
        } else {
            for (let i = p.length - 1; i > 0; i--) {
                c.lineTo(p[i].x, p[i].y);
            }
        }
        c.lineTo(p[0].x, p[0].y);
    }

    /**
     * Creates a rectangle path with the given values with various roundings at the corner and fills it.
     * @param x x-position of the rectangle
     * @param y y-position of the rectangle
     * @param width the width of the rectangle
     * @param height the height of the rectangle
     * @param rtl the rounding of the top-left edge
     * @param rtr the rounding of the top-right edge
     * @param rbr the rounding of the bottom-right edge
     * @param rbl the rounding of the bottom-left edge {undefined}
     */
    static variousRoundedRect(c: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, rtl: number, rtr = rtl, rbr = rtl, rbl = rtl) {

        c.moveTo(x + rtl, y); // behind top-left edge
        c.lineTo(x + width - rtr, y);
        c.bezierCurveTo(x + width, y, x + width, y + rtr, x + width, y + rtr); // top-right
        c.lineTo(x + width, y + height - rbr);
        c.bezierCurveTo(x + width, y + height, x + width - rbr, y + height, x + width - rbr, y + height);  // bottom-right
        c.lineTo(x + rbl, y + height);
        c.bezierCurveTo(x, y + height, x, y + height - rbl, x, y + height - rbl); // bottom-left
        c.lineTo(x, y + rtl);
        c.bezierCurveTo(x, y, x + rtl, y, x + rtl, y); // top-left

    }

    /**
     * Creates a rectangle path with the given values with various roundings at the corner and fills it.
     * @param x x-position of the rectangle
     * @param y y-position of the rectangle
     * @param width the width of the rectangle
     * @param height the height of the rectangle
     * @param rtl the rounding of the top-left edge
     * @param rtr the rounding of the top-right edge
     * @param rbr the rounding of the bottom-right edge
     * @param rbl the rounding of the bottom-left edge {undefined}
     */
    static fillVariousRoundedRect(c: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, rtl: number, rtr = rtl, rbr = rtl, rbl = rtl) {
        c.beginPath();
        XcCanvasHelper.variousRoundedRect(c, x, y, width, height, rtl, rtr, rbr, rbl);
        c.fill();
        c.closePath();
    }

    /**
     * Creates a rectangle path with the given values with various roundings at the edges and strokes the lines.
     * @param x x-position of the rectangle
     * @param y y-position of the rectangle
     * @param width the width of the rectangle
     * @param height the height of the rectangle
     * @param rtl the rounding of the top-left edge
     * @param rtr the rounding of the top-right edge
     * @param rbr the rounding of the bottom-right edge
     * @param rbl the rounding of the bottom-left edge {undefined}
     */
    static strokeVariousRoundedRect(c: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, rtl: number, rtr = rtl, rbr = rtl, rbl = rtl) {
        c.beginPath();
        XcCanvasHelper.variousRoundedRect(c, x, y, width, height, rtl, rtr, rbr, rbl);
        c.stroke();
        c.closePath();
    }

    /**
     * draws an image to a certain position, with a specified width and height and rounded corners.
     */
    static drawRoundedImage(c: CanvasRenderingContext2D, img: HTMLImageElement, x: number, y: number, w: number, h: number, r: number) {
        c.save();
        c.beginPath();
        c.moveTo(x + r, y); // behind top-left edge
        c.lineTo(x + img.width - r, y);
        c.bezierCurveTo(x + w, y, x + w, y + r, x + w, y + r); // top-right
        c.lineTo(x + w, y + w - r);
        c.bezierCurveTo(x + w, y + h, x + h - r, y + h, x + w - r, y + h);  // bottom-right
        c.lineTo(x + r, y + h);
        c.bezierCurveTo(x, y + h, x, y + h - r, x, y + h - r); // bottom-left
        c.lineTo(x, y + r);
        c.bezierCurveTo(x, y, x + r, y, x + r, y); // top-left
        c.closePath();

        c.clip();
        c.drawImage(img, x, y, w, h);
        c.restore();

        return { x, y, width: w, height: h };
    }

    static reliefRect(c: CanvasRenderingContext2D, x: number, y: number, width: number, height?: number, borderWidth?: number, borderColors?: string[]) {

        height = height || width * 0.2;
        borderWidth = borderWidth || height * 0.2;

        //#region - TODO - improve this by darkining the original fillColor (background color)
        if (!borderColors) {
            const basic = typeof c.fillStyle === 'string' ? c.fillStyle : '#fff';
            borderColors = [
                XcCanvasHelper.brightenColor(basic, -0.4),
                XcCanvasHelper.brightenColor(basic, -0.3),
                XcCanvasHelper.brightenColor(basic, -0.2),
                XcCanvasHelper.brightenColor(basic, -0.1)
            ];
        }

        borderColors[0] = borderColors[0] || '#333';
        borderColors[1] = borderColors[1] || '#555';
        borderColors[2] = borderColors[2] || '#777';
        borderColors[3] = borderColors[3] || '#999';
        //#endregion

        c.save();

        c.fillRect(x, y, width, height);

        // top border
        c.beginPath();
        c.moveTo(x, y);
        c.lineTo(x + width, y);
        c.lineTo(x + width - borderWidth, y + borderWidth);
        c.lineTo(x + borderWidth, y + borderWidth);
        c.closePath();
        c.fillStyle = borderColors[0];
        c.fill();

        // bottom right
        c.beginPath();
        c.moveTo(x + width, y);
        c.lineTo(x + width, y + height);
        c.lineTo(x + width - borderWidth, y + height - borderWidth);
        c.lineTo(x + width - borderWidth, y + borderWidth);
        c.closePath();
        c.fillStyle = borderColors[1];
        c.fill();

        // bottom border
        c.beginPath();
        c.moveTo(x, y + height);
        c.lineTo(x + width, y + height);
        c.lineTo(x + width - borderWidth, y + height - borderWidth);
        c.lineTo(x + borderWidth, y + height - borderWidth);
        c.closePath();
        c.fillStyle = borderColors[2];
        c.fill();

        // bottom left
        c.beginPath();
        c.moveTo(x, y);
        c.lineTo(x, y + height);
        c.lineTo(x + borderWidth, y + height - borderWidth);
        c.lineTo(x + borderWidth, y + borderWidth);
        c.closePath();
        c.fillStyle = borderColors[3];
        c.fill();

        c.restore();
    }

    static reliefCircle(c: CanvasRenderingContext2D, x: number, y: number, radius: number, centroid?: boolean, borderWidth?: number, borderColors?: string[]) {

        borderWidth = borderWidth || radius * 0.1;

        //#region - TODO - improve this by darkining the original fillColor (background color)
        if (!borderColors) {
            const basic = typeof c.fillStyle === 'string' ? c.fillStyle : '#fff';
            borderColors = [
                XcCanvasHelper.brightenColor(basic, -0.4),
                XcCanvasHelper.brightenColor(basic, -0.2)
            ];
        }

        borderColors[0] = borderColors[0] || '#333';
        borderColors[1] = borderColors[1] || '#555';
        //#endregion

        c.save();
        const originalColor = c.fillStyle;
        const gradient = c.createLinearGradient(x, 0, x + radius, 0);
        gradient.addColorStop(0, borderColors[0]);
        gradient.addColorStop(1, borderColors[1]);
        c.fillStyle = gradient;
        XcCanvasHelper.fillCircle(c, x, y, radius, !!centroid);
        c.fillStyle = originalColor;

        if (centroid) {
            XcCanvasHelper.fillCircle(c, x, y, radius - borderWidth, centroid);
        } else {
            XcCanvasHelper.fillCircle(c, x - borderWidth, y - borderWidth, radius - borderWidth, centroid);

        }
        c.restore();
    }

    /**
     * Fills a certain text like the text is written on a piece of paper,
     * pinned on the canvas. Spinning the paper would render a circle, whose centroid is given.
     * @param mx x-value of the centroid of the circle
     * @param my y-value of the centroid
     * @param text the text which will be rendered
     * @param degree [0-360] of which the paper will be spinned (0 and 360 means displayed as usual) {undefined}
     */
    static fillSpinnedText(c: CanvasRenderingContext2D, mx: number, my: number, text: string, degree: number) {
        c.save();

        // var textlen = c.measureText(text).width;

        const rad = degree * Math.PI / 180;

        c.textAlign = 'center';
        c.textBaseline = 'middle';

        c.translate(mx, my);
        c.rotate(rad);

        c.fillText(text, 0, 0);
        c.restore();
    }

    /**
     * Strokes a certain text like the text is written on a piece of paper,
     * pinned on  a cirlce on the canvas. Spinning the paper would render a circle, whose centroid is given.
     * @param mx x-value of the centroid of the circle
     * @param my y-value of the centroid
     * @param text the text which will be rendered
     * @param degree [0-360] of which the paper will be spinned (0 and 360 means displayed as usual) {undefined}
     */
    static strokeSpinnedText(c: CanvasRenderingContext2D, mx: number, my: number, text: string, degree: number) {
        c.save();

        // var textlen = c.measureText(text).width;

        const rad = degree * Math.PI / 180;

        c.textAlign = 'center';
        c.textBaseline = 'middle';

        c.translate(mx, my);
        c.rotate(rad);

        c.strokeText(text, 0, 0);
        c.restore();
    }

    /**
     * Draws a tooltip
     * @param text - text as a string
     * @param x - x coord
     * @param y - y coord
     * @param colorsFillStrokeText - optional: css color strings for [0] fillStyle for the backgroung, [1] strokeStyle for the border, [2] fillStyle for the text
     * @param padding - optional: padding between border and text
     */
    static drawTooltip(c: CanvasRenderingContext2D, text: string, x: number, y: number, colorsFillStrokeText?: string[], padding?: number): void {
        c.save();

        colorsFillStrokeText = colorsFillStrokeText || [];
        c.fillStyle = colorsFillStrokeText[0] || '#eee';
        c.strokeStyle = colorsFillStrokeText[1] || '#333';
        padding = typeof padding === 'number' ? padding : 3;

        const textWidth = c.measureText(text).width;
        const w = textWidth + padding * 2;
        const fontSize = XcCanvasHelper.getFontSize(c);
        const h = fontSize + padding * 2;
        c.fillRect(x, y, w, h);
        c.strokeRect(x, y, w, h);
        c.fillStyle = colorsFillStrokeText[2] || c.strokeStyle;
        c.textBaseline = 'top';
        c.fillText(text, x + padding, y + padding, w - padding * 2);

        c.restore();
    }

    static getImageFromHTMLElement(elem: HTMLElement): HTMLImageElement {

        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        const foreignElement = document.createElementNS('http://www.w3.org/2000/svg', 'foreignObject');
        svg.appendChild(foreignElement);

        document.body.appendChild(elem);

        const width = elem.clientWidth;
        const height = elem.clientHeight;

        document.body.removeChild(elem);

        elem.setAttribute('xmlns', 'http://www.w3.org/1999/xhtml');

        foreignElement.appendChild(elem);

        const xmlS = new XMLSerializer();
        let svgString = xmlS.serializeToString(svg);

        svgString = svgString.replace('<foreignObject', `<foreignObject x="0" y="0" width="${width}" height="${height}"`).replace(/\s+/g, ' ');

        const dataURI = 'data:image/svg+xml;charset=UTF-8,' + svgString;

        const img = document.createElement('img');
        img.width = width;
        img.height = height;
        img.src = dataURI;

        return img;
    }

    /**
     * creates tooltip by using css to customly style a div box, to which the css will be applied and then transformed into an image.
     * works because HTML can be rendered by SVG and SVG can be rendered by the canvas
     * @param text - text as a string
     * @param css - css rules as a string, like instyle css (needs to be in one line and no unnecessary whitespaces)
     */
    static getSVGTooltipImage(text: string, css?: string): HTMLImageElement {

        const div = document.createElement('div');
        if (css) {
            div.setAttribute('style', css);
        }
        div.appendChild(document.createTextNode(text));

        return XcCanvasHelper.getImageFromHTMLElement(div);
    }

    /**
     * draws a cross with two perpendicular stroked lines.
     * @param x - x of the center
     * @param y - y of the center
     * @param size - diagonal length
     */
    static drawCross(c: CanvasRenderingContext2D, x: number, y: number, size: number) {
        c.save();

        const s = size / 2;

        c.beginPath();
        // from top-left to bottom-right
        c.moveTo(x - s, y + s);
        c.lineTo(x + s, y - s);
        // from bottom-left to top-right
        c.moveTo(x - s, y - s);
        c.lineTo(x + s, y + s);

        c.stroke();
        c.restore();
    }

    /**
     * @see experimental
     * creates the path of two perpendicular rectangles
     * @param x - x of the center
     * @param y - y of the center
     * @param size - diagonal length
     * @param th - thickness of the rectangles {undefined}
     */
    static cross(c: CanvasRenderingContext2D, x: number, y: number, size: number, th?: number) {
        c.save();

        th = typeof th === 'number' ? th : Math.round(size / 5);

        const rad1 = (45) * Math.PI / 180;
        const rad2 = (90 + 180) * Math.PI / 180;

        c.translate(x, y);
        c.rotate(rad1);

        c.rect(-size / 2, -th / 2, size, th);
        c.rotate(rad2);

        c.rect(-size / 2, -th / 2, size, th);

        c.restore();
    }

    /**
     * Transforms a given color value and returns rgba values as a number array with values [0-255]
     * @param color css valid string
     */
    static getRGBAInformation(color: string): number[] {
        const can = document.createElement('canvas');
        can.width = 1;
        can.height = 1;
        const c = can.getContext('2d');
        c.fillStyle = color;
        c.fillRect(0, 0, 1, 1);
        const imageData = c.getImageData(0, 0, 1, 1).data;
        return [imageData[0], imageData[1], imageData[2], imageData[3]];
    }

    /**
     * Parse a given color string to its css rgba representation.
     * The alpha channel value can be overridden
     * @param color css valid color string
     * @param alpha number between 0 and 1
     */
    static getRGBA(color: string, alpha?: number): string {
        if (typeof color !== 'string') {
            return 'rgba(0,0,0,0)';
        }
        const imageData = XcCanvasHelper.getRGBAInformation(color);
        return 'rgba(' + imageData[0] + ',' + imageData[1] + ',' + imageData[2] + ',' + (typeof alpha === 'number' ? alpha : (imageData[3] / 255)) + ')';
    }

    /**
     * Brighten color about a certain factor
     * @param color css valid color string
     * @param factor number between -1 and 1
     */
    static brightenColor(color: string, factor = 0): string {
        if (typeof color !== 'string') {
            return 'rgba(0,0,0,0)';
        }

        const stayWithin = (num: number, min: number, max: number): number => Math.max(Math.min(num, max), min);

        const f = 255 * stayWithin(factor, -1, 1);

        const inf = XcCanvasHelper.getRGBAInformation(color);
        inf[0] = stayWithin(inf[0] + f, 0, 255);
        inf[1] = stayWithin(inf[1] + f, 0, 255);
        inf[2] = stayWithin(inf[2] + f, 0, 255);
        return 'rgba(' + inf[0] + ',' + inf[1] + ',' + inf[2] + ',' + (inf[3] / 255) + ')';
    }

    /**
     * Sets the font size.
     * Note: the canvas will calculate every css font-size to pixel
     * @param val - css font-size
     */
    static setFontSize(c: CanvasRenderingContext2D, val: number | string) {
        val = typeof val === 'number' ? val + 'px' : val;
        c.font = c.font.replace(new RegExp('[0-9]+[.]?[0-9]?px'), val);
    }

    /**
     * gets the font-size in pixel
     */
    static getFontSize(c: CanvasRenderingContext2D): number {
        const regEx = new RegExp('([0-9]+[.]?[0-9]?)px');
        const result = regEx.exec(c.font);
        return parseFloat(result[1]);
    }

    /**
     * Sets the styles (fill and stroke) to given color (css color name/hex code/rgb/rgba)
     * with an added alpha value.
     * Function can also be used to quickly change the alpha canal of the already set color
     * @param color (css color name/hex code/rgb/rgba)
     * @param alpha [0-1]
     * @param fill will set this style if undefined or true
     * @param stroke will set this style if undefined or true
     */
    static setStyle(c: CanvasRenderingContext2D, color: string, alpha = 1, fill = true, stroke = true): string {
        if (typeof fill === 'undefined') {
            fill = true;
        }
        if (typeof stroke === 'undefined') {
            stroke = true;
        }

        const rgbaCode = XcCanvasHelper.getRGBA(color, alpha);
        if (fill) {
            c.fillStyle = rgbaCode;
        }
        if (stroke) {
            c.strokeStyle = rgbaCode;
        }
        return rgbaCode;
    }

    /*! Curve extension for canvas 2.2
    *   Epistemex (c) 2013-2014
        License: MIT
    */
    /**
     * Draws a cardinal spline through given point array. Points must be arranged
     * as: [x1, y1, x2, y2, ..., xn, yn]. It adds the points to the current path.
     *
     * The method continues previous path of the context. If you don't want that
     * then you need to use moveTo() with the first point from the input array.
     *
     * The points for the cardinal spline are returned as a new array.
     *
     * @param points - point array
     * @param tension. Typically between [0.0, 1.0] but can be exceeded
     * @param numOfSeg - number of segments between two points (line resolution)
     * @param close - Close the ends making the line continuous
     * @returns New array with the calculated points that was added to the path
     */
    static curve(c: CanvasRenderingContext2D, points: number[], tension = 0.5, numOfSeg = 20, close = false) {
        XcCanvasHelper.strokeCurvePoints(c, XcCanvasHelper.getCurvePoints(points, tension, numOfSeg, close));
    }

    static getCurvePoints(points: number[], tension = 0.5, numOfSeg = 20, close = false): number[] {

        let pts: number[]; // clone point array
        const res: number[] = [];
        const l = points.length;
        let i: number;
        const cache = new Float32Array((numOfSeg + 2) * 4);
        let cachePtr = 4;

        pts = points.slice(0);

        if (close) {
            pts.unshift(points[l - 1]); // insert end point as first point
            pts.unshift(points[l - 2]);
            pts.push(points[0], points[1]); // first point as last point
        } else {
            pts.unshift(points[1]); // copy 1. point and insert at beginning
            pts.unshift(points[0]);
            pts.push(points[l - 2], points[l - 1]); // duplicate end-points
        }

        // cache inner-loop calculations as they are based on t alone
        cache[0] = 1;

        for (i = 1; i < numOfSeg; i++) {

            const st = i / numOfSeg;
            const st2 = st * st;
            const st3 = st2 * st;
            const st23 = st3 * 2;
            const st32 = st2 * 3;

            cache[cachePtr++] = st23 - st32 + 1;    // c1
            cache[cachePtr++] = st32 - st23;        // c2
            cache[cachePtr++] = st3 - 2 * st2 + st; // c3
            cache[cachePtr++] = st3 - st2;          // c4
        }

        cache[++cachePtr] = 1;

         
        const parse = (pts: number[], cache: Float32Array, l: number) => {

            for (let j = 2; j < l; j += 2) {

                const pt1 = pts[j];
                const pt2 = pts[j + 1];
                const pt3 = pts[j + 2];
                const pt4 = pts[j + 3];

                const t1x = (pt3 - pts[j - 2]) * tension;
                const t1y = (pt4 - pts[j - 1]) * tension;
                const t2x = (pts[j + 4] - pt1) * tension;
                const t2y = (pts[j + 5] - pt2) * tension;

                for (let t = 0; t <= numOfSeg; t++) {

                    const ca = t * 4;

                    res.push(cache[ca] * pt1 + cache[ca + 1] * pt3 + cache[ca + 2] * t1x + cache[ca + 3] * t2x,
                        cache[ca] * pt2 + cache[ca + 1] * pt4 + cache[ca + 2] * t1y + cache[ca + 3] * t2y);
                }
            }
        };

        // calc. points
        parse(pts, cache, l);

        if (close) {
            // l = points.length;
            pts = [];
            pts.push(points[l - 4], points[l - 3], points[l - 2], points[l - 1]); // second last and last
            pts.push(points[0], points[1], points[2], points[3]); // first and second
            parse(pts, cache, 4);
        }

        return res;
    }

    static strokeCurvePoints(c: CanvasRenderingContext2D, curvePoints: number[]) {

        let i: number;
        const len = curvePoints.length;

        for (i = 0; i < len; i += 2) {
            c.lineTo(curvePoints[i], curvePoints[i + 1]);
        }
    }

    static createScreenshot(canvas: HTMLCanvasElement): { data: string; timestamp: number } {
        // type: string ['image/png' | 'image/jpeg', 'image/webp'] - default is 'image/png'
        // quality: number [0 - 1] - only regarded if type is jpeq or webp - default is 0.92
        return { data: canvas.toDataURL(), timestamp: Date.now() };
    }

    static downloadScreenshot(screenshot: { data: string; timestamp: number }, filename: string) {
        filename = filename || 'record_' + screenshot.timestamp + '.mp4';
        XcCanvasHelper.downloadFile(screenshot.data, filename);
    }

    static printScreenshot(screenshot: { data: string; timestamp: number }) {

        const thisDoc = document;
        const iframe = thisDoc.createElement('iframe');
        iframe.onload = (e: Event) => {
            const doc = iframe.contentDocument;
            doc.write(`<body><img src="${screenshot.data}" onload="window.print()"</body>`);
            window.setTimeout(() => {
                thisDoc.body.removeChild(iframe);
            }, 1000);
        };
        document.body.appendChild(iframe);
    }

    static startRecording(canvas: HTMLCanvasElement): CanvasHelperRecording {
        const recording = new CanvasHelperRecording(canvas);
        recording.start();
        return recording;
    }

    static downloadRecording(recording: CanvasHelperRecording) {
        const s = recording.readyChanged.subscribe(r => {
            if (r) {
                XcCanvasHelper.downloadFile(recording.file, recording.filename);
                s.unsubscribe();
            }
        });
    }

    private static downloadFile(file: Blob | string, filename?: string) {
        const a = document.createElement('a');
        a.download = filename || 'download_' + Date.now() + '.bin';
        const url = typeof file === 'string' ? file : window.URL.createObjectURL(file);
        a.href = url;

        const event = document.createEvent('MouseEvent');
        event.initEvent('click');
        a.dispatchEvent(event);

        window.URL.revokeObjectURL(url);
    }

}
