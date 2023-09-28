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
const SVG_NS = 'http://www.w3.org/2000/svg';


/**
* Creates an element of a certain tag name
* @param parent Parent element
* @param name Name of the element
* @returns SVG element
*/
export function createSVGElement(parent: Element | undefined, name: string): SVGElement {
    const element = document.createElementNS(SVG_NS, name);
    if (parent) {
        parent.appendChild(element);
    }
    return element;
}


/**
* Creates an empty group
* @param parent Parent element
* @returns SVG group element
*/
export function createSVGGroup(parent: Element | undefined): SVGElement {
    return createSVGElement(parent, 'g');
}


/**
* Sets the position of an element as attributes
* @param element Element
* @param x X coordinate
* @param y Y coordinate
*/
export function setPosition(element: SVGElement, x: number, y: number) {
    element.setAttribute('x', `${x}`);
    element.setAttribute('y', `${y}`);
}


/**
* Sets the size of an element as attributes
* @param element Element
* @param w Width
* @param h Height
*/
export function setSize(element: SVGElement, w: number, h: number) {
    element.setAttribute('width', `${Math.max(w, 0)}`);
    element.setAttribute('height', `${Math.max(h, 0)}`);
}

/**
* Sets the transform attribute of an element
* @param element Element
* @param value Value of the transform attribute
* @returns Element for chaining
*/
export function setTransformValue<T extends HTMLElement | SVGElement>(element: T, value: string): T {
    element.style.transform = value;
    return element;
}


/**
* Sets the transform attribute of an element
* @param element Element
* @param x X translation value
* @param y Y translation value
* @param s Uniform scale value
* @returns Element for chaining
*/
export function setTransform<T extends HTMLElement | SVGElement>(element: T, x: number, y: number, s: number): T {
    return setTransformValue(element, 'translate(' + x + 'px, ' + y + 'px) scale(' + s + ')');
}


/**
* Sets the transform attribute of an element
* @param element - Element
* @param x X translation value
* @param y Y translation value
* @param sx X scale value
* @returns Element for chaining
*/
export function setScaleXTransform<T extends HTMLElement | SVGElement>(element: T, x: number, y: number, sx: number): T {
    return setTransformValue(element, 'translate(' + x + 'px, ' + y + 'px) scaleX(' + sx + ')');
}


/**
* Sets the transform attribute of an element
* @param element - Element
* @param x X translation value
* @param y Y translation value
* @param sy Y scale value
* @returns Element for chaining
*/
export function setScaleYTransform<T extends HTMLElement | SVGElement>(element: T, x: number, y: number, sy: number): T {
    return setTransformValue(element, 'translate(' + x + 'px, ' + y + 'px) scaleY(' + sy + ')');
}


/**
* Sets the transform attribute of an element to identity
* @param element Element
* @returns Element for chaining
*/
export function setIdentityTransform<T extends HTMLElement | SVGElement>(element: T): T {
    return setTransform(element, 0, 0, 1);
}


/**
* Sets the transform attribute of an element via a 3x2 column matrix
* / x0  y0  t0 \
* \ x1  y1  t1 /
* @param element Element
* @param m Matrix array containing exactly 6 entries
* @returns Element for chaining
*/
export function setMatrixArrayTransform<T extends HTMLElement | SVGElement>(element: T, m: number[]): T {
    return setTransformValue(element, 'matrix(' + m.join(',') + ')');
}


/**
* Sets the transform attribute of an element via a 3x2 column matrix
* / x0  y0  t0 \
* \ x1  y1  t1 /
* @param element Element
* @param x0 x0
* @param x1 x1
* @param y0 y0
* @param y1 y1
* @param t0 t0
* @param t1 t1
* @returns Element for chaining
*/
export function setMatrixTransform<T extends HTMLElement | SVGElement>(element: T, x0: number, x1: number, y0: number, y1: number, t0: number, t1: number): T {
    return setMatrixArrayTransform(element, [x0, x1, y0, y1, t0, t1]);
}


/**
* Sets the HRef attribute of an element
* @param element Element
* @param href HRef
*/
export function setHRef(element: Element, href: string) {
    element.setAttributeNS('http://www.w3.org/1999/xlink', 'href', href);
}


/**
* Creates a pie chart
* @param parent Parent element
* @param x Center x coordinate
* @param y Center y coordinate
* @param r Radius
* @param off Initial offset angle in radians
* @param radians Angles of the slices in radians between [0..2PI]
* @param userAttributeName Common attribute name for the attribute values
* @param userAttributeValues Attribute values of the slices in the dom
* @returns SVG group element
*/
export function createSVGPieChart(parent: Element | undefined, x: number, y: number, r: number, off: number, radians: number[], userAttributeName?: string, userAttributeValues: string[] = []): SVGElement {
    const element = createSVGGroup(parent);
    let start = off;
    let end: number;
    for (let i = 0; i < radians.length; i++) {
        end = start + radians[i];
        const x1 = x + (r * Math.cos(start));
        const y1 = y + (r * Math.sin(start));
        const x2 = x + (r * Math.cos(end));
        const y2 = y + (r * Math.sin(end));
        const laf = radians[i] < Math.PI ? 0 : 1;
        const path = createSVGElement(element, 'path');
        path.setAttribute('d', 'M' + x + ',' + y + '  L' + x1 + ',' + y1 + '  A' + r + ',' + r + ' 0 ' + laf + ',1 ' + x2 + ',' + y2 + ' z');
        if (userAttributeName) {
            path.setAttribute(userAttributeName, userAttributeValues[i % userAttributeValues.length]);
        }
        start = end;
    }
    return element;
}


/**
* Creates a rectangle path with individually rounded corners
* @param parent Parent element
* @param x Top left corner x coordinate
* @param y Top left corner y coordinate
* @param w Rectangle width
* @param h Rectangle height
* @param tl Top left corner radius
* @param tr Top right corner radius
* @param bl Bottom left corner radius
* @param br Bottom right corner radius
* @param color Fill color (optional)
* @returns SVG path element
*/
export function createSVGRoundRectPath(parent: Element | undefined, x: number, y: number, w: number, h: number, tl: number, tr: number, bl: number, br: number, color?: string): SVGElement {
    function p(_x: number, _y: number): string {
        return _x + ',' + _y + ' ';
    }
    const xw = x + w;
    const yh = y + h;
    let d = 'M' + p(x + tl, y);
    d += 'L' + p(xw - tr, y)  + 'Q' + p(xw, y)  + p(xw, y + tr);
    d += 'L' + p(xw, yh - br) + 'Q' + p(xw, yh) + p(xw - br, yh);
    d += 'L' + p(x + bl, yh)  + 'Q' + p(x, yh)  + p(x, yh - bl);
    d += 'L' + p(x, y + tl)   + 'Q' + p(x, y)   + p(x + tl, y);
    d += 'Z';
    const path = createSVGElement(parent, 'path');
    path.setAttribute('d', d);
    if (color) {
        path.setAttribute('fill', color);
    }
    return path;
}


/**
* Creates a rectangle with optionally rounded corners
* @param parent Parent element
* @param x Top left corner x coordinate
* @param y Top left corner y coordinate
* @param w Rectangle width
* @param h Rectangle height
* @param r Corner radius (optional)
* @param color Fill color (optional)
* @returns SVG rect element
*/
export function createSVGRoundRect(parent: Element | undefined, x: number, y: number, w: number, h: number, r?: number, color?: string): SVGElement {
    const rect = createSVGElement(parent, 'rect');
    setPosition(rect, x, y);
    setSize(rect, w, h);
    if (r) {
        rect.setAttribute('rx', `${r}`);
        rect.setAttribute('ry', `${r}`);
    }
    if (color) {
        rect.setAttribute('fill', color);
    }
    return rect;
}


/**
* Creates a rectangle
* @param parent Parent element
* @param x Top left corner x coordinate
* @param y Top left corner y coordinate
* @param w Rectangle width
* @param h Rectangle height
* @param color Fill color (optional)
* @returns SVG rect element
*/
export function createSVGRect(parent: Element | undefined, x: number, y: number, w: number, h: number, color?: string): SVGElement {
    return createSVGRoundRect(parent, x, y, w, h, undefined, color);
}


/**
* Creates a circle
* @param parent Parent element
* @param cx Center x coordinate
* @param cy Center y coordinate
* @param r Circle radius
* @param color Fill color (optional)
* @returns SVG rect element
*/
export function createSVGCircle(parent: Element | undefined, cx: number, cy: number, r: number, color?: string): SVGElement {
    const circle = createSVGElement(parent, 'circle');
    circle.setAttribute('cx', `${cx}`);
    circle.setAttribute('cy', `${cy}`);
    circle.setAttribute('r', `${r}`);
    if (color) {
        circle.setAttribute('fill', color);
    }
    return circle;
}


/**
* Creates a rectangle with optionally rounded corners
* @param parent Parent element
* @param x1 Start point x coordinate
* @param y1 Start point y coordinate
* @param x2 End point x coordinate
* @param y2 End point y coordinate
* @param width Stroke width (optional)
* @param color Stroke color (optional)
* @returns SVG line element
*/
export function createSVGLine(parent: Element | undefined, x1: number, y1: number, x2: number, y2: number, width?: number, color?: string): SVGElement {
    const line = createSVGElement(parent, 'line');
    line.setAttribute('x1', `${x1}`);
    line.setAttribute('y1', `${y1}`);
    line.setAttribute('x2', `${x2}`);
    line.setAttribute('y2', `${y2}`);
    if (width) {
        line.setAttribute('stroke-width', `${width}`);
    }
    if (color) {
        line.setAttribute('stroke', color);
    }
    return line;
}


/**
* Creates a cubic bezier path
* @param parent Parent element
* @param x1 First end point x coordinate
* @param y1 First end point y coordinate
* @param cx1 First control point x coordinate
* @param cy1 First control point y coordinate
* @param cx2 Second control point x coordinate
* @param cy2 Second control point y coordinate
* @param x2 Second end point x coordinate
* @param y2 Second end point y coordinate
* @param width Stroke width (optional)
* @param color Stroke color (optional)
* @param path Path to change (optional). If not set, creates a new path
* @returns SVG path element
*/
export function createSVGCubicBezierPath(parent: Element | undefined, x1: number, y1: number, cx1: number, cy1: number, cx2: number, cy2: number, x2: number, y2: number, width?: number, color?: string, path?: SVGElement): SVGElement {
    function p(_x: number, _y: number): string {
        return _x + ',' + _y + ' ';
    }

    const d = 'M' + p(x1, y1) + 'C' + p(cx1, cy1) + p(cx2, cy2) + p(x2, y2);
    path ??= createSVGElement(parent, 'path');
    path.setAttribute('d', d);
    if (width) {
        path.setAttribute('stroke-width', `${width}`);
    }
    if (color) {
        path.setAttribute('stroke', color);
    }
    return path;
}


/**
* Creates a horizontal cubic bezier path (N-like)
* @param parent Parent element
* @param x1 First end point x coordinate
* @param y1 First end point y coordinate
* @param x2 Second end point x coordinate
* @param y2 Second end point y coordinate
* @param minD Minimum vertical distance between control and end points
* @param width Stroke width (optional)
* @param color Stroke color (optional)
* @param path Path to change (optional). If not set, creates a new path
* @returns SVG path element
*/
export function createSVGHorizontalCubicBezierPath(parent: Element | undefined, x1: number, y1: number, x2: number, y2: number, minD: number, width?: number, color?: string, path?: SVGElement): SVGElement {
    const d = Math.max(minD, Math.abs(y1 - y2) / 2);
    return createSVGCubicBezierPath(parent, x1, y1, x1, y1 - d, x2, y2 + d, x2, y2, width, color, path);
}


/**
* Creates a horizontal cubic bezier path (S-like)
* @param parent Parent element
* @param x1 First end point x coordinate
* @param y1 First end point y coordinate
* @param x2 Second end point x coordinate
* @param y2 Second end point y coordinate
* @param minD Minimum vertical distance between control and end points
* @param width Stroke width (optional)
* @param color Stroke color (optional)
* @param path Path to change (optional). If not set, creates a new path
* @returns SVG path element
*/
export function createSVGVerticalCubicBezierPath(parent: Element | undefined, x1: number, y1: number, x2: number, y2: number, minD: number, width?: number, color?: string, path?: SVGElement): SVGElement {
    const d = Math.max(minD, Math.abs(y1 - y2) / 2);
    return createSVGCubicBezierPath(parent, x1, y1, x1 - d, y1, x2 + d, y2, x2, y2, width, color, path);
}


/**
* Creates a text
* @param parent Parent element
* @param x Anchor reference x coordinate
* @param y Anchor reference y coordinate
* @param content Text content
* @param size Font size
* @param anchor Anchor (alignment) of the text
* @param color Text color (optional)
* @returns SVG text element
*/
export function createSVGText(parent: Element | undefined, x: number, y: number, content: string, size: number, anchor: string, color?: string): SVGElement {
    const element = createSVGElement(parent, 'text');
    setPosition(element, x, y);
    element.textContent = content;
    element.setAttribute('font-size', `${size}`);
    element.setAttribute('text-anchor', anchor);
    if (color) {
        element.setAttribute('fill', color);
    }
    return element;
}


/**
* Creates a use
* @param parent Parent element
* @param href HRef
* @returns SVG use element
*/
export function createSVGUse(parent: Element | undefined, href: string): SVGElement {
    const element = createSVGElement(parent, 'use');
    setHRef(element, href);
    return element;
}


/**
 * Definition of a linear gradient which can be used within any svg shape
 */
export interface SVGLinearGradientStop {

    /** Percentage value, e.g. '25%' */
    offset: string;

    /** Color string value, e.g. '#00dbff' or 'rgb(255, 0, 0)' */
    color: string;
}


/**
* Creates a linear gradient stop object
* @param offset Offset between 0 and 1
* @param color Color
* @returns SVG linear gradient stop object
*/
export function createSVGLinearGradientStop(offset: number, color: string): SVGLinearGradientStop {
    return {offset: (100 * offset).toFixed(2) + '%', color: color};
}


/**
* Creates a linear gradient
* @param parent Parent element
* @param id Id
* @param stops Array containing objects with offset and color fields
* @returns SVG linear gradient element
*/
export function createSVGLinearGradient(parent: Element | undefined, id: string, stops: SVGLinearGradientStop[]): SVGElement {
    const element = createSVGElement(parent, 'linearGradient');
    element.setAttribute('id', id);
    element.setAttribute('x2', '0%');
    element.setAttribute('y2', '100%');
    for (const stop of stops) {
        const stopElement = createSVGElement(element, 'stop');
        stopElement.setAttribute('offset', stop.offset);
        stopElement.setAttribute('stop-color', stop.color);
    }
    return element;
}


/**
* Creates a sharp linear gradient
*
* offset:  25% color: #F00  |
* offset:  50% color: #0F0  |
* offset:  75% color: #00F  |
* offset: 100% color: #FFF  |  offset:  50% color: #0F0
*                           |
* -->                       |  -->
*                           |
* offset:  25% color: #F00  |  offset:  50% color: #0F0
* offset:  25% color: #0F0  |
* offset:  50% color: #0F0  |
* offset:  50% color: #00F  |
* offset:  75% color: #00F  |
* offset:  75% color: #FFF  |
*
* @param parent Parent element
* @param id Id
* @param stops Array containing objects with offset and color fields
* @returns SVG linear gradient element
*/
export function createSVGLinearGradientSharp(parent: Element | undefined, id: string, stops: SVGLinearGradientStop[]): SVGElement {
    const sharpStops = [];
    const len = stops.length;
    for (let i = 0; i < len - 1; i++) {
        const cur = stops[i];
        const next = stops[i + 1];
        sharpStops.push(cur);
        sharpStops.push({offset: cur.offset, color: next.color});
    }
    if (len === 1) {
        sharpStops.push(stops[0]);
    }
    return createSVGLinearGradient(parent, id, sharpStops);
}


/**
* Creates an image
* @param parent Parent element
* @param x Top left corner x coordinate
* @param y Top left corner y coordinate
* @param w Image width
* @param h Image height
* @param href HRef
* @returns SVG image element
*/
export function createSVGImage(parent: Element | undefined, x: number, y: number, w: number, h: number, href: string): SVGElement {
    const element = createSVGElement(parent, 'image');
    setPosition(element, x, y);
    setSize(element, w, h);
    setHRef(element, href);
    return element;
}


/**
* Removes all children from the given element
* @param element Element
*/
export function removeAllChildren(element: Element) {
    while (element.lastChild) {
        element.removeChild(element.lastChild);
    }
}
