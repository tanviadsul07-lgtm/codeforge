export const INITIAL_NOTIFICATIONS = [
  {
    id: "notif-1",
    title: "Complaint Status Updated",
    message: "Your complaint PR-2026-001 (Pothole at Ring Road) has been assigned to Rapid Asphalt Repair Unit A.",
    timestamp: "10 mins ago",
    read: false,
    type: "info",
    role: "citizen",
    link: "/citizen/complaints/PR-2026-001"
  },
  {
    id: "notif-2",
    title: "AI Analysis Complete",
    message: "Survey session SUR-2026-101 processing complete. 2 high-severity hazards detected.",
    timestamp: "1 hour ago",
    read: false,
    type: "success",
    role: "field-operator",
    link: "/operator/results/SUR-2026-101"
  },
  {
    id: "notif-3",
    title: "Critical Priority Escalation",
    message: "Complaint PR-2026-002 (Waterlogging at Barakhamba Rd) elevated to CRITICAL severity.",
    timestamp: "2 hours ago",
    read: false,
    type: "warning",
    role: "department-officer",
    link: "/department/complaints/PR-2026-002/review"
  },
  {
    id: "notif-4",
    title: "Work Order Completed",
    message: "Work Order WO-2026-003 (Fallen Tree at Lodhi Road) marked RESOLVED by Horticulture Team.",
    timestamp: "Yesterday",
    read: true,
    type: "success",
    role: "department-officer",
    link: "/department/complaints/PR-2026-003"
  }
];
