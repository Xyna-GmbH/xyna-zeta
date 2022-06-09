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

export interface CurveControlPoints {
    first:  { x: number; y: number }[];
    second: { x: number; y: number }[];
}

export class BezierSplineHelper {

    /**
     * Get open-ended Bezier Spline Control Points.
     * @param knots Input Knot Bezier spline points.
     */
    static getCurveControlPoints(knots: { x: number; y: number }[]): CurveControlPoints {

        const firstControlPoints:  { x: number; y: number }[] = [];
        const secondControlPoints: { x: number; y: number }[] = [];
        const rhs: number[] = [];
        let i: number;

        if (knots.length < 2) {
            return {first: firstControlPoints, second: secondControlPoints};
        }

        const n = knots.length - 1;

        if (n === 1) {
            // Special case: Bezier curve should be a straight line.
            // 3P1 = 2P0 + P3
            firstControlPoints[0] = {
                x: (2 * knots[0].x + knots[1].x) / 3,
                y: (2 * knots[0].y + knots[1].y) / 3
            };
            // P2 = 2P1 – P0
            secondControlPoints[0] = {
                x: 2 * firstControlPoints[0].x - knots[0].x,
                y: 2 * firstControlPoints[0].y - knots[0].y
            };

        } else {
            // Calculate first Bezier control points
            // Right hand side vector

            for (i = 1; i < n - 1; i++) {
                rhs[i] = 4 * knots[i].x + 2 * knots[i + 1].x;
            }

            rhs[0] = knots[0].x + 2 * knots[1].x;
            rhs[n - 1] = (8 * knots[n - 1].x + knots[n].x) / 2;

            // Get first control points X-values
            const x = BezierSplineHelper.getFirstControlPoints(rhs);

            // Set right hand side Y values
            for (i = 1; i < n - 1; i++) {
                rhs[i] = 4 * knots[i].y + 2 * knots[i + 1].y;
            }


            rhs[0] = knots[0].y + 2 * knots[1].y;
            rhs[n - 1] = (8 * knots[n - 1].y + knots[n].y) / 2;
            // Get first control points Y-values
            const y = BezierSplineHelper.getFirstControlPoints(rhs);

            // Fill output arrays.

            for (i = 0; i < n; i++) {
                // First control point
                firstControlPoints[i] = { x: x[i], y: y[i] };
                // Second control point
                if (i < n - 1) {
                    secondControlPoints[i] = {
                        x: 2 * knots[i + 1].x - x[i + 1],
                        y: 2 * knots[i + 1].y - y[i + 1]
                    };
                } else {
                    secondControlPoints[i] = {
                        x: (knots[n].x + x[n - 1]) / 2,
                        y: (knots[n].y + y[n - 1]) / 2
                    };
                }
            }
        }

        return { first: firstControlPoints, second: secondControlPoints };
    }


    /**
     * Solves a tridiagonal system for one of coordinates (x or y) of first Bezier control points.
     * @param rhs - Right hand side vector.
     * @returns Solution vector
     */
    private static getFirstControlPoints(rhs: number[]): number[] {
        const n = rhs.length;
        const x = []; // Solution vector.
        const tmp = []; // Temp workspace.

        let b = 2;
        let i: number;

        x[0] = rhs[0] / b;

        for (i = 1; i < n; i++) {
            // Decomposition and forward substitution.
            tmp[i] = 1 / b;
            b = (i < n - 1 ? 4.0 : 3.5) - tmp[i];
            x[i] = (rhs[i] - x[i - 1]) / b;
        }
        for (i = 1; i < n; i++) {
            x[n - i - 1] -= tmp[n - i] * x[n - i]; // Backsubstitution.
        }

        return x;
    }
}
