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
import { from, Observable, Subject } from 'rxjs';
import { switchMap } from 'rxjs/operators';


export type Native = number | string | boolean;
export type NativeArray = Array<number> | Array<string> | Array<boolean>;

export type TypeFilterOut<T, U> = T extends U ? never : T;
export type TypePropertiesOf<T, U> = {[K in keyof T]: T[K] extends U ? K : never}[keyof T];

export type Constructor<T = any> = new (...args: any[]) => T;

export const NOP = () => {};

export const CACHE = Symbol();
export type CachedFunction<T> = (() => T) & {[CACHE]: T};


/**
 * Extend the comparable class to enable instances to be compared to each other
 */
export abstract class Comparable {

    /**
     * Returns the unique key which is used to compare this object with other objects.
     * Must be overridden by subclasses in order to enable the equals functionality.
     *
     * @returns Unique key
     */
    get uniqueKey(): string {
        return '';
    }

    /**
     * Returns whether this object equals another object
     *
     * @param that Object to compare this object to
     * @returns TRUE, if this object equals the other object, FALSE otherwise
     */
    equals(that: this): boolean {
        let uniqueKey: string;
        return !!(that && (uniqueKey = that.uniqueKey)) && uniqueKey === this.uniqueKey;
    }
}


export function uniquify<T>(array: T[], serializer: (value: T) => string): T[] {
    const map = new Map<string, T>();
    array.forEach(value => map.set(serializer(value), value));
    return Array.from(map.values());
}


export function templateClassType<T>(clazz: Function) {
    return {
        clazz,
        as: (instance: any) => <T>instance,
        of: (instance: any) => instance instanceof clazz
    };
}


export function defineAccessorProperty<T, R>(
    instance: T,
    propertyName: keyof T,
    get?: ()         => R,
    set?: (value: R) => void
): R {
    const propertyDescriptor = Object.getOwnPropertyDescriptor(instance, propertyName);
    if (!propertyDescriptor || (!propertyDescriptor.get && !propertyDescriptor.set)) {
        Object.defineProperty(instance, propertyName, {
            enumerable: true,
            get: get || undefined,
            set: set || undefined
        });
        return get?.();
    }
    return propertyDescriptor.get?.() ?? propertyDescriptor.value;
}


/**
 * Returns a repeated string
 * @param string String to repeat
 * @param count Number of repetitions
 * @returns Repeated string
 */
export function repeat(string: string, count: number): string {
    return Array.prototype.join.call({length: count + 1}, string);
}


/**
 * Prepends characters to a string until its length equals the given length
 * @param string String being prepended
 * @param char Character to prepend with
 * @param length New length of the string
 * @returns Prepended string
 */
export function prepend(string: string, char: string, length: number): string {
    return repeat(char[0], length - string.length) + string;
}


/**
 * Appends characters to a string until its length equals the given length
 * @param string String being appended
 * @param char Character to append with
 * @param length New length of the string
 * @returns Appended string
 */
export function append(string: string, char: string, length: number): string {
    return string + repeat(char[0], length - string.length);
}


/**
 * Removes space characters around the string
 * @param string String
 * @returns Trimmed string
 */
export function trim(string: string): string {
    return string.replace(/^\s+|\s+$/g, '');
}


/**
 * Removes space characters within and around the string
 * @param string String
 * @returns Condensed string
 */
export function condense(string: string): string {
    return string.replace(/\s+/g, '');
}


/**
 * Returns whether a string starts with a sub string. If the sub string is empty, FALSE is returned.
 * @param string String
 * @param substring Sub string
 * @returns TRUE, if the string starts with the sub string, FALSE otherwise
 */
export function startsWith(string: string, substring: string): boolean {
    return substring.length > 0 && string.slice(0, substring.length) === substring;
}


/**
 * Returns whether a string ends with a sub string. If the sub string is empty, FALSE is returned.
 * @param string String
 * @param substring Sub string
 * @returns TRUE, if the string ends with the sub string, FALSE otherwise
 */
export function endsWith(string: string, substring: string): boolean {
    return substring.length > 0 && string.slice(-substring.length) === substring;
}


/**
 * Returns the number of digits of a given value
 * @see https://stackoverflow.com/a/28203456
 * @param value Value
 * @returns Number of digits
 */
export function digits(value: number): number {
    // eslint-disable-next-line no-bitwise
    return (Math.log10((value ^ (value >> 31)) - (value >> 31)) | 0) + 1;
}


/**
 * Returns the integer value of a floating point value, if it's close enough (compensating errors due to loss of precision)
 * @param value Floating point value
 * @returns Integer value, if given value is close enough, otherwise given value is returned as-is
 */
export function fpint(value: number): number {
    const round = Math.round(value);
    return Math.abs(value - round) < 0.0000001
        ? round
        : value;
}


/**
 * Clamps a value to a given range
 * @param value Value to clamp
 * @param min   Lower bound, inclusive
 * @param max   Upper bound, inclusive
 * @returns Clamped value
 */
export function clamp(value: number, min: number, max: number): number {
    if (value <= min) {
        return min;
    }
    if (value >= max) {
        return max;
    }
    return value;
}


/**
 * Reduces a value to the previous multiple of a base
 * @param value Value to reduce
 * @param base  Base to reduce to
 * @returns Truncated value or value, if it's already a multiple of base
 */
export function floorBase(value: number, base: number): number {
    return Math.floor(value / base) * base;
}


/**
 * Increases a value to the next multiple of a base
 * @param value Value to increase
 * @param base  Base to increase to
 * @returns Increased value or value, if it's already a multiple of base
 */
export function ceilBase(value: number, base: number): number {
    return Math.ceil(value / base) * base;
}


/**
 * Returns the multiplicity of a given factor in a value
 * @param value  Value containing a multiplicity of the factor
 * @param factor Factor to get multiplicity of (does not need to be a prime factor)
 * @returns Multiplicity or 0, if the factor does not divide the value
 */
export function factorMultiplicity(value: number, factor: number): number {
    let num = 0;
    while (value % factor === 0) {
        value /= factor;
        num++;
    }
    return num;
}


/**
 * Returns the highest power of two less than or equal to a value
 * @param value Value
 * @returns Previous power of two or 0, if value is 0
 */
export function prevPow2(value: number): number {
    /* eslint-disable no-bitwise */
    value |= (value >> 1);
    value |= (value >> 2);
    value |= (value >> 4);
    value |= (value >> 8);
    value |= (value >> 16);
    return value - (value >> 1);
    /* eslint-enable no-bitwise */
}


/**
 * Returns the lowest power of two greater than or equal to a value
 * @param value Value
 * @returns Next power of two or 0, if value is 0
 */
export function nextPow2(value: number): number {
    /* eslint-disable no-bitwise */
    value--;
    value |= value >> 1;
    value |= value >> 2;
    value |= value >> 4;
    value |= value >> 8;
    value |= value >> 16;
    return value + 1;
    /* eslint-enable no-bitwise */
}


/**
 * Returns the log base two of a value as the position of its highest set bit.
 * Computing the power of two of the result, yields a value equal to or lower than the input value.
 * @param value Value
 * @return log2(v) or 0, if value is 0
 */
export function log2(value: number): number {
    let result = 0;
    // eslint-disable-next-line no-bitwise
    while ((value >>= 1)) {
        result++;
    }
    return result;
}


/**
 * Returns the amount of milliseconds within the given seconds
 * @param value Seconds
 * @return Milliseconds
 */
export function seconds(value: number) {
    return value * 1000;
}


/**
 * Returns the amount of milliseconds within the given minutes
 * @param value Minutes
 * @return Milliseconds
 */
export function minutes(value: number) {
    return seconds(value) * 60;
}


/**
 * Returns the amount of milliseconds within the given hours
 * @param value Hours
 * @return Milliseconds
 */
export function hours(value: number) {
    return minutes(value) * 60;
}


/**
 * Returns the amount of milliseconds within the given days
 * @param value Days
 * @return Milliseconds
 */
export function days(value: number) {
    return hours(value) * 24;
}


/**
 * Returns the local timezone offset as it is under standard time.
 * For example, the timezone GMT+0100 always returns -60, even under daylight saving time, when it would be GMT+0200.
 * @return Timezone offset in minutes
 */
export function timezoneOffsetSTD(): number {
    const fn = <CachedFunction<number>>timezoneOffsetSTD;
    return fn[CACHE] ?? (fn[CACHE] = Math.max(...[0, 6].map(v => new Date(99, v, 1).getTimezoneOffset())));
}


/**
 * Returns whether a given date is under daylight saving time in the local timezone
 * @param timestamp Timestamp of date to check, whether it is under daylight saving time (with current date as a fallback)
 * @return TRUE, if date is under daylight saving time, FALSE otherwise
 */
export function timezoneDST(timestamp?: number): boolean {
    return (new (<Constructor<Date>>Date)(...arguments)).getTimezoneOffset() < timezoneOffsetSTD();
}


/**
 * Options used for converting time and date into strings
 */
export interface DateTimeFormatOptions {
    leadingZeroes: boolean;
    convertToUTC?: boolean;
}


/**
 * Returns a time string for a time value in a custom format
 * @param timestamp Time in milliseconds since epoch
 * @param format Format string using 'hh', 'mm', 'ss' and 'msec' as placeholders
 * @param options Formatting options
 * @returns Formatted time string
 */
export function timeString(timestamp: number, format: string, options: DateTimeFormatOptions = {leadingZeroes: true, convertToUTC: false}): string {
    const date = new Date(timestamp);
    let hh = String(options.convertToUTC ? date.getUTCHours() : date.getHours());
    let mm = String(options.convertToUTC ? date.getUTCMinutes() : date.getMinutes());
    let ss = String(options.convertToUTC ? date.getUTCSeconds() : date.getSeconds());
    let msec = String(options.convertToUTC ? date.getUTCMilliseconds() : date.getMilliseconds());
    if (options.leadingZeroes) {
        const zero = String(0);
        hh = prepend(hh, zero, 2);
        mm = prepend(mm, zero, 2);
        ss = prepend(ss, zero, 2);
        msec = prepend(msec, zero, 3);
    }
    return format.replace('hh', hh).replace('mm', mm).replace('ss', ss).replace('msec', msec);
}


/**
 * Returns a date string for a time value in a custom format
 * @param timestamp Time in milliseconds since epoch
 * @param format Format string using 'yyyy', 'mm' and 'dd' as placeholders
 * @param options Formatting options
 * @returns Formatted date string
 */
export function dateString(timestamp: number, format: string, options: DateTimeFormatOptions = {leadingZeroes: true, convertToUTC: false}): string {
    const date = new Date(timestamp);
    let mm = String(options.convertToUTC ? date.getUTCMonth() + 1 : date.getMonth() + 1);
    let dd = String(options.convertToUTC ? date.getUTCDate() : date.getDate());
    const yyyy = String(options.convertToUTC ? date.getUTCFullYear() : date.getFullYear());
    if (options.leadingZeroes) {
        const zero = String(0);
        mm = prepend(mm, zero, 2);
        dd = prepend(dd, zero, 2);
    }
    return format.replace('yyyy', yyyy).replace('mm', mm).replace('dd', dd);
}


/**
 * Returns a date time string for a time value
 * @param timestamp Time in milliseconds since epoch
 * @returns Formatted date time string
 */
export function dateTimeString(timestamp: number, msecs = true): string {
    return timestamp > 0
        ? dateString(timestamp, 'yyyy-mm-dd') + ' ' + timeString(timestamp, 'hh:mm:ss' + (msecs ? '.msec' : ''))
        : '';
}


/**
 * Returns a randomly genereated 'universally unique' identifier
 * @param blocks Number of hexadecimal blocks separated by a hyphen
 * @returns Generated UUID
 */
export function randomUUID(blocks = 4): string {
    let result = '';
    for (let i = 0; i < blocks; i++) {
        const hex16 = (Math.floor(1E7 * (1 - Math.random())) + 0x10000).toString(16).substr(-4);
        result = result.concat((i > 0 ? '-' : '') + hex16);
    }
    return result;
}


/**
 * Coerces a data-bound value to a boolean, but unlike its original functionality
 * from the angular material code, it does not affect null and undefined values
 * @see https://github.com/angular/material2/blob/master/src/cdk/coercion/boolean-property.ts
 * @param value Value to coerce
 * @returns Coerced boolean
 */
export function coerceBoolean(value: any): boolean | undefined | null {
    if (value == null) {
        return value;
    }
    return `${value}` !== 'false';
}


export function isType(arg: any, type: string): boolean {
    return (<string>Object.prototype.toString.call(arg)).indexOf(type, 8) !== -1;
}


export function isFunction(arg: any): arg is Function {
    return isType(arg, 'Function');
}


export function isArray(arg: any): arg is Array<any> {
    return isType(arg, 'Array');
}


export function isObject(arg: any): arg is Object {
    return isType(arg, 'Object');
}


export function isNumber(arg: any): arg is number {
    return isType(arg, 'Number');
}


export function isString(arg: any): arg is string {
    return isType(arg, 'String');
}


export function isBoolean(arg: any): arg is boolean {
    return isType(arg, 'Boolean');
}


export function isSymbol(arg: any): arg is symbol {
    return isType(arg, 'Symbol');
}


export function convertNan(value: number, to: null | undefined): number {
    return isNaN(value) ? to : value;
}


/**
 * Packs the given value into an array, if needed
 * @param value Value to pack
 * @returns Either
 *      - the value itself, if it's an array, or
 *      - a new array containing the value, if value was neither null nor undefined, or
 *      - an empty array
 */
export function pack<T>(value: T | T[]): T[] {
    return isArray(value)
        ? value
        : value != null
            ? [value]
            : [];
}


/**
 * Returns an array where every element is set to the same value
 * @param length Length of the array
 * @param value Value for every element
 * @returns Filled array
 */
export function fill(length: number, value = 0): number[] {
    return Array(length).fill(value);
}


/**
 * Returns an array containing a consecutive range of numbers
 * @param length Length of the range
 * @param start Starting value of the range
 * @returns Range array
 */
export function range(length: number, start = 0): number[] {
    return fill(start).map((x, y) => x + y);
}


export function numberToString(value: number, nullRepresentation: null | undefined): string {
    // x == null   equals   x === null || x === undefined
    return isNaN(value) || value == null ? nullRepresentation : '' + value;
}


export function unboxedNumberToString(value: number): string {
    return numberToString(value, undefined);
}


export function boxedNumberToString(value: number): string {
    return numberToString(value, null);
}


export function stringToInteger(value: string, nullRepresentation: null | undefined): number {
    return convertNan(parseInt(value, 10), nullRepresentation);
}


export function stringToUnboxedInteger(value: string): number {
    return stringToInteger(value, undefined);
}


export function stringToBoxedInteger(value: string): number {
    return stringToInteger(value, null);
}


export function stringToFloat(value: string, nullRepresentation: null | undefined): number {
    return convertNan(parseFloat(value), nullRepresentation);
}


export function stringToUnboxedFloat(value: string): number {
    return stringToFloat(value, undefined);
}


export function stringToBoxedFloat(value: string): number {
    return stringToFloat(value, null);
}


export function booleanToString(value: boolean, nullRepresentation: null | undefined): string {
    return value == null ? nullRepresentation : value.toString();
}


export function unboxedBooleanToString(value: boolean): string {
    return booleanToString(value, undefined);
}


export function boxedBooleanToString(value: boolean): string {
    return booleanToString(value, null);
}


export function stringToBoolean(value: string, nullRepresentation: null | undefined): boolean {
    return value === 'false' ? false : (value === 'true' || nullRepresentation);
}


export function stringToUnboxedBoolean(value: string): boolean {
    return stringToBoolean(value, undefined);
}


export function stringToBoxedBoolean(value: string): boolean {
    return stringToBoolean(value, null);
}


export function dispatchMouseClick(element: HTMLElement) {
    const event = document.createEvent('MouseEvents');
    event.initEvent('click', true, true);
    element.dispatchEvent(event);
}


export enum MimeTypes {
    bin = 'application/octet-stream',
    css = 'text/css',
    csv = 'text/csv',
    html = 'text/html',
    jar = 'application/java-archive',
    jpeg = 'image/jpeg',
    json = 'application/json',
    pdf = 'application/pdf',
    png = 'image/png',
    svg = 'image/svg+xml',
    txt = 'text/plain',
    xml = 'application/xml',
    zip = 'application/zip'
}


export enum UploadResultStatus {
    FileChosen,
    Uploading,
    UploadDone
}


export class UploadResult {
    constructor(public status: UploadResultStatus, public stream = '', public file: File = null, public percent = 0) {
    }
}


export function getEnumKey(enumerable: object, value: string) {
    for (const key in enumerable) {
        if (enumerable[key] === value) {
            return key;
        }
    }
}


export function browseFile(mimeType = MimeTypes.txt): Observable<UploadResult> {
    const subject = new Subject<UploadResult>();
    const input = window.document.createElement('input');
    input.setAttribute('type', 'file');
    input.setAttribute('accept', '.' + getEnumKey(MimeTypes, mimeType));
    input.onchange = () => {
        const result = new UploadResult(UploadResultStatus.FileChosen, '', input.files[0], 0);
        subject.next(result);
        subject.complete();
    };
    dispatchMouseClick(input);
    return subject.asObservable();
}


export function readFile(file: File): Observable<UploadResult> {
    const subject = new Subject<UploadResult>();
    const reader = new FileReader();
    reader.onprogress = progress => {
        const percent = progress.loaded ? (progress.loaded * 100 / progress.total) : 0;
        const result = new UploadResult(UploadResultStatus.Uploading, '', file, percent);
        subject.next(result);
    };
    reader.onload = () => {
        const content = reader.result as string;
        subject.next(new UploadResult(UploadResultStatus.UploadDone, content, file, 100));
        subject.complete();
    };
    reader.onerror = () => {
        subject.error('unable to read data from file "' + file.name + '"');
        subject.complete();
    };
    reader.readAsText(file);
    return subject.asObservable();
}


/**
 * Dowloads a file with a certain filename and a given mime type
 * @param data Data stream represented as a string or a blob
 * @param filename Initial filename without extension
 * @param mimeType Mime type of the file
 */
export function downloadFile(data: string | Blob, filename: string, mimeType = MimeTypes.txt) {
    // create url with blob
    const url = URL.createObjectURL(data instanceof Blob ? data : new Blob([data], { type: MimeTypes.bin }));
    // create link element
    const a = document.createElement('a');
    a.href = url;
    a.download = (filename || 'file') + '.' + getEnumKey(MimeTypes, mimeType);
    dispatchMouseClick(a);
    // revoke url
    URL.revokeObjectURL(url);
}


/**
 * Uploads a file with a certain mime type
 * @param mimeType Mime type of the file
 * @returns Observable with the file's upload result
 */
export function uploadFile(mimeType = MimeTypes.txt): Observable<UploadResult> {
    return browseFile(mimeType).pipe(
        switchMap(uploadResult => readFile(uploadResult.file))
    );
}


/**
 * Returns the href attribute string of the <base> tag
 * @returns Href attribute string
 */
export function getBaseHref(): string {
    return document.querySelector('base')?.href ?? '';
}


/**
 * Returns a list of all focusable HTML elements inside the passed root
 * @param root Element to find focusable elements in
 */
export function retrieveFocusableElements(root: HTMLElement): Array<HTMLElement> {
    return Array.from(
        root.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'),
        element => element as HTMLElement
    ).filter(element => !!element?.offsetParent);   /* filter for visible elements */
}


export function copyToClipboard(value: string): Observable<void> {
    return from(navigator.clipboard.writeText(value));
}


export function pasteFromClipboard(): Observable<string> {
    return from(navigator.clipboard.readText());
}


/**
 * Checks, whether a text is overflowing the sorrounding element.
 * Note: The element should only contain a text node (as in <span>Text</span>)
 * @param element Element holding the text node
 * @param text    Text to check against overflowing
 * @returns TRUE, if text is overflowing, FALSE otherwise
 */
export function isTextOverflowing(element: HTMLElement, text: string): boolean {
    const getTextWidth = (fontFamily: string, fontSize: string): number => {
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        context.font = fontSize + ' ' + fontFamily;
        const metrics = context.measureText(text);
        return metrics ? metrics.width : -1;
    };
    if (element) {
        const rect = element.getBoundingClientRect();
        const css = window.getComputedStyle(element);
        const extra = parseInt(css.paddingLeft, 10) + parseInt(css.paddingRight, 10) + parseInt(css.borderLeftWidth, 10) + parseInt(css.borderRightWidth, 10);
        const contentWidth = getTextWidth(css.fontFamily, css.fontSize) + extra;
        return rect.width < contentWidth;
    }
}


export function encodeURIComponentRFC1738(str: string): string {
    return encodeURIComponent(str)
        .replace(/!/g, '%21')
        .replace(/~/g, '%7E')
        .replace(/'/g, '%27')
        .replace(/\(/g, '%28')
        .replace(/\)/g, '%29')
        .replace(/\*/g, '%2A');
}
