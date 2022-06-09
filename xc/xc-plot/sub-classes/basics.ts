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

/**
 * Property of a Coord
 * - Describes, to which axis the calculations of the Coord relates
 */
export enum RelationAxis {
    X = 'x',
    Y = 'y'
}

/**
 * Property of a Coord
 * - Describes the side of the canvas from which the Coord.value is counts
 */
export enum OrientationSide {
    Start = 'start',
    End = 'end'
}

/**
 * - Describes the Unit of a value
 */
export enum Unit {
    Absolute = 'px',
    Relative = '%'
}

export interface XcPlottableArea {
    x?: number; // ? is important in order that a CanvasRendering2dContexts fullfills this interface
    y?: number; // ? is important in order that a CanvasRendering2dContexts fullfills this interface
    width: number;
    height: number;
    [key: string]: any; // important in order that a CanvasRendering2dContexts fullfills this interface
}

export class XcCoord {
    constructor(
        public difference: number,
        public unit = Unit.Absolute,
        public orientationSide = OrientationSide.Start,
        public relAxis?
    ) {}

    calc(rect: XcPlottableArea): number {
        rect.x = typeof rect.x === 'number' ? rect.x : 0;
        rect.y = typeof rect.y === 'number' ? rect.y : 0;
        const axisLength = this.relAxis === RelationAxis.X ? (rect.width - rect.x) : (rect.height - rect.y);
        const absoluteDifferenceFromStart
                            = this.unit === Unit.Relative
                                ? (this.difference * axisLength /  100)
                                : this.difference;

        let normalValue: number;
        if (this.orientationSide === OrientationSide.End) {
            normalValue = axisLength - absoluteDifferenceFromStart;
        } else {
            normalValue = absoluteDifferenceFromStart;
        }
        return normalValue + (this.relAxis === RelationAxis.X ? rect.x : rect.y);
    }
}

export class XcDot {
    constructor(public x: XcCoord, public y: XcCoord) {
        x.relAxis = x.relAxis ? x.relAxis : RelationAxis.X;
        y.relAxis = y.relAxis ? y.relAxis : RelationAxis.Y;
    }
    calc(rect: XcPlottableArea): { x: number; y: number } {
        return {
            x : this.x.calc(rect),
            y : this.y.calc(rect)
        };
    }
}

export enum XcPlotPointConnection {
    None = 'none',
    Linear = 'linear_line',
    Interpolated = 'interpolated_spline',
    Cardinal = 'cardinal_spline',
    Bezier = 'bezier_spline'
}

export enum CommonBorder {
    Top = 'top',
    Right = 'right',
    Bottom = 'bottom',
    Left = 'left'
}


export interface PlotStyle {
    plot_background_color: string;
    ccs_background_color: string;
    ccs_border_color: string;
    ccs_axis_color: string;
    ccs_scale_mark_colors: string[]; // ["regular one", "5th", "10th"]
    ccs_scale_mark_length: number[]; // ["regular one", "5th", "10th"]
    css_scale_mark_thickness: number[]; // ["regular one", "5th", "10th"]
    ccs_scale_help_line_color: string;
    css_area_points_selected_point_circle_color: string;
    css_area_points_selected_point_circle_diameter: number;
    ccs_area_points_color: string;
    ccs_area_points_diameter: number;
    ccs_area_points_thickness: number;
    ccs_area_point_connection_color: string;
    ccs_area_point_connection_thickness: number;
    ccs_area_offside_scale_axis_color: string;
    ccs_area_offside_scale_mark_color: string;
    ccs_area_offside_scale_mark_font_color: string;
    ccs_area_offside_scale_mark_length: number;
    ccs_area_offside_scale_label_font_size: number;
    ccs_area_offside_scale_label_padding: number;
    ccs_area_offside_scale_label_border_color: string;
    ccs_area_offside_scale_label_border_thickness: number;
    ccs_area_offside_scale_label_font_color: string;
    ccs_area_offside_scale_label_background_color: string;
}


export enum StyleColor {
    Gold = '#FABB00',
    Magenta = '#EC096E',
    Blue = '#00DBFF',
    Grey_0 = '#1A1A1B',
    Grey_1 = '#2A2A2B',
    Grey_2 = '#76767A',
    Grey_3 = '#EDEDEF',
    Normal = '#FFFFFF'
}
