export const INITIAL_COMPLAINTS = [
  {
    id: "PR-2026-001",
    category: "Pothole",
    hazardId: "HZ-2026-001",
    location: "Ring Road, Near Lajpat Nagar Flyover, New Delhi",
    latitude: 28.6139,
    longitude: 77.2090,
    severity: "High",
    priority: "High",
    status: "Assigned",
    submittedBy: "Aarav Sharma",
    citizenEmail: "aarav.sharma@example.com",
    submittedDate: "2026-10-08T10:14:22Z",
    assignedDepartment: "PWD Maintenance Division 4",
    assignedTeam: "Rapid Asphalt Repair Unit A",
    workOrderId: "WO-2026-001",
    description: "Deep severe pothole in middle lane posing high risk to two-wheelers.",
    evidenceImage: "https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=600&auto=format&fit=crop&q=80",
    evidenceVideo: "http://localhost:5000/api/evidence/uploads/sample_pothole_video.mp4",
    mediaResourceType: "video",
    videoDetections: [
      { timestamp: 1.2, bbox: [0.22, 0.42, 0.58, 0.72], category: "Pothole (Severe)", confidence: 0.92, severity: "Critical" },
      { timestamp: 3.5, bbox: [0.28, 0.35, 0.62, 0.68], category: "Pothole", confidence: 0.86, severity: "High" },
      { timestamp: 6.0, bbox: [0.18, 0.45, 0.52, 0.75], category: "Rutting Defect", confidence: 0.82, severity: "Medium" }
    ],
    timeline: [
      { status: "Submitted", timestamp: "2026-10-08 10:14 AM", note: "Complaint logged by citizen Aarav Sharma via mobile web." },
      { status: "Under Review", timestamp: "2026-10-08 11:30 AM", note: "Verified against AI field survey detection #HZ-2026-001." },
      { status: "Assigned", timestamp: "2026-10-08 02:15 PM", note: "Assigned to Rapid Asphalt Repair Unit A with target resolution Oct 10." }
    ]
  },
  {
    id: "PR-2026-002",
    category: "Waterlogging",
    hazardId: "HZ-2026-002",
    location: "Barakhamba Road, Connaught Place, New Delhi",
    latitude: 28.6250,
    longitude: 77.2180,
    severity: "Critical",
    priority: "Critical",
    status: "In Progress",
    submittedBy: "Priya Sundaram",
    citizenEmail: "priya.s@example.com",
    submittedDate: "2026-10-08T11:05:10Z",
    assignedDepartment: "Drainage & Stormwater Authority",
    assignedTeam: "Stormwater Drainage Crew #2",
    workOrderId: "WO-2026-002",
    description: "Severe water accumulation due to blocked storm drain causing traffic gridlock.",
    evidenceImage: "https://images.unsplash.com/photo-1541888946425-d0fbb186a5b3?w=600&auto=format&fit=crop&q=80",
    timeline: [
      { status: "Submitted", timestamp: "2026-10-08 11:05 AM", note: "Citizen complaint received." },
      { status: "Under Review", timestamp: "2026-10-08 11:20 AM", note: "Elevated to Critical by Automated AI Sensor network." },
      { status: "Assigned", timestamp: "2026-10-08 12:00 PM", note: "Work order WO-2026-002 dispatched." },
      { status: "In Progress", timestamp: "2026-10-08 01:45 PM", note: "Crew deployed on site with suction pump machinery." }
    ]
  },
  {
    id: "PR-2026-003",
    category: "Fallen Tree",
    hazardId: "HZ-2026-003",
    location: "Lodhi Road, Near India Gate, New Delhi",
    latitude: 28.6012,
    longitude: 77.2295,
    severity: "Critical",
    priority: "Critical",
    status: "Resolved",
    submittedBy: "Rohan Kapoor",
    citizenEmail: "rohan.k@example.com",
    submittedDate: "2026-10-07T16:30:00Z",
    assignedDepartment: "Horticulture & Emergency Response",
    assignedTeam: "Tree Clearance Unit 1",
    workOrderId: "WO-2026-003",
    description: "Large tree branch blocking left lane on main arterial road.",
    evidenceImage: "https://images.unsplash.com/photo-1448375240586-882707db888b?w=600&auto=format&fit=crop&q=80",
    timeline: [
      { status: "Submitted", timestamp: "2026-10-07 04:30 PM", note: "High priority citizen alert submitted." },
      { status: "Under Review", timestamp: "2026-10-07 04:45 PM", note: "Confirmed by Traffic Police feed." },
      { status: "Assigned", timestamp: "2026-10-07 05:00 PM", note: "Dispatched Horticulture crew." },
      { status: "In Progress", timestamp: "2026-10-07 05:30 PM", note: "Chainsaw clearance ongoing." },
      { status: "Resolved", timestamp: "2026-10-07 07:15 PM", note: "Debris cleared, traffic flow restored." }
    ]
  },
  {
    id: "PR-2026-004",
    category: "Road Debris",
    hazardId: "HZ-2026-004",
    location: "Mathura Road, Near Ashram Chowk, New Delhi",
    latitude: 28.5850,
    longitude: 77.2340,
    severity: "Medium",
    priority: "Medium",
    status: "Under Review",
    submittedBy: "Meera Gupta",
    citizenEmail: "meera.g@example.com",
    submittedDate: "2026-10-06T09:20:15Z",
    assignedDepartment: "Municipal Sanitation Department",
    assignedTeam: "Pending",
    workOrderId: null,
    description: "Construction gravel spill across 15 meters of outer lane.",
    evidenceImage: "https://images.unsplash.com/photo-1584467735871-8e85353a8413?w=600&auto=format&fit=crop&q=80",
    timeline: [
      { status: "Submitted", timestamp: "2026-10-06 09:20 AM", note: "Gravel spill report logged." },
      { status: "Under Review", timestamp: "2026-10-06 10:00 AM", note: "Reviewing site responsibility with local contractor." }
    ]
  }
];
