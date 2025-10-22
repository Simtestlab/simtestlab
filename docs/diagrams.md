# Diagrams

This page demonstrates various PlantUML diagrams that can be used in your documentation.

## Class Diagram

```plantuml
@startuml
class User {
  +String name
  +String email
  +login()
  +logout()
}

class Admin {
  +manageUsers()
  +configureSystem()
}

class Database {
  +connect()
  +query()
  +disconnect()
}

User <|-- Admin
User --> Database : uses
Admin --> Database : manages
@enduml
```

## Sequence Diagram

```plantuml
@startuml
actor User
participant "Web Server" as WS
participant "Application Server" as AS
database "Database" as DB

User -> WS: Login Request
WS -> AS: Authenticate
AS -> DB: Validate Credentials
DB --> AS: User Data
AS --> WS: Authentication Token
WS --> User: Login Success

User -> WS: Access Protected Resource
WS -> AS: Validate Token
AS --> WS: Token Valid
WS --> User: Resource Data
@enduml
```

## Activity Diagram

```plantuml
@startuml
start
:User submits login form;

if (Valid credentials?) then (yes)
  :Generate session token;
  :Store in database;
  :Set cookie;
  :Redirect to dashboard;
else (no)
  :Show error message;
  :Stay on login page;
endif

stop
@enduml
```

## Use Case Diagram

```plantuml
@startuml
left to right direction
actor "End User" as EU
actor "Administrator" as Admin

rectangle "Simtestlab System" {
  EU --> (Browse Documentation)
  EU --> (Search Content)
  EU --> (Download Files)

  Admin --> (Manage Users)
  Admin --> (Configure System)
  Admin --> (Monitor Usage)

  (Manage Users) .> (Configure System) : includes
  (Monitor Usage) .> (Configure System) : extends
}
@enduml
```

## Component Diagram

```plantuml
@startuml
package "Frontend" {
  [Web App] as Web
  [Mobile App] as Mobile
}

package "Backend" {
  [API Gateway] as Gateway
  [Authentication Service] as Auth
  [Content Service] as Content
  [User Service] as UserSvc
}

package "Data Layer" {
  database "PostgreSQL" as DB
  [Redis Cache] as Cache
  [File Storage] as Storage
}

Web --> Gateway
Mobile --> Gateway

Gateway --> Auth
Gateway --> Content
Gateway --> UserSvc

Auth --> DB
Content --> DB
Content --> Cache
Content --> Storage
UserSvc --> DB
@enduml
```

## State Diagram

```plantuml
@startuml
[*] --> Idle

Idle --> Processing : start
Processing --> Completed : success
Processing --> Failed : error

Completed --> [*]
Failed --> Idle : retry
Failed --> [*] : cancel

note right of Processing : System is busy
note right of Failed : Error occurred
@enduml
```

## Entity Relationship Diagram

```plantuml
@startuml
entity "User" as u {
  * id : number <<generated>>
  --
  * name : text
  * email : text <<unique>>
  * created_at : timestamp
  * updated_at : timestamp
}

entity "Project" as p {
  * id : number <<generated>>
  --
  * name : text
  * description : text
  * owner_id : number <<FK>>
  * created_at : timestamp
  * status : text
}

entity "Task" as t {
  * id : number <<generated>>
  --
  * title : text
  * description : text
  * project_id : number <<FK>>
  * assignee_id : number <<FK>>
  * status : text
  * priority : text
  * created_at : timestamp
  * due_date : timestamp
}

u ||--o{ p : owns
p ||--o{ t : contains
u ||--o{ t : assigned
@enduml
```

These diagrams are rendered using PlantUML and can help visualize system architecture, workflows, and relationships in your documentation.