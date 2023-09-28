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
export interface SessionInfo {
    /** name of the user */
    username: string;
    /** role of the user */
    role: string;
    /** rights of the user's role */
    rights: string[];
    /** session id */
    sessionId: string;
    /** time in milliseconds since session start */
    startTime: number;
    /** time in milliseconds since last session interaction */
    lastInteraction: number;
    /** time in milliseconds since unix epoch */
    serverTime: number;
    /** unique server id (determined at runtime) */
    serverId: number;
    /** server version number */
    xynaVersion: string;

    // derived values

    /** time offset in milliseconds from client to server */
    serverTimeOffset: number;
}
