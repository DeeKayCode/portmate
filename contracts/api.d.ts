// Generated from contracts/openapi.yaml; do not edit.
export interface paths {
    "/health": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["health"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/auth/register": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: operations["register"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/auth/login": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: operations["login"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/auth/google": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: operations["googleLogin"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/auth/verify-email": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: operations["verifyEmail"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/me": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["getMe"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch: operations["updateMe"];
        trace?: never;
    };
    "/settings": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["getSettings"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch: operations["updateSettings"];
        trace?: never;
    };
    "/ships/companies": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["listCompanies"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/ships": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["listShips"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/assignments": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["listAssignments"];
        put?: never;
        post: operations["createAssignment"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/assignments/{assignmentId}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        delete: operations["deleteAssignment"];
        options?: never;
        head?: never;
        patch: operations["updateAssignment"];
        trace?: never;
    };
    "/itinerary": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["getItinerary"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/connections": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["listConnections"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/connections/qr": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: operations["createQrConnectionToken"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/connections/claim": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: operations["claimConnectionToken"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/connections/{connectionId}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        delete: operations["removeConnection"];
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/blocks": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: operations["blockUser"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/overlaps": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["listOverlaps"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/overlaps/{overlapId}/poke": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: operations["createPoke"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/overlaps/{overlapId}/intent": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch: operations["respondToPoke"];
        trace?: never;
    };
    "/notifications": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["listNotifications"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
}
export type webhooks = Record<string, never>;
export interface components {
    schemas: {
        Health: {
            /** @constant */
            status: "ok";
            /** @enum {unknown} */
            database?: "unknown" | "healthy" | "unhealthy";
        };
        Problem: {
            /** Format: uri-reference */
            type: string;
            title: string;
            status: number;
            detail?: string;
        };
        RegisterRequest: {
            /** Format: email */
            email: string;
            password: string;
            username: components["schemas"]["Username"];
        };
        LoginRequest: {
            /** Format: email */
            email: string;
            password: string;
        };
        GoogleAuthRequest: {
            idToken: string;
        };
        TokenRequest: {
            token: string;
        };
        VerificationPending: {
            /** @constant */
            verificationRequired: true;
        };
        Session: {
            accessToken: string;
            user: components["schemas"]["Profile"];
        };
        Username: string;
        Profile: {
            /** Format: uuid */
            id: string;
            username: components["schemas"]["Username"];
            displayName?: string;
            /** Format: uri */
            avatarUrl?: string;
            emailVerified: boolean;
            /** @enum {unknown} */
            lastActiveLabel?: "recently" | "hours_ago" | "yesterday" | "older";
        };
        ProfileUpdate: {
            username?: components["schemas"]["Username"];
            displayName?: string;
            /** Format: uri */
            avatarUrl?: string;
        };
        Settings: {
            /** @default 50 */
            nearbyPortThresholdKm: number;
            /** @default true */
            emailNotifications: boolean;
        };
        CruiseCompany: {
            id: string;
            name: string;
        };
        Ship: {
            id: string;
            name: string;
            company: components["schemas"]["CruiseCompany"];
        };
        AssignmentInput: {
            companyId: string;
            shipId: string;
            /** Format: date */
            startDate: string;
            /** Format: date */
            endDate: string;
        };
        Assignment: components["schemas"]["AssignmentInput"] & {
            /** Format: uuid */
            id: string;
            /** Format: date-time */
            createdAt: string;
        };
        PortCall: {
            portId: string;
            portName: string;
            countryCode?: string;
            /** Format: date-time */
            arrivalAt: string;
            /** Format: date-time */
            departureAt: string;
            latitude: number;
            longitude: number;
        };
        Itinerary: {
            /** Format: uuid */
            assignmentId: string;
            portCalls: components["schemas"]["PortCall"][];
            /** Format: date-time */
            sourceUpdatedAt?: string;
        };
        Connection: {
            /** Format: uuid */
            id: string;
            profile: components["schemas"]["Profile"];
            /** Format: date-time */
            createdAt: string;
        };
        ConnectionToken: {
            token: string;
            /** Format: date-time */
            expiresAt: string;
        };
        BlockInput: {
            /** Format: uuid */
            userId: string;
        };
        Overlap: {
            /** Format: uuid */
            id: string;
            connection: components["schemas"]["Profile"];
            /** @enum {unknown} */
            type: "same_port" | "nearby_port" | "same_ship";
            /** @enum {unknown} */
            lifecycle: "future" | "current" | "expired";
            /** Format: date-time */
            startsAt: string;
            /** Format: date-time */
            endsAt: string;
            portCalls?: components["schemas"]["PortCall"][];
            distanceKm?: number;
            meetingIntent?: components["schemas"]["MeetingIntent"];
        };
        MeetingIntent: {
            /** @enum {unknown} */
            status: "none" | "poked" | "interested" | "not_interested";
            /** Format: date-time */
            updatedAt?: string;
        };
        MeetingIntentResponse: {
            /** @enum {unknown} */
            status: "interested" | "not_interested";
        };
        Notification: {
            /** Format: uuid */
            id: string;
            /** @enum {unknown} */
            type: "overlap_upcoming" | "poke_received" | "poke_response";
            /** Format: date-time */
            createdAt: string;
            read: boolean;
            /** Format: uuid */
            overlapId?: string;
        };
    };
    responses: {
        /** @description Request problem */
        Problem: {
            headers: {
                [name: string]: unknown;
            };
            content: {
                "application/problem+json": components["schemas"]["Problem"];
            };
        };
    };
    parameters: {
        AssignmentId: string;
        ConnectionId: string;
        OverlapId: string;
    };
    requestBodies: never;
    headers: never;
    pathItems: never;
}
export type $defs = Record<string, never>;
export interface operations {
    health: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Service health */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Health"];
                };
            };
        };
    };
    register: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["RegisterRequest"];
            };
        };
        responses: {
            /** @description Email verification required */
            202: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["VerificationPending"];
                };
            };
            409: components["responses"]["Problem"];
        };
    };
    login: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["LoginRequest"];
            };
        };
        responses: {
            /** @description Session */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Session"];
                };
            };
            401: components["responses"]["Problem"];
        };
    };
    googleLogin: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["GoogleAuthRequest"];
            };
        };
        responses: {
            /** @description Session */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Session"];
                };
            };
        };
    };
    verifyEmail: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["TokenRequest"];
            };
        };
        responses: {
            /** @description Verified */
            204: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            400: components["responses"]["Problem"];
        };
    };
    getMe: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Profile */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Profile"];
                };
            };
        };
    };
    updateMe: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["ProfileUpdate"];
            };
        };
        responses: {
            /** @description Profile */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Profile"];
                };
            };
        };
    };
    getSettings: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Settings */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Settings"];
                };
            };
        };
    };
    updateSettings: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["Settings"];
            };
        };
        responses: {
            /** @description Settings */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Settings"];
                };
            };
        };
    };
    listCompanies: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Companies */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["CruiseCompany"][];
                };
            };
        };
    };
    listShips: {
        parameters: {
            query?: {
                companyId?: string;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Ships */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Ship"][];
                };
            };
        };
    };
    listAssignments: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Assignments */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Assignment"][];
                };
            };
        };
    };
    createAssignment: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["AssignmentInput"];
            };
        };
        responses: {
            /** @description Assignment */
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Assignment"];
                };
            };
            422: components["responses"]["Problem"];
        };
    };
    deleteAssignment: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                assignmentId: components["parameters"]["AssignmentId"];
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Deleted */
            204: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    updateAssignment: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                assignmentId: components["parameters"]["AssignmentId"];
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["AssignmentInput"];
            };
        };
        responses: {
            /** @description Assignment */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Assignment"];
                };
            };
        };
    };
    getItinerary: {
        parameters: {
            query: {
                assignmentId: string;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Itinerary */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Itinerary"];
                };
            };
        };
    };
    listConnections: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Connections */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Connection"][];
                };
            };
        };
    };
    createQrConnectionToken: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description One-time connection token */
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ConnectionToken"];
                };
            };
        };
    };
    claimConnectionToken: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["TokenRequest"];
            };
        };
        responses: {
            /** @description Connection */
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Connection"];
                };
            };
            409: components["responses"]["Problem"];
        };
    };
    removeConnection: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                connectionId: components["parameters"]["ConnectionId"];
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Removed */
            204: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    blockUser: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["BlockInput"];
            };
        };
        responses: {
            /** @description Block created */
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    listOverlaps: {
        parameters: {
            query?: {
                lifecycle?: "future" | "current" | "expired";
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Overlaps */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Overlap"][];
                };
            };
        };
    };
    createPoke: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                overlapId: components["parameters"]["OverlapId"];
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Poke */
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["MeetingIntent"];
                };
            };
            409: components["responses"]["Problem"];
        };
    };
    respondToPoke: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                overlapId: components["parameters"]["OverlapId"];
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["MeetingIntentResponse"];
            };
        };
        responses: {
            /** @description Intent */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["MeetingIntent"];
                };
            };
        };
    };
    listNotifications: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Notifications */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Notification"][];
                };
            };
        };
    };
}
