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
import { Observable, Subject } from 'rxjs/';


export class XcSelectionModel<T> {

    private readonly _focusedSubject   = new Subject<XcSelectionModel<T>>();
    private readonly _activatedSubject = new Subject<XcSelectionModel<T>>();
    private readonly _selectionSubject = new Subject<XcSelectionModel<T>>();
    private _selectionSet = new Set<T>();
    private _suppressChange = false;
    private _lastSelected: T;
    private _focusCandidate: T;
    private _activatedCandidate: T;

    /** Determines whether the selection change will be triggered, even if the selected items remain the same */
    selectionChangeForUnchangedSelection = false;

    /** Guard against selection changes by setting the callback to return a obvservable yielding false */
    selectionChangeGuard: () => Observable<boolean>;


    combineOperations(operations: (selectionModel: this) => void) {
        // remember previous selection set
        const previousSelection = new Set(this.selection);

        // run suppressed operations
        this.suppressOperations(operations);

        // not called within a suppressed operations callback?
        if (!this._suppressChange) {

            // function checking for changes caused by the operations
            const selectionHasChanged = () => {
                // first compare before and after sizes
                if (this.size !== previousSelection.size) {
                    return true;
                }
                // same size, so we have to check each value individually
                for (const value of this.selection) {
                    if (!previousSelection.has(value)) {
                        return true;
                    }
                }
                return false;
            };

            // call selection guard, if defined
            if (this.selectionChangeForUnchangedSelection || selectionHasChanged()) {
                if (this.selectionChangeGuard) {
                    // remember current selection set
                    const currentSelection = new Set(this.selection);
                    // restore previous selection for the mean time
                    this._selectionSet = previousSelection;
                    // run guard
                    this.selectionChangeGuard().subscribe(result => {
                        if (result) {
                            this._selectionSet = currentSelection;
                            this._selectionSubject.next(this);
                        }
                    });
                } else {
                    this._selectionSubject.next(this);
                }
            }
        }
    }


    suppressOperations(operations: (selectionModel: this) => void) {
        if (!this._suppressChange) {
            this._suppressChange = true;
            operations(this);
            this._suppressChange = false;
        } else {
            operations(this);
        }
    }


    /**
     * Focuses a value
     */
    focus(value: T) {
        this._focusCandidate = value;
        this._focusedSubject.next(this);
    }


    /**
     * Activates a value (for example, triggered by a double click on a table row)
     */
    activate(value: T) {
        this._activatedCandidate = value;
        this._activatedSubject.next(this);
    }


    /**
     * Selects a value
     */
    select(value: T) {
        this._lastSelected = value;
        this.focus(value);
        this.combineOperations(() =>
            this._selectionSet.add(value)
        );
    }


    /**
     * Selects the range of values between the last selected value and the given value
     */
    rangeSelect(pool: T[], value: T) {
        if (this._lastSelected) {
            this.focus(value);
            const idx = this.searchRange<T>(pool, this._lastSelected, value);
            this.combineOperations(() => {
                for (let i = idx.minIdx; i <= idx.maxIdx; i++) {
                    this._selectionSet.add(pool[i]);
                }
            });
        }
    }


    /**
     * Deselects a value
     */
    deselect(value: T) {
        this._lastSelected = undefined;
        this.combineOperations(() =>
            this._selectionSet.delete(value)
        );
    }


    /**
     * Clears all of the selected values
     */
    clear() {
        this._lastSelected = undefined;
        this.combineOperations(() =>
            this._selectionSet.clear()
        );
    }


    /**
     * Toggles a value between selected and deselected
     */
    toggle(value: T) {
        if (this.isSelected(value)) {
            this.deselect(value);
        } else {
            this.select(value);
        }
    }


    /**
     * Determines whether a value has the focus
     */
    isFocused(value: T): boolean {
        return this._focusCandidate === value;
    }


    /**
     * Determines whether a value has been activated
     */
    isActivated(value: T): boolean {
        return this._activatedCandidate === value;
    }


    /**
     * Determines whether a value is selected
     */
    isSelected(value: T): boolean {
        return this._selectionSet.has(value);
    }


    /**
     * Determines whether the model does not have a value
     */
    isEmpty(): boolean {
        return this.size === 0;
    }


    /**
     * Returns the number of selected entries
     */
    get size(): number {
        return this._selectionSet.size;
    }


    /**
     * Returns selected entries
     */
    get selection(): T[] {
        return Array.from(this._selectionSet.values());
    }


    /**
     * Returns the last selected entry
     */
    get lastSelected(): T {
        return this._lastSelected;
    }


    /**
     * Returns the focus candidate entry
     */
    get focused(): T {
        return this._focusCandidate;
    }


    /**
     * Returns the activation candidate entry
     */
    get activated(): T {
        return this._activatedCandidate;
    }


    /**
     * Returns observable to subscribe for selection changes
     */
    get selectionChange(): Observable<XcSelectionModel<T>> {
        return this._selectionSubject.asObservable();
    }


    /**
     * Returns observable to subscribe for focus changes
     */
    get focusedChange(): Observable<XcSelectionModel<T>> {
        return this._focusedSubject.asObservable();
    }


    /**
     * Returns observable to subscribe for activation changes
     */
    get activatedChange(): Observable<XcSelectionModel<T>> {
        return this._activatedSubject.asObservable();
    }


    protected searchRange<U>(pool: U[], value1: U, value2: U): {minIdx: number; maxIdx: number} {
        const idx1 = pool.indexOf(value1);
        const idx2 = pool.indexOf(value2);
        return {minIdx: Math.min(idx1, idx2), maxIdx: Math.max(idx1, idx2)};
    }
}


export class XcSubSelectionModel<T, S> extends XcSelectionModel<T> {
    // This map have to be synchonous whith the set _selectionSet.
    // If some methodcalls from XcSubSelectionModel and XcSelectionModel are mixed, then things can go wrong.
    protected _subSelectionMap = new Map<T, Set<S>>();
    private _lastCellSelected: S;


    deselect(value: T) {
        this._lastCellSelected = undefined;
        // remove sub selections (must be done before super call to include changes when event is fired)
        this._subSelectionMap.delete(value);
        super.deselect(value);
    }


    clear() {
        this._lastCellSelected = undefined;
        // clear all sub selections (must be done before super call to include changes when event is fired)
        this._subSelectionMap.clear();
        super.clear();
    }


    subSelect(value: T, sub: S) {
        this._lastCellSelected = sub;
        const set = (this._subSelectionMap.get(value) || new Set()).add(sub);
        this._subSelectionMap.set(value, set);
        // select values as well
        this.select(value);
    }


    subRangeSelect(pool: T[], value: T, poolSub: S[], sub: S) {
        if (this.lastCellSelected) {
            // This function is called twice. Once here and once in rangeSelect(pool, value) later.
            // If pool is big (for example a table with lots of rows), then there could be a time loss.
            // But this way there are less duplicated code.
            const idx = this.searchRange<T>(pool, this.lastSelected, value);
            const subIdx = this.searchRange<S>(poolSub, this.lastCellSelected, sub);

            for (let i = idx.minIdx; i <= idx.maxIdx; i++) {
                const set = (this._subSelectionMap.get(pool[i]) || new Set());
                for (let subI = subIdx.minIdx; subI <= subIdx.maxIdx; subI++) {
                    set.add(poolSub[subI]);
                }
                this._subSelectionMap.set(pool[i], set);
            }
            this.rangeSelect(pool, value);
        }
    }


    subDeselect(value: T, sub: S) {
        this._lastCellSelected = undefined;
        const set = this._subSelectionMap.get(value);
        if (set && set.delete(sub) && set.size === 0) {
            this._subSelectionMap.delete(value);
        }
    }


    subToggle(value: T, sub: S) {
        if (this.isSubSelected(value, sub)) {
            this.subDeselect(value, sub);
        } else {
            this.subSelect(value, sub);
        }
    }


    isSubSelected(value: T, sub: S): boolean {
        const set = this._subSelectionMap.get(value);
        return set && set.has(sub);
    }


    getSubs(value: T): S[] {
        return Array.from((this._subSelectionMap.get(value) || new Set()).values());
    }


    get lastCellSelected(): S {
        return this._lastCellSelected;
    }
}
