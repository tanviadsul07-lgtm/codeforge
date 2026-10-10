export const INITIAL_WORK_ORDERS = [
  {
    id: "WO-2026-001",
    complaintId: "PR-2026-001",
    hazardCategory: "Pothole",
    location: "Ring Road, Near Lajpat Nagar Flyover, New Delhi",
    assignedDepartment: "PWD Maintenance Division 4",
    assignedTeam: "Rapid Asphalt Repair Unit A",
    officerInCharge: "Er. S. K. Gupta",
    priority: "High",
    status: "In Progress",
    progress: 45,
    targetCompletionDate: "2026-10-10",
    workInstructions: "Cold-mix asphalt patch required. Ensure traffic safety cones installed during peak hours.",
    activityTimeline: [
      { date: "2026-10-08 02:15 PM", text: "Work order created by Dr. Rajesh Verma." },
      { date: "2026-10-09 08:30 AM", text: "Material & equipment dispatched from Depot 3." },
      { date: "2026-10-09 10:15 AM", text: "Surface milling and cleaning completed. Laying binder course." }
    ]
  },
  {
    id: "WO-2026-002",
    complaintId: "PR-2026-002",
    hazardCategory: "Waterlogging",
    location: "Barakhamba Road, Connaught Place, New Delhi",
    assignedDepartment: "Drainage & Stormwater Authority",
    assignedTeam: "Stormwater Drainage Crew #2",
    officerInCharge: "Er. Anita Rao",
    priority: "Critical",
    status: "In Progress",
    progress: 75,
    targetCompletionDate: "2026-10-09",
    workInstructions: "Deploy heavy-duty dewatering pumps. Clear catch basin inlet grates.",
    activityTimeline: [
      { date: "2026-10-08 12:00 PM", text: "Emergency work order issued." },
      { date: "2026-10-08 01:45 PM", text: "Pumping machinery operational." },
      { date: "2026-10-09 09:00 AM", text: "Water level receded by 85%. Drain unblocking ongoing." }
    ]
  },
  {
    id: "WO-2026-003",
    complaintId: "PR-2026-003",
    hazardCategory: "Fallen Tree",
    location: "Lodhi Road, Near India Gate, New Delhi",
    assignedDepartment: "Horticulture & Emergency Response",
    assignedTeam: "Tree Clearance Unit 1",
    officerInCharge: "Ramanathan P.",
    priority: "Critical",
    status: "Completed",
    progress: 100,
    targetCompletionDate: "2026-10-07",
    workInstructions: "Cut trunk using heavy hydraulic saws. Clear debris from carriageway.",
    activityTimeline: [
      { date: "2026-10-07 05:00 PM", text: "Dispatched crew to location." },
      { date: "2026-10-07 07:15 PM", text: "Road cleared completely and signed off by Traffic Control." }
    ]
  }
];
