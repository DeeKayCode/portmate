// Generated from contracts/openapi.yaml; do not edit.
export const models = {
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "https://portmate.example/contracts/models.schema.json",
  "$comment": "Generated from openapi.yaml. Run npm --prefix server run generate:contracts.",
  "$defs": {
    "Health": {
      "type": "object",
      "required": [
        "status"
      ],
      "properties": {
        "status": {
          "const": "ok"
        },
        "database": {
          "enum": [
            "unknown",
            "healthy",
            "unhealthy"
          ]
        }
      }
    },
    "Problem": {
      "type": "object",
      "required": [
        "type",
        "title",
        "status"
      ],
      "properties": {
        "type": {
          "type": "string",
          "format": "uri-reference"
        },
        "title": {
          "type": "string"
        },
        "status": {
          "type": "integer"
        },
        "detail": {
          "type": "string"
        }
      }
    },
    "RegisterRequest": {
      "type": "object",
      "required": [
        "email",
        "password",
        "username"
      ],
      "properties": {
        "email": {
          "type": "string",
          "format": "email"
        },
        "password": {
          "type": "string",
          "minLength": 12
        },
        "username": {
          "$ref": "#/$defs/Username"
        }
      }
    },
    "LoginRequest": {
      "type": "object",
      "required": [
        "email",
        "password"
      ],
      "properties": {
        "email": {
          "type": "string",
          "format": "email"
        },
        "password": {
          "type": "string"
        }
      }
    },
    "GoogleAuthRequest": {
      "type": "object",
      "required": [
        "idToken"
      ],
      "properties": {
        "idToken": {
          "type": "string"
        }
      }
    },
    "TokenRequest": {
      "type": "object",
      "required": [
        "token"
      ],
      "properties": {
        "token": {
          "type": "string",
          "minLength": 20
        }
      }
    },
    "VerificationPending": {
      "type": "object",
      "required": [
        "verificationRequired"
      ],
      "properties": {
        "verificationRequired": {
          "const": true
        }
      }
    },
    "Session": {
      "type": "object",
      "required": [
        "accessToken",
        "user"
      ],
      "properties": {
        "accessToken": {
          "type": "string"
        },
        "user": {
          "$ref": "#/$defs/Profile"
        }
      }
    },
    "Username": {
      "type": "string",
      "minLength": 3,
      "maxLength": 32,
      "pattern": "^[A-Za-z0-9_]+$"
    },
    "Profile": {
      "type": "object",
      "required": [
        "id",
        "username",
        "emailVerified"
      ],
      "properties": {
        "id": {
          "type": "string",
          "format": "uuid"
        },
        "username": {
          "$ref": "#/$defs/Username"
        },
        "displayName": {
          "type": "string",
          "maxLength": 80
        },
        "avatarUrl": {
          "type": "string",
          "format": "uri"
        },
        "emailVerified": {
          "type": "boolean"
        },
        "lastActiveLabel": {
          "enum": [
            "recently",
            "hours_ago",
            "yesterday",
            "older"
          ]
        }
      }
    },
    "ProfileUpdate": {
      "type": "object",
      "properties": {
        "username": {
          "$ref": "#/$defs/Username"
        },
        "displayName": {
          "type": "string",
          "maxLength": 80
        },
        "avatarUrl": {
          "type": "string",
          "format": "uri"
        }
      }
    },
    "Settings": {
      "type": "object",
      "required": [
        "nearbyPortThresholdKm"
      ],
      "properties": {
        "nearbyPortThresholdKm": {
          "type": "number",
          "minimum": 1,
          "maximum": 500,
          "default": 50
        },
        "emailNotifications": {
          "type": "boolean",
          "default": true
        }
      }
    },
    "CruiseCompany": {
      "type": "object",
      "required": [
        "id",
        "name"
      ],
      "properties": {
        "id": {
          "type": "string"
        },
        "name": {
          "type": "string"
        }
      }
    },
    "Ship": {
      "type": "object",
      "required": [
        "id",
        "name",
        "company"
      ],
      "properties": {
        "id": {
          "type": "string"
        },
        "name": {
          "type": "string"
        },
        "company": {
          "$ref": "#/$defs/CruiseCompany"
        }
      }
    },
    "AssignmentInput": {
      "type": "object",
      "required": [
        "companyId",
        "shipId",
        "startDate",
        "endDate"
      ],
      "properties": {
        "companyId": {
          "type": "string"
        },
        "shipId": {
          "type": "string"
        },
        "startDate": {
          "type": "string",
          "format": "date"
        },
        "endDate": {
          "type": "string",
          "format": "date"
        }
      }
    },
    "Assignment": {
      "allOf": [
        {
          "$ref": "#/$defs/AssignmentInput"
        },
        {
          "type": "object",
          "required": [
            "id",
            "createdAt"
          ],
          "properties": {
            "id": {
              "type": "string",
              "format": "uuid"
            },
            "createdAt": {
              "type": "string",
              "format": "date-time"
            }
          }
        }
      ]
    },
    "PortCall": {
      "type": "object",
      "required": [
        "portId",
        "portName",
        "arrivalAt",
        "departureAt",
        "latitude",
        "longitude"
      ],
      "properties": {
        "portId": {
          "type": "string"
        },
        "portName": {
          "type": "string"
        },
        "countryCode": {
          "type": "string"
        },
        "arrivalAt": {
          "type": "string",
          "format": "date-time"
        },
        "departureAt": {
          "type": "string",
          "format": "date-time"
        },
        "latitude": {
          "type": "number"
        },
        "longitude": {
          "type": "number"
        }
      }
    },
    "Itinerary": {
      "type": "object",
      "required": [
        "assignmentId",
        "portCalls"
      ],
      "properties": {
        "assignmentId": {
          "type": "string",
          "format": "uuid"
        },
        "portCalls": {
          "type": "array",
          "items": {
            "$ref": "#/$defs/PortCall"
          }
        },
        "sourceUpdatedAt": {
          "type": "string",
          "format": "date-time"
        }
      }
    },
    "Connection": {
      "type": "object",
      "required": [
        "id",
        "profile",
        "createdAt"
      ],
      "properties": {
        "id": {
          "type": "string",
          "format": "uuid"
        },
        "profile": {
          "$ref": "#/$defs/Profile"
        },
        "createdAt": {
          "type": "string",
          "format": "date-time"
        }
      }
    },
    "ConnectionToken": {
      "type": "object",
      "required": [
        "token",
        "expiresAt"
      ],
      "properties": {
        "token": {
          "type": "string"
        },
        "expiresAt": {
          "type": "string",
          "format": "date-time"
        }
      }
    },
    "BlockInput": {
      "type": "object",
      "required": [
        "userId"
      ],
      "properties": {
        "userId": {
          "type": "string",
          "format": "uuid"
        }
      }
    },
    "Overlap": {
      "type": "object",
      "required": [
        "id",
        "connection",
        "type",
        "lifecycle",
        "startsAt",
        "endsAt"
      ],
      "properties": {
        "id": {
          "type": "string",
          "format": "uuid"
        },
        "connection": {
          "$ref": "#/$defs/Profile"
        },
        "type": {
          "enum": [
            "same_port",
            "nearby_port",
            "same_ship"
          ]
        },
        "lifecycle": {
          "enum": [
            "future",
            "current",
            "expired"
          ]
        },
        "startsAt": {
          "type": "string",
          "format": "date-time"
        },
        "endsAt": {
          "type": "string",
          "format": "date-time"
        },
        "portCalls": {
          "type": "array",
          "items": {
            "$ref": "#/$defs/PortCall"
          }
        },
        "distanceKm": {
          "type": "number"
        },
        "meetingIntent": {
          "$ref": "#/$defs/MeetingIntent"
        }
      }
    },
    "MeetingIntent": {
      "type": "object",
      "required": [
        "status"
      ],
      "properties": {
        "status": {
          "enum": [
            "none",
            "poked",
            "interested",
            "not_interested"
          ]
        },
        "updatedAt": {
          "type": "string",
          "format": "date-time"
        }
      }
    },
    "MeetingIntentResponse": {
      "type": "object",
      "required": [
        "status"
      ],
      "properties": {
        "status": {
          "enum": [
            "interested",
            "not_interested"
          ]
        }
      }
    },
    "Notification": {
      "type": "object",
      "required": [
        "id",
        "type",
        "createdAt",
        "read"
      ],
      "properties": {
        "id": {
          "type": "string",
          "format": "uuid"
        },
        "type": {
          "enum": [
            "overlap_upcoming",
            "poke_received",
            "poke_response"
          ]
        },
        "createdAt": {
          "type": "string",
          "format": "date-time"
        },
        "read": {
          "type": "boolean"
        },
        "overlapId": {
          "type": "string",
          "format": "uuid"
        }
      }
    }
  }
};
export const responses: Record<string, Record<string, object>> = {
  "GET /api/v1/health": {
    "200": {
      "$ref": "#/$defs/Health"
    }
  },
  "POST /api/v1/auth/register": {
    "202": {
      "$ref": "#/$defs/VerificationPending"
    }
  },
  "POST /api/v1/auth/login": {
    "200": {
      "$ref": "#/$defs/Session"
    }
  },
  "POST /api/v1/auth/google": {
    "200": {
      "$ref": "#/$defs/Session"
    }
  },
  "POST /api/v1/auth/verify-email": {},
  "GET /api/v1/me": {
    "200": {
      "$ref": "#/$defs/Profile"
    }
  },
  "PATCH /api/v1/me": {
    "200": {
      "$ref": "#/$defs/Profile"
    }
  },
  "GET /api/v1/settings": {
    "200": {
      "$ref": "#/$defs/Settings"
    }
  },
  "PATCH /api/v1/settings": {
    "200": {
      "$ref": "#/$defs/Settings"
    }
  },
  "GET /api/v1/ships/companies": {
    "200": {
      "type": "array",
      "items": {
        "$ref": "#/$defs/CruiseCompany"
      }
    }
  },
  "GET /api/v1/ships": {
    "200": {
      "type": "array",
      "items": {
        "$ref": "#/$defs/Ship"
      }
    }
  },
  "GET /api/v1/assignments": {
    "200": {
      "type": "array",
      "items": {
        "$ref": "#/$defs/Assignment"
      }
    }
  },
  "POST /api/v1/assignments": {
    "201": {
      "$ref": "#/$defs/Assignment"
    }
  },
  "PATCH /api/v1/assignments/:assignmentId": {
    "200": {
      "$ref": "#/$defs/Assignment"
    }
  },
  "DELETE /api/v1/assignments/:assignmentId": {},
  "GET /api/v1/itinerary": {
    "200": {
      "$ref": "#/$defs/Itinerary"
    }
  },
  "GET /api/v1/connections": {
    "200": {
      "type": "array",
      "items": {
        "$ref": "#/$defs/Connection"
      }
    }
  },
  "POST /api/v1/connections/qr": {
    "201": {
      "$ref": "#/$defs/ConnectionToken"
    }
  },
  "POST /api/v1/connections/claim": {
    "201": {
      "$ref": "#/$defs/Connection"
    }
  },
  "DELETE /api/v1/connections/:connectionId": {},
  "POST /api/v1/blocks": {},
  "GET /api/v1/overlaps": {
    "200": {
      "type": "array",
      "items": {
        "$ref": "#/$defs/Overlap"
      }
    }
  },
  "POST /api/v1/overlaps/:overlapId/poke": {
    "201": {
      "$ref": "#/$defs/MeetingIntent"
    }
  },
  "PATCH /api/v1/overlaps/:overlapId/intent": {
    "200": {
      "$ref": "#/$defs/MeetingIntent"
    }
  },
  "GET /api/v1/notifications": {
    "200": {
      "type": "array",
      "items": {
        "$ref": "#/$defs/Notification"
      }
    }
  }
};
export const requests: Record<string, object> = {
  "POST /api/v1/auth/register": {
    "$ref": "#/$defs/RegisterRequest"
  },
  "POST /api/v1/auth/login": {
    "$ref": "#/$defs/LoginRequest"
  },
  "POST /api/v1/auth/google": {
    "$ref": "#/$defs/GoogleAuthRequest"
  },
  "POST /api/v1/auth/verify-email": {
    "$ref": "#/$defs/TokenRequest"
  },
  "PATCH /api/v1/me": {
    "$ref": "#/$defs/ProfileUpdate"
  },
  "PATCH /api/v1/settings": {
    "$ref": "#/$defs/Settings"
  },
  "POST /api/v1/assignments": {
    "$ref": "#/$defs/AssignmentInput"
  },
  "PATCH /api/v1/assignments/:assignmentId": {
    "$ref": "#/$defs/AssignmentInput"
  },
  "POST /api/v1/connections/claim": {
    "$ref": "#/$defs/TokenRequest"
  },
  "POST /api/v1/blocks": {
    "$ref": "#/$defs/BlockInput"
  },
  "PATCH /api/v1/overlaps/:overlapId/intent": {
    "$ref": "#/$defs/MeetingIntentResponse"
  }
};
