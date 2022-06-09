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
import { XcCanvasHelper } from '../xc-canvas/xc-canvas-helper.class';
import { StyleColor } from './sub-classes/basics';


export interface CartasianCoordinateSystemPointsStyling {
    color?: string;
    hitboxSize?: number;
    size?: number;
    selected: {
        color?: string;
        circleDiameter?: number;
    };
    hover: {
        color?: string;
        circleDiameter?: number;
    };
}

export interface CartasianCoordinateSystemConnectionStyling {
    color?: string;
    thickness?: number;
}

export class XcPlotStyleHelper {

    static PLOT = {
        backgroundColor: StyleColor.Grey_0 as string
    };

    static CCS = {
        backgroundColor: StyleColor.Grey_1 as string,
        borderColor: '#000',
        borderThickness: 1,
        axisColor: '#f0f0f0',

        scaleMark : {
            // ["each one", "every 5th", "every 10th"]
            colors: [StyleColor.Grey_3, StyleColor.Grey_3, StyleColor.Grey_3] as string[],
            lengths: [8, 8, 8],
            thicknesses: [1, 1, 1]
        },

        scaleHelpLineColor: XcCanvasHelper.getRGBA(StyleColor.Grey_3, 0.45),

        points : {
            selected : {
                color: XcCanvasHelper.getRGBA(StyleColor.Gold, 0.3),
                circleDiameter: 8
            },
            hover : {
                color: XcCanvasHelper.getRGBA(StyleColor.Normal, 0.3),
                circleDiameter: 8
            },
            color: StyleColor.Blue as string,
            hitboxSize: 8,
            size: 2
        } as CartasianCoordinateSystemPointsStyling,

        connection : {
            color: StyleColor.Grey_3 as string,
            thickness: 1
        } as CartasianCoordinateSystemConnectionStyling,

        offside: {
            scales: {
                color: '#fff',
                mark : {
                    color: StyleColor.Grey_3 as string,
                    fontColor: '#fff',
                    length: 8
                }
            },
            label: {
                fontSize: 14,
                padding: 5,
                borderColor: StyleColor.Grey_1 as string,
                borderThickness: 1,
                fontColor: '#000',
                backgroundColor: StyleColor.Grey_3 as string
            }
        }
    };
}
