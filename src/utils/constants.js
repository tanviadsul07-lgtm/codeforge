export const APP_INFO = {
  name: "PathRakshak AI",
  tagline: "Your Intelligent Road Protector",
  version: "1.0.0",
  demoNotice: "DEMO MODE ACTIVE — Local simulation data only"
};

export const ROLES = {
  CITIZEN: "citizen",
  FIELD_OPERATOR: "field-operator",
  DEPARTMENT_OFFICER: "department-officer",
  ADMIN: "admin"
};

export const ROLE_LABELS = {
  [ROLES.CITIZEN]: "Citizen",
  [ROLES.FIELD_OPERATOR]: "Field Operator",
  [ROLES.DEPARTMENT_OFFICER]: "Road Department Officer",
  [ROLES.ADMIN]: "System Administrator"
};

export const HAZARD_CATEGORIES = [
  "Pothole",
  "Waterlogging",
  "Fallen Tree",
  "Road Debris",
  "Road Blockage"
];

export const COMPLAINT_STATUSES = [
  "Submitted",
  "Verified",
  "Assigned",
  "In Progress",
  "Awaiting Approval",
  "Resolved",
  "Rejected"
];

export const PRIORITIES = [
  "Low",
  "Medium",
  "High",
  "Critical"
];

