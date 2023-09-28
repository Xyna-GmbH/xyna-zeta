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
export function getQuadTriangles3raw(x0: number, y0: number, x1: number, y1: number, z: number): number[] {
    return [
        // lower-left triangle
        x0, y0, z,
        x1, y0, z,
        x0, y1, z,
        // upper-right triangle
        x1, y1, z,
        x0, y1, z,
        x1, y0, z
    ];
}


export function getQuadTriangles3(x: number, y: number, z: number, width: number, height: number): number[] {
    return getQuadTriangles3raw(x, y, x + width, y + height, z);
}
