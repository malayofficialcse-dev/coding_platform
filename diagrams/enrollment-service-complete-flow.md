# Enrollment Service — Complete Functional, Sharding, and Replication Flow

## 1. Full system overview

```mermaid
flowchart TD
    User[Student / Admin / Public Verifier]
    Frontend[Frontend Client]
    Gateway[API Gateway]
    Auth[JWT Authentication]
    Enrollment[Enrollment Service]
    Router[User Shard Resolver]
    Course[Course Service]
    CourseDB[(Course MongoDB)]

    User --> Frontend
    Frontend --> Gateway
    Gateway --> Auth
    Auth --> Enrollment

    Enrollment --> Router
    Enrollment --> Course
    Course --> CourseDB

    Router --> Shard0
    Router --> Shard1

    subgraph Shard0[Shard 0 — Existing Neon Enrollment Database]
        MainPrimary[(Main Primary)]
        MainReplica[(Main Read Replica)]
        CertificateDirectory[(certificate_directory table)]
        MainPrimary -->|Neon replication| MainReplica
        MainPrimary --> CertificateDirectory
    end

    subgraph Shard1[Shard 1 — New Neon Enrollment Database]
        Shard1Primary[(Shard 1 Primary)]
        Shard1Read[(Shard 1 Read Endpoint)]
        Shard1Primary -.->|Optional future Neon replication| Shard1Read
    end

    Shard0 --> MainPrimary
    Shard0 --> MainReplica
    Shard1 --> Shard1Primary
    Shard1 --> Shard1Read
```

## 2. Request classification

```mermaid
flowchart TD
    Request[Incoming HTTP request]
    Route{Which endpoint?}

    Request --> Route

    Route -->|POST /enroll| Write[Write operation]
    Route -->|POST /| Write
    Route -->|PATCH /:id/progress| Write
    Route -->|POST /:id/certificate| Write

    Route -->|GET /my| Read[Read operation]
    Route -->|GET /| Read
    Route -->|GET /user/:userId| AdminRead[Admin read]
    Route -->|GET /:id/certificate| CriticalRead[Consistency-sensitive read]
    Route -->|GET /certificate/verify/:number| CertificateRead[Certificate lookup]
```

## 3. Authentication flow

```mermaid
sequenceDiagram
    participant Client
    participant Gateway as API Gateway
    participant Service as Enrollment Service
    participant JWT as JWT Middleware

    Client->>Gateway: Send request with Bearer token
    Gateway->>Service: Forward request
    Service->>JWT: Read Authorization header
    JWT->>JWT: Verify signature and expiration

    alt Token invalid
        JWT-->>Client: 401 Unauthorized
    else Token valid
        JWT->>Service: Attach userId, role, name
        Service->>Service: Continue request processing
    end
```

## 4. Shard selection procedure

```mermaid
flowchart TD
    Request[Authenticated request] --> UserId[Read userId from JWT]
    UserId --> Normalize[Convert userId to stable string]
    Normalize --> Hash[SHA-256 userId]
    Hash --> Number[Read numeric hash value]
    Number --> Modulo[hash % ENROLLMENT_SHARD_COUNT]

    Modulo -->|0| Shard0[Shard 0]
    Modulo -->|1| Shard1[Shard 1]
```

Example:

```text
userId = user-123
SHA-256(user-123) % 2 = 0
Destination = Shard 0
```

The same user always goes to the same shard while the shard count remains unchanged.

## 5. New enrollment flow

```mermaid
sequenceDiagram
    participant Client
    participant Service as Enrollment Service
    participant JWT as JWT Middleware
    participant Router as Shard Resolver
    participant Primary as Selected Shard Primary

    Client->>Service: POST /enroll
    Service->>JWT: Verify access token
    JWT-->>Service: userId and role
    Service->>Service: Validate courseId and days
    Service->>Router: Resolve shard from userId
    Router-->>Service: Shard 0 or Shard 1
    Service->>Primary: Find existing user/course enrollment

    alt Enrollment already exists
        Primary-->>Service: Existing enrollment
        Service->>Primary: Extend expiration date
        Primary-->>Service: Updated enrollment
    else Enrollment does not exist
        Service->>Primary: INSERT enrollment
        Primary-->>Service: New enrollment
    end

    Service-->>Client: Enrollment response
```

## 6. Get my enrollments

```mermaid
sequenceDiagram
    participant Client
    participant Service as Enrollment Service
    participant Router as Shard Resolver
    participant ReadDB as Selected Read Database

    Client->>Service: GET /my
    Service->>Service: Verify JWT
    Service->>Router: Resolve userId shard
    Router-->>Service: Shard ID
    Service->>ReadDB: SELECT enrollments WHERE user = userId
    ReadDB-->>Service: Enrollment rows
    Service->>Service: Attach basic course details
    Service-->>Client: Enrollment list
```

Current routing:

```text
Shard 0 → main read replica
Shard 1 → Shard 1 primary until a replica is provisioned
```

## 7. Admin get enrollments for a user

```mermaid
flowchart TD
    Request[Admin GET /user/:userId] --> Auth[Verify JWT]
    Auth --> Role{Admin role?}
    Role -->|No| Forbidden[403 Forbidden]
    Role -->|Yes| TargetUser[Read target userId]
    TargetUser --> Hash[Resolve target shard]
    Hash --> Read[Read selected shard]
    Read --> Result[Return target user's enrollments]
```

## 8. Progress update flow

```mermaid
sequenceDiagram
    participant Client
    participant Service as Enrollment Service
    participant Router as Shard Resolver
    participant EnrollmentDB as Selected Shard Primary
    participant Course as Course Service

    Client->>Service: PATCH /:enrollmentId/progress
    Service->>Service: Verify JWT
    Service->>Router: Resolve userId shard
    Router-->>Service: Shard ID
    Service->>EnrollmentDB: Find enrollment by id and userId
    EnrollmentDB-->>Service: Enrollment
    Service->>Course: Fetch course structure
    Course-->>Service: Topics and subtopics
    Service->>Service: Validate subtopic belongs to course
    Service->>Service: Add or remove completed subtopic
    Service->>Service: Recalculate progress percentage
    Service->>EnrollmentDB: UPDATE progress and completion data
    EnrollmentDB-->>Service: Updated enrollment
    Service-->>Client: Updated progress
```

## 9. Certificate generation flow

```mermaid
sequenceDiagram
    participant Client
    participant Service as Enrollment Service
    participant Router as Shard Resolver
    participant EnrollmentDB as Selected Shard Primary
    participant Course as Course Service
    participant Directory as Certificate Directory

    Client->>Service: POST /:enrollmentId/certificate
    Service->>Service: Verify JWT
    Service->>Router: Resolve userId shard
    Router-->>Service: Shard ID
    Service->>EnrollmentDB: Load enrollment
    EnrollmentDB-->>Service: Enrollment data
    Service->>Course: Fetch course and subtopics
    Course-->>Service: Course structure
    Service->>Service: Confirm progress is 100%

    alt Course incomplete
        Service-->>Client: 400 Completion required
    else Course completed
        Service->>Service: Generate unique certificate number
        Service->>EnrollmentDB: Save certificate fields
        Service->>Directory: Save certificateNumber → shardId mapping
        Directory-->>Service: Directory saved
        Service-->>Client: Certificate details
    end
```

## 10. Certificate verification flow

```mermaid
flowchart TD
    Request[GET /certificate/verify/:certificateNumber]
    Request --> Directory[Search certificate_directory]
    Directory --> Found{Directory entry found?}

    Found -->|No| Fallback[Search configured shards]
    Found -->|Yes| ShardId[Read shardId from directory]

    ShardId --> CorrectShard[Query enrollment on correct shard]
    Fallback --> CorrectShard
    CorrectShard --> Course[Verify course completion with Course Service]
    Course --> Valid{Progress is 100%?}

    Valid -->|Yes| Authentic[Return valid certificate]
    Valid -->|No| Invalid[Return invalid certificate]
```

## 11. Replication flow

```mermaid
flowchart LR
    Write[Enrollment write]
    Primary[(Neon Primary)]
    WAL[Neon replication / WAL]
    Replica[(Neon Read Replica)]
    Read[Enrollment read]

    Write --> Primary
    Primary --> WAL
    WAL --> Replica
    Read --> Replica
```

Replication rule:

```text
INSERT / UPDATE / DELETE → primary
Safe SELECT → read replica
Certificate and progress operations → primary
```

## 12. Read-after-write behavior

```mermaid
sequenceDiagram
    participant Client
    participant Service
    participant Primary
    participant Replica

    Client->>Service: Create enrollment
    Service->>Primary: INSERT
    Primary-->>Service: Success
    Service-->>Client: Created

    Client->>Service: Immediately request enrollments
    Service->>Service: Use primary for consistency-sensitive request
    Service->>Primary: SELECT
    Primary-->>Service: Newly created enrollment
    Service-->>Client: Enrollment list

    Primary-->>Replica: Replicate asynchronously
```

## 13. Database failure behavior

```mermaid
flowchart TD
    Request[Database request] --> Type{Request type}

    Type -->|Write| WritePrimary{Primary available?}
    WritePrimary -->|Yes| Write[Write to primary]
    WritePrimary -->|No| WriteError[Return retryable error]

    Type -->|Read| ReadReplica{Replica available?}
    ReadReplica -->|Yes| Replica[Read replica]
    ReadReplica -->|No| PrimaryFallback[Read from primary]
```

## 14. Existing data migration flow

```mermaid
flowchart LR
    Existing[(Existing Shard 0 enrollments)]
    ReadRows[Read rows]
    HashUser[Hash each userId]
    Keep0[Keep rows assigned to Shard 0]
    Copy1[Copy rows assigned to Shard 1]
    Shard0[(Shard 0)]
    Shard1[(Shard 1)]
    Verify[Verify counts and checksums]

    Existing --> ReadRows
    ReadRows --> HashUser
    HashUser --> Keep0
    HashUser --> Copy1
    Keep0 --> Shard0
    Copy1 --> Shard1
    Shard0 --> Verify
    Shard1 --> Verify
```

The backfill is idempotent and does not delete the original rows.

## 15. Startup procedure

```mermaid
flowchart TD
    Start[Service starts]
    LoadEnv[Load backend .env]
    BuildConnections[Build Neon connections]
    Connect0[Connect Shard 0 primary]
    Connect0Read[Connect Shard 0 read replica]
    Connect1[Connect Shard 1 primary]
    Connect1Read[Connect Shard 1 read endpoint]
    ConnectDirectory[Connect certificate directory]
    Health[Expose /health/database]
    Listen[Listen on port 5006]

    Start --> LoadEnv
    LoadEnv --> BuildConnections
    BuildConnections --> Connect0
    Connect0 --> Connect0Read
    Connect0Read --> Connect1
    Connect1 --> Connect1Read
    Connect1Read --> ConnectDirectory
    ConnectDirectory --> Health
    Health --> Listen
```

Example startup output:

```text
[Enrollment Service] Connected to main database
[Enrollment Service] Connected to read replica for main database
[Enrollment Service] Connected to sharding database 1
[Enrollment Service] Connected to certificate directory on Neon
[Enrollment Service] Neon PostgreSQL ready (2 shard(s))
[Enrollment Service] Running on port 5006
```

## 16. Environment mapping

```mermaid
flowchart TD
    Env[.env]
    Env --> Count[ENROLLMENT_SHARD_COUNT=2]
    Env --> MainWrite[SHARD_0_WRITE_DATABASE_URL]
    Env --> MainRead[SHARD_0_READ_DATABASE_URL]
    Env --> ShardWrite[SHARD_1_WRITE_DATABASE_URL]
    Env --> ShardRead[SHARD_1_READ_DATABASE_URL]

    MainWrite --> MainPrimary[(Shard 0 Primary)]
    MainRead --> MainReplica[(Shard 0 Replica)]
    ShardWrite --> Shard1Primary[(Shard 1 Primary)]
    ShardRead --> Shard1Read[(Shard 1 Read Endpoint)]
```

## 17. Final operational model

```text
User request
  ↓
JWT verification
  ↓
Extract userId
  ↓
SHA-256(userId) % 2
  ↓
Select Shard 0 or Shard 1
  ↓
Write to primary
  OR
Read from replica/read endpoint
  ↓
Return enrollment result
```

Current database count:

```text
Logical enrollment databases: 2
Neon endpoints: 3
Certificate directory: 1 table inside Shard 0
```
