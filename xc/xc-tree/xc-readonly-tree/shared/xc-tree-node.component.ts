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
import { XcTreeNode } from '../../xc-tree-data-source';


export interface ResizeEvent {
    node: XcTreeNode;
    width: number;
}

export class XcTreeNodeComponent {

    childWidths: Map<XcTreeNode, number> = new Map<XcTreeNode, number>();


    /**
     * Updates internal data structure that holds all children's widths
     * @param node Node which width has changed
     * @param width New width of node
     *
     * @return Maximum width over all children
     */
    updateChildWidth(node: XcTreeNode, width: number): number {
        this.childWidths.set(node, width);
        let maxChildWidth = 0;
        for (const childWidth of this.childWidths.values()) {
            if (childWidth > maxChildWidth) {
                maxChildWidth = childWidth;
            }
        }
        return maxChildWidth;
    }
}
