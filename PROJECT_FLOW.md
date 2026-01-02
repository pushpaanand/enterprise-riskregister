# Enterprise Risk Management Dashboard - Project Flow

## 📋 Table of Contents
1. [Architecture Overview](#architecture-overview)
2. [Technology Stack](#technology-stack)
3. [Application Flow](#application-flow)
4. [User Roles & Permissions](#user-roles--permissions)
5. [Data Flow](#data-flow)
6. [Component Structure](#component-structure)
7. [API Structure](#api-structure)
8. [Database Schema](#database-schema)
9. [Authentication Flow](#authentication-flow)
10. [Key Features](#key-features)

---

## 🏗️ Architecture Overview

### Frontend (React + Vite)
- **Location**: Root directory
- **Framework**: React 19.2.1 with TypeScript
- **Build Tool**: Vite 6.2.0
- **State Management**: React Hooks (useState, useEffect, useCallback)
- **Storage**: localStorage for client-side persistence
- **Deployment**: Azure App Service (Static Web App)

### Backend (Next.js API Routes)
- **Location**: `server-next/` directory
- **Framework**: Next.js API Routes
- **Database**: SQL Server (Azure SQL Database)
- **ORM**: mssql (node-mssql)
- **Deployment**: Azure App Service

### Architecture Pattern
```
┌─────────────────┐
│   React Frontend │
│   (Vite + TS)    │
└────────┬─────────┘
         │ HTTP/REST
         │
┌────────▼─────────┐
│  Next.js API     │
│  (API Routes)    │
└────────┬─────────┘
         │
┌────────▼─────────┐
│  SQL Server       │
│  (Azure SQL DB)   │
└───────────────────┘
```

---

## 🛠️ Technology Stack

### Frontend
- **React**: 19.2.1
- **TypeScript**: 5.8.2
- **Vite**: 6.2.0
- **MSAL Browser**: 4.27.0 (Azure AD Authentication)
- **Google GenAI**: 1.28.0 (AI Summary Generation)

### Backend
- **Next.js**: API Routes
- **Node.js**: Express (for static file serving)
- **SQL Server**: Azure SQL Database
- **mssql**: Database connection pool

### Infrastructure
- **Frontend Hosting**: Azure App Service / Static Web Apps
- **Backend Hosting**: Azure App Service
- **Database**: Azure SQL Database
- **Authentication**: Azure AD (MSAL)

---

## 🔄 Application Flow

### 1. Entry Point
```
index.html → index.tsx → App.tsx
```

### 2. Initial Load Sequence
1. **User visits application**
2. **Check authentication**:
   - If not authenticated → Show Login/AzureStaticWebAppsLogin
   - If authenticated → Load user data from localStorage
3. **Load data from API**:
   - Fetch risks (filtered by user role/department)
   - Fetch incidents
   - Fetch users (if admin)
   - Fetch departments
4. **Render appropriate dashboard** based on user role

### 3. Main Application Flow
```
┌─────────────────────────────────────┐
│         App.tsx (Main Router)        │
└──────────────┬──────────────────────┘
               │
    ┌──────────┴──────────┐
    │                     │
┌───▼────┐         ┌──────▼─────┐
│ Login  │         │ Dashboard  │
│ Page   │         │ (Role-based)│
└────────┘         └──────┬─────┘
                          │
        ┌─────────────────┼─────────────────┐
        │                 │                 │
  ┌─────▼─────┐    ┌─────▼─────┐    ┌─────▼─────┐
  │   Admin   │    │  Manager   │    │   User    │
  │ Dashboard │    │ Dashboard  │    │ Dashboard │
  └───────────┘    └───────────┘    └───────────┘
```

---

## 👥 User Roles & Permissions

### 1. **Admin**
- **Access**: Full system access
- **Features**:
  - View all risks across all departments
  - Manage users (CRUD operations)
  - Manage departments
  - Manage owners
  - View reports
  - Filter risks by department and status
  - Approve/reject risks
  - Multi-department assignment for users/managers

### 2. **Manager**
- **Access**: Assigned departments only
- **Features**:
  - View risks from assigned departments
  - Create/edit/delete risks
  - Approve/reject risks
  - Manage incidents
  - View reports for assigned departments
  - Multi-department access with dropdown selection

### 3. **User**
- **Access**: Own risks + assigned departments
- **Features**:
  - Create risks
  - View own risks
  - View risks from assigned departments
  - Edit own risks (if status is 'Raised')
  - Delete own risks (if status is 'Raised')
  - View incidents
  - Multi-department access with dropdown selection

### 4. **Unit Head**
- **Access**: Operations department risks
- **Features**:
  - View operations department risks
  - View reports
  - Email notifications for new risks

---

## 📊 Data Flow

### Risk Management Flow

#### Risk Creation Flow
```
1. User creates risk
   ↓
2. Risk saved to database (Status: 'Raised')
   ↓
3. Manager receives notification (email)
   ↓
4. Manager reviews risk
   ↓
5. Manager approves → Status: 'Open'/'Existing'
   OR
   Manager rejects → Status: 'Rejected' (with reason)
   ↓
6. Risk visible in dashboard
   ↓
7. Incidents can be linked to risks
```

#### Risk Edit Flow - User
```
1. User edits an existing risk
   ↓
2. Changes saved to RiskHistory table (Status: 'Pending Approval')
   ↓
3. Manager receives email notification: "Edit Approval Needed"
   ↓
4. Manager reviews pending edit in RiskHistory
   ↓
5. Manager approves → Changes applied to Risks table
   OR
   Manager rejects → Changes remain in RiskHistory (rejected)
   ↓
6. Updated risk visible in dashboard
   ↓
7. RiskHistory maintains complete audit trail
```

#### Risk Edit Flow - Manager
```
1. Manager edits an existing risk
   ↓
2. Changes saved directly to Risks table
   ↓
3. Changes also recorded in RiskHistory (for audit trail)
   ↓
4. Updated risk immediately visible in dashboard
   ↓
5. No approval required (manager has edit authority)
```

### Incident Management Flow
```
1. User/Manager creates incident
   ↓
2. Incident linked to risk
   ↓
3. Incident saved to database
   ↓
4. Incident history tracked
   ↓
5. Incident can be updated/closed
```

### Data Synchronization
- **Client-side**: localStorage for offline persistence
- **Server-side**: SQL Server database
- **Sync**: On login, data fetched from API
- **Real-time**: Updates via API calls

---

## 🧩 Component Structure

### Main Components

#### **App.tsx** (Root Component)
- Main application router
- State management (risks, users, incidents)
- API integration
- Role-based routing
- Authentication handling

#### **RiskDashboard.tsx**
- Main risk management interface
- Risk matrix visualization
- Risk table with filtering
- KPI cards
- AI summary integration
- Incident management

#### **RiskTable.tsx**
- Displays risks in tabular format
- Sticky header
- Sortable columns
- Action buttons (Edit, Delete, Approve, Reject)
- Incident count display

#### **RiskMatrix.tsx**
- Heatmap visualization
- Impact × Likelihood matrix
- Clickable cells to filter risks
- Total counts per row/column

#### **AdminDashboard.tsx**
- User management
- Department management
- Owner management
- Email configuration

#### **ReportsDashboard.tsx**
- PDF/CSV export functionality
- Risk reports
- Incident reports
- Column selection
- Row filtering

#### **IncidentsTable.tsx**
- Incident listing
- Incident details
- Edit functionality
- Sticky header

### Supporting Components
- **RiskFormModal.tsx**: Create/edit risk form
- **IncidentForm.tsx**: Create/edit incident form
- **Login.tsx**: Local authentication
- **AzureStaticWebAppsLogin.tsx**: Azure AD authentication
- **UserAdminPage.tsx**: User CRUD operations
- **DepartmentAdminPage.tsx**: Department management
- **OwnerAdminPage.tsx**: Owner management

---

## 🔌 API Structure

### Base URL
```
Production: https://riskmanagement-ggb0ard8ekbmfjab.southindia-01.azurewebsites.net/api
```

### API Endpoints

#### Authentication
- `POST /api/auth/login` - Local login
- `POST /api/auth/azure-login` - Azure AD login

#### Risks
- `GET /api/risks?userId={id}&role={role}` - Get risks (filtered by role)
- `POST /api/risks` - Create risk
- `PUT /api/risks/[id]` - Update risk (role-based: user edits go to pending, manager edits save directly)
- `DELETE /api/risks/[id]` - Delete risk
- `GET /api/risks/[id]/history` - Get risk change history
- `GET /api/risks/pending-edits` - Get pending edit approvals (for managers)
- `POST /api/risks/[id]/approve-edit` - Approve pending edit
- `POST /api/risks/[id]/reject-edit` - Reject pending edit

#### Incidents
- `GET /api/incidents?riskId={id}` - Get incidents
- `POST /api/incidents` - Create incident
- `PUT /api/incidents/[id]` - Update incident
- `GET /api/incidents/[id]/history` - Get incident history

#### Users
- `GET /api/users` - Get all users (with assigned departments)
- `POST /api/users` - Create user
- `PUT /api/users/[id]` - Update user
- `DELETE /api/users/[id]` - Delete user
- `GET /api/users/[id]/departments` - Get user's assigned departments
- `POST /api/users/[id]/departments` - Assign departments to user

#### Departments
- `GET /api/departments` - Get all departments
- `POST /api/departments` - Create department
- `PUT /api/departments/[id]` - Update department

#### AI Summary
- `POST /api/ai/summary` - Generate AI-powered risk summary
- `POST /api/ai/ping` - Health check

---

## 🗄️ Database Schema

### Core Tables

#### **Users**
- `UserId` (PK, UNIQUEIDENTIFIER)
- `Name` (NVARCHAR)
- `Email` (NVARCHAR)
- `Role` (NVARCHAR) - 'admin', 'manager', 'user', 'unit_head'
- `DepartmentId` (FK, UNIQUEIDENTIFIER)
- `EmployeeId` (NVARCHAR) - Format: 123456@kauveryhospital.com
- `Unit` (NVARCHAR)
- `IsUnitHead` (BIT)

**Note**: Users can be assigned to multiple departments via `UserDepartments` junction table

#### **UserDepartments** (Junction Table)
- `UserId` (FK, UNIQUEIDENTIFIER)
- `DepartmentId` (FK, UNIQUEIDENTIFIER)
- Many-to-many relationship for multi-department assignment

#### **Departments**
- `DepartmentId` (PK, UNIQUEIDENTIFIER)
- `Name` (NVARCHAR)

#### **Risks**
- `RiskId` (PK, UNIQUEIDENTIFIER)
- `RiskNo` (NVARCHAR) - Auto-generated (e.g., B001, L001)
- `DepartmentId` (FK, UNIQUEIDENTIFIER)
- `Description` (NVARCHAR(MAX))
- `CategoryId` (NVARCHAR(200)) - Stored as string
- `Identification` (NVARCHAR(50)) - 'Inherent risk' or 'Residual risk'
- `RiskIndicator` (NVARCHAR(500)) - Risk identification method
- `ExistingControlInPlace` (NVARCHAR(1000))
- `PlanOfAction` (NVARCHAR(1000))
- `Impact` (NVARCHAR) - 'Severe', 'Significant', 'Moderate', 'Minor', 'Negligible'
- `Likelihood` (NVARCHAR) - 'Very likely', 'Likely', 'Possible', 'Unlikely', 'Very Unlikely'
- `Status` (NVARCHAR) - 'Raised', 'Open', 'Closed', 'Rejected', 'Existing', etc.
- `OwnerId` (FK, UNIQUEIDENTIFIER)
- `CreatedByUserId` (FK, UNIQUEIDENTIFIER)
- `RejectionReason` (NVARCHAR(MAX))
- `CreatedAtUtc` (DATETIME2)
- `UpdatedAtUtc` (DATETIME2)

#### **Incidents**
- `IncidentId` (PK, UNIQUEIDENTIFIER)
- `RiskId` (FK, UNIQUEIDENTIFIER)
- `DepartmentId` (FK, UNIQUEIDENTIFIER)
- `Summary` (NVARCHAR(MAX))
- `OccurredAtUtc` (DATETIME2)
- `Description` (NVARCHAR(MAX))
- `MitigationSteps` (NVARCHAR(MAX))
- `CurrentStatusText` (NVARCHAR(MAX))
- `ClosedDateUtc` (DATETIME2)
- `CreatedByUserId` (FK, UNIQUEIDENTIFIER)

#### **Owners**
- `OwnerId` (PK, UNIQUEIDENTIFIER)
- `Name` (NVARCHAR)
- `DepartmentId` (FK, UNIQUEIDENTIFIER)

### History Tables
- **RiskHistory**: Tracks changes to risks
  - `RiskHistoryId` (PK, UNIQUEIDENTIFIER)
  - `RiskId` (FK, UNIQUEIDENTIFIER)
  - `ChangedAtUtc` (DATETIME2)
  - `ChangedByUserId` (FK, UNIQUEIDENTIFIER)
  - `FieldName` (NVARCHAR) - Which field was changed
  - `OldValue` (NVARCHAR) - Previous value
  - `NewValue` (NVARCHAR) - New value
  - `RejectionReason` (NVARCHAR(1000)) - If applicable
  - `ApprovalStatus` (NVARCHAR) - 'Pending', 'Approved', 'Rejected' (for user edits)
  - `ApprovedByUserId` (FK, UNIQUEIDENTIFIER) - Manager who approved/rejected
  - `ApprovedAtUtc` (DATETIME2) - When approved/rejected
- **IncidentHistory**: Tracks changes to incidents

---

## 🔐 Authentication Flow

### Azure AD Authentication (MSAL)
```
1. User clicks "Sign In"
   ↓
2. Redirected to Azure AD login page
   ↓
3. User authenticates with Microsoft credentials
   ↓
4. Azure AD redirects back with authorization code
   ↓
5. MSAL exchanges code for tokens
   ↓
6. Frontend calls /api/auth/azure-login with user info
   ↓
7. Backend matches EmployeeId with Users table
   ↓
8. Backend returns user data (role, department, etc.)
   ↓
9. Frontend stores user in localStorage
   ↓
10. User redirected to appropriate dashboard
```

### Local Authentication (Fallback)
```
1. User selects name and role from dropdown
   ↓
2. Frontend calls /api/auth/login
   ↓
3. Backend validates and returns user data
   ↓
4. Frontend stores user in localStorage
   ↓
5. User redirected to dashboard
```

---

## ✨ Key Features

### 1. Risk Management
- **Risk Creation**: Users can create risks with full details
- **Risk Matrix**: Visual heatmap showing risk distribution
- **Risk Filtering**: By department, status, impact, likelihood
- **Risk Approval Workflow**: Manager approval/rejection for new risks
- **Risk Edit Approval Workflow**: 
  - User edits require manager approval (saved to RiskHistory as pending)
  - Manager edits save directly to Risks table
  - Email notifications sent to managers for pending edit approvals
- **Risk History**: Track all changes to risks with approval status
- **Auto-numbering**: Risk numbers auto-generated per department (e.g., B001, L001)

### 2. Incident Management
- **Incident Creation**: Link incidents to risks
- **Incident Tracking**: Full lifecycle management
- **Incident History**: Track all changes
- **Status Management**: Open/Closed status tracking

### 3. AI-Powered Summaries
- **Risk Summary**: AI-generated summaries of risks
- **Categorization**: Recent severe risks, old risks, other issues
- **Incident Summary**: AI-generated summaries of incidents
- **Azure OpenAI Integration**: Uses Google GenAI for summaries

### 4. Reporting
- **PDF Export**: Export risks/incidents to PDF
- **CSV Export**: Export risks/incidents to CSV
- **Column Selection**: Choose which columns to export
- **Row Filtering**: Filter data before export

### 5. User Management
- **Multi-Department Assignment**: Users/managers can be assigned to multiple departments
- **Department Dropdown**: Select active department for filtering
- **Role-Based Access**: Different views based on user role
- **Employee ID Management**: Format: 123456@kauveryhospital.com

### 6. Notifications
- **Email Notifications**: Managers notified of new risks
- **Edit Approval Notifications**: Managers notified when users submit risk edits for approval
- **SMTP/Graph API**: Email via Gmail SMTP or Microsoft Graph
- **Unit Head Notifications**: Special notifications for unit heads

### 7. UI/UX Features
- **Dark Mode**: Theme toggle support
- **Sticky Headers**: Table headers remain visible while scrolling
- **Responsive Design**: Works on different screen sizes
- **Auto-scroll**: Automatic scrolling to relevant sections
- **KPI Cards**: Visual risk statistics

---

## 🔄 State Management

### Client-Side State (React Hooks)
- **Risks**: `useState<Risk[]>`
- **Users**: `useState<User[]>`
- **Incidents**: `useState<Incident[]>`
- **Current User**: `useState<User | null>`
- **View State**: Admin/Manager/User view states

### Persistence
- **localStorage**: Client-side persistence
  - `risks`: Risk data
  - `users`: User data
  - `incidents`: Incident data
  - `currentUserId`: Current logged-in user
  - `userRole`, `userName`, `email`, etc.

### Server-Side State
- **SQL Server Database**: Primary data store
- **API Sync**: Data fetched from API on login/refresh

---

## 🚀 Deployment

### Frontend
- **Build**: `npm run build` (Vite)
- **Output**: `dist/` directory
- **Hosting**: Azure App Service / Static Web Apps
- **Static Files**: Served via Express server

### Backend
- **Build**: Next.js build process
- **Hosting**: Azure App Service
- **Runtime**: Node.js
- **Database**: Azure SQL Database

### Environment Variables
- `VITE_API_BASE_URL`: Frontend API base URL
- `DB_SERVER`: SQL Server hostname
- `DB_NAME`: Database name
- `DB_USER`: Database username
- `DB_PASSWORD`: Database password
- `VITE_AAD_CLIENT_ID`: Azure AD client ID
- `VITE_AAD_TENANT_ID`: Azure AD tenant ID
- `VITE_AAD_REDIRECT_URI`: Azure AD redirect URI

---

## 📝 Development Workflow

### Local Development
1. **Frontend**: `npm run dev` (Vite dev server)
2. **Backend**: Run Next.js API routes
3. **Database**: Connect to Azure SQL Database

### Database Migrations
- SQL scripts in `server-next/db/` directory
- Run migrations manually or via deployment scripts
- Examples: `insert_branding_risks.sql`, `alter_risks_*.sql`

### Testing
- Manual testing via browser
- API testing via Postman/curl
- Database queries via SQL Server Management Studio

---

## 🔍 Key Algorithms & Logic

### Risk Number Generation
- Format: `{PREFIX}{NUMBER}` (e.g., B001, L001)
- Prefix derived from department name (2 letters)
- Number auto-incremented per department
- Logic in `server-next/app/api/risks/route.ts`

### Risk Filtering
- **Admin**: All risks (optional department filter)
- **Manager**: Risks from assigned departments
- **User**: Own risks + assigned departments
- **Unit Head**: Operations department risks only

### Multi-Department Assignment
- Junction table: `UserDepartments`
- Users/managers can have multiple departments
- Frontend dropdown to select active department
- Backend filters risks by all assigned departments

### AI Summary Generation
- Categorizes risks into:
  - Recent Severe Risks
  - Old Risks (No Recent Updates)
  - Other Issues (Non-Severe)
- Uses Azure OpenAI / Google GenAI
- Structured format with specific messaging

---

## 📚 File Structure Summary

```
enterprise-risk-management-dashboard/
├── components/          # React components
├── server-next/         # Next.js backend
│   ├── app/api/        # API routes
│   ├── db/             # SQL scripts
│   └── lib/            # Utilities (db.ts)
├── App.tsx             # Main application
├── types.ts            # TypeScript types
├── api.ts              # API configuration
├── index.tsx           # Entry point
└── package.json        # Dependencies
```

---

## 🎯 Future Enhancements (Potential)

1. Real-time updates via WebSockets
2. Advanced analytics and reporting
3. Risk assessment scoring
4. Automated risk alerts
5. Integration with external systems
6. Mobile app support
7. Advanced search and filtering
8. Bulk operations
9. Risk templates
10. Workflow automation

---

## 📞 Support & Maintenance

### Common Issues
- **Authentication**: Check Azure AD configuration
- **Database**: Verify connection strings
- **CORS**: Ensure proper CORS headers in API
- **Build**: Check environment variables

### Logging
- Console logs in frontend (development)
- Server-side logging in Next.js API routes
- Database query logging (optional)

---

*Last Updated: 2025-01-XX*
*Version: 1.0.0*

