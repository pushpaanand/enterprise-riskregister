export type Theme = 'light' | 'dark' | 'system';

export type RiskStatus =
  | 'Raised'
  | 'Rejected'
  | 'Open'
  | 'Closed'
  | 'In Progress'
  | 'Existing'
  | 'New'
  | 'Downgraded'
  | 'Upgraded'
  | 'Eliminated';

export type RiskImpact = 'Severe' | 'Significant' | 'Moderate' | 'Minor' | 'Negligible';
export type RiskLikelihood = 'Very likely' | 'Likely' | 'Possible' | 'Unlikely' | 'Very Unlikely';

export interface Owner {
  id: string;
  name: string;
  department: string;
}

export interface User {
  id: string;
  name: string;
  email?: string;
  role: 'user' | 'manager' | 'admin' | 'unit_head';
  department?: string; // required for user/manager; optional for admin
  unit?: string; // e.g., KCN, KTN, KCH
  isUnitHead?: boolean;
  employeeId?: string; // 6 digits + @kauveryhospital.com
  assignedDepartments?: string[]; // Array of department names from UserDepartments table
}

export interface Risk {
  id: string;
  riskNo?: string; // e.g., R001 (unique per department)
  description: string;
  category?: string;
  subcategory?: string;
  /** Free text describing current/existing controls in place */
  existingControlInPlace?: string;
  /** identification of assessment: Inherent vs Residual */
  identification?: 'Inherent risk' | 'Residual risk';
  /** Optional plan of action for the risk */
  planOfAction?: string;
  /** Risk indicator */
  riskIndicator?: string;
  /** Business classification status independent from lifecycle status */
  classificationStatus?: 'Existing' | 'New' | 'Downgraded' | 'Upgraded' | 'Eliminated';
  impact: RiskImpact;
  likelihood: RiskLikelihood;
  status: RiskStatus;
  ownerId: string;
  createdByUserId?: string;
  /** Display name of the user who raised the risk (if known from server) */
  raisedByName?: string;
  department?: string; // department owning/raising the risk
  createdAt: string;
  updatedAt: string;
  rejectionReason?: string | null;
}

export interface Incident {
  id: string;
  riskId: string;
  summary?: string;             // Incident Summary
  occurredAt: string;           // Incident Reported Date
  description: string;          // Incident Description
  mitigationSteps?: string;     // Mitigation Steps
  currentStatusText?: string;   // Current Status (free text)
  closedDate?: string | null;   // Closed Date
  createdByUserId?: string;
  department?: string;
  createdAt: string;
  updatedAt: string;
  approvalStatus?: string | null;   // Pending | Approved | Rejected (for user-created flow)
  rejectionReason?: string | null;
}

export interface IncidentHistory {
  id: string;
  incidentId: string;
  changedAt: string;
  changedByUserId?: string;
  fieldName: string;
  oldValue: string | null;
  newValue: string | null;
}