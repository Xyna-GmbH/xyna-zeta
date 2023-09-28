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
import { booleanToString, numberToString, stringToBoolean, stringToFloat, stringToInteger } from '../../base';


/**
 * Wraps data from a model to display in a component.
 *
 * LHS          <-->  RHS
 * Component    <-->  Model
 *
 */
export abstract class XcDataWrapper<L, R> {

    constructor(public getter: () => R, public setter: (value: R) => void) {
    }


    abstract get value(): L;
    abstract set value(value: L);
}


export abstract class XcBoxableDataWrapper<L, R> extends XcDataWrapper<L, R> {

    nullRepresentation: null | undefined;


    constructor(getter: () => R, setter: (value: R) => void, boxed = false) {
        super(getter, setter);
        this.nullRepresentation = boxed ? null : undefined;
    }
}


export class XcNullDataWrapper<T extends null = null> extends XcDataWrapper<T, T> {

    constructor() {
        super(null, null);
    }

    get value(): T {
        return null;
    }

    set value(value: T) {
        // don't set anything here
    }
}


export class XcIdentityDataWrapper<T = any> extends XcDataWrapper<T, T> {

    get value(): T {
        return this.getter();
    }

    set value(value: T) {
        this.setter(value);
    }
}


export class XcStringIntegerDataWrapper extends XcBoxableDataWrapper<string, number> {

    get value(): string {
        return numberToString(this.getter(), this.nullRepresentation);
    }

    set value(value: string) {
        this.setter(stringToInteger(value, this.nullRepresentation));
    }
}


export class XcIntegerStringDataWrapper extends XcBoxableDataWrapper<number, string> {

    get value(): number {
        return stringToInteger(this.getter(), this.nullRepresentation);
    }

    set value(value: number) {
        this.setter(numberToString(value, this.nullRepresentation));
    }
}


export class XcStringFloatDataWrapper extends XcBoxableDataWrapper<string, number> {

    get value(): string {
        return numberToString(this.getter(), this.nullRepresentation);
    }

    set value(value: string) {
        this.setter(stringToFloat(value, this.nullRepresentation));
    }
}


export class XcFloatStringDataWrapper extends XcBoxableDataWrapper<number, string> {

    get value(): number {
        return stringToFloat(this.getter(), this.nullRepresentation);
    }

    set value(value: number) {
        this.setter(numberToString(value, this.nullRepresentation));
    }
}


export class XcStringBooleanDataWrapper extends XcBoxableDataWrapper<string, boolean> {

    get value(): string {
        return booleanToString(this.getter(), this.nullRepresentation);
    }

    set value(value: string) {
        this.setter(stringToBoolean(value, this.nullRepresentation));
    }
}


export class XcBooleanStringDataWrapper extends XcBoxableDataWrapper<boolean, string> {

    get value(): boolean {
        return stringToBoolean(this.getter(), this.nullRepresentation);
    }

    set value(value: boolean) {
        this.setter(booleanToString(value, this.nullRepresentation));
    }
}
