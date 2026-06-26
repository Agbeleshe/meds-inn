// Meds-inn Demo Data — consistent across all pages

export type Role = 'admin' | 'nurse' | 'doctor' | 'mother';
export type RiskLevel = 'low' | 'moderate' | 'high';
export type AppointmentStatus = 'scheduled' | 'completed' | 'missed' | 'cancelled';
export type PatientStatus = 'active-pregnancy' | 'postpartum' | 'new' | 'missed-followup';

export const HOSPITAL = {
  name: 'Elara Women\'s Specialist Clinic',
  shortName: 'Elara WSC',
  id: 'ELR',
  location: 'Global Demo',
};

export const ROLES = [
  {
    id: 'admin' as Role,
    label: 'Hospital Admin',
    name: 'Diana Harrington',
    initials: 'DH',
    description: 'Manage your maternal care program, team activity, and patient follow-up from one calm command center.',
    email: 'diana.harrington@elara-wsc.com',
  },
  {
    id: 'nurse' as Role,
    label: 'Nurse / Midwife',
    name: 'Nurse Elena Costa',
    initials: 'EC',
    description: 'See the mothers who need you today, review care briefs, and continue support between visits.',
    email: 'elena.costa@elara-wsc.com',
  },
  {
    id: 'doctor' as Role,
    label: 'Doctor',
    name: 'Dr. Priya Sharma',
    initials: 'PS',
    description: 'Review patient status, conduct video consultations, and approve care plans with clinical clarity.',
    email: 'priya.sharma@elara-wsc.com',
  },
  {
    id: 'mother' as Role,
    label: 'Mother / Patient',
    name: 'Sofia Marchetti',
    initials: 'SM',
    description: 'Follow your care journey, appointments, reminders, and baby milestones in one reassuring space.',
    email: 'sofia.marchetti@patient.elara-wsc.com',
  },
];

export interface TeamMember {
  id: string;
  name: string;
  role: 'admin' | 'doctor' | 'nurse';
  specialty: string;
  initials: string;
  assignedMothers: number;
  activeFollowUps: number;
  workloadPct: number;
  status: 'active' | 'away' | 'offline';
  email: string;
  phone: string;
  lastActive: string;
  permission: string;
}

export const TEAM_MEMBERS: TeamMember[] = [
  { id: 'tm1', name: 'Diana Harrington', role: 'admin', specialty: 'Clinic Administrator', initials: 'DH', assignedMothers: 0, activeFollowUps: 0, workloadPct: 40, status: 'active', email: 'diana.harrington@elara-wsc.com', phone: '+1 212 555 0170', lastActive: '2h ago', permission: 'Full Access' },
  { id: 'tm2', name: 'Nurse Elena Costa', role: 'nurse', specialty: 'Senior Midwife', initials: 'EC', assignedMothers: 14, activeFollowUps: 8, workloadPct: 92, status: 'active', email: 'elena.costa@elara-wsc.com', phone: '+44 20 7946 0781', lastActive: '45 min ago', permission: 'Patient Care' },
  { id: 'tm3', name: 'Nurse Aisha Rahman', role: 'nurse', specialty: 'Maternal Care Nurse', initials: 'AR', assignedMothers: 11, activeFollowUps: 5, workloadPct: 72, status: 'active', email: 'aisha.rahman@elara-wsc.com', phone: '+61 2 9876 5432', lastActive: '1.5h ago', permission: 'Patient Care' },
  { id: 'tm4', name: 'Nurse Linda Park', role: 'nurse', specialty: 'Postpartum Care', initials: 'LP', assignedMothers: 9, activeFollowUps: 4, workloadPct: 68, status: 'away', email: 'linda.park@elara-wsc.com', phone: '+1 416 555 0903', lastActive: 'Yesterday 5:00 PM', permission: 'Patient Care' },
  { id: 'tm5', name: 'Dr. Priya Sharma', role: 'doctor', specialty: 'Obstetrician', initials: 'PS', assignedMothers: 18, activeFollowUps: 6, workloadPct: 85, status: 'active', email: 'priya.sharma@elara-wsc.com', phone: '+44 20 7946 0914', lastActive: '1h ago', permission: 'Clinical Full' },
  { id: 'tm6', name: 'Dr. Mei Lin Zhang', role: 'doctor', specialty: 'Pediatrician', initials: 'MZ', assignedMothers: 22, activeFollowUps: 7, workloadPct: 88, status: 'active', email: 'meilin.zhang@elara-wsc.com', phone: '+65 6555 0125', lastActive: '30 min ago', permission: 'Clinical Full' },
  { id: 'tm7', name: 'Dr. Carlos Rivera', role: 'doctor', specialty: 'Family Physician', initials: 'CR', assignedMothers: 7, activeFollowUps: 2, workloadPct: 55, status: 'active', email: 'carlos.rivera@elara-wsc.com', phone: '+34 91 555 0236', lastActive: '3h ago', permission: 'Clinical Full' },
];

export const PATIENTS = [
  {
    id: 'MED-ELR-24018',
    name: 'Sofia Marchetti',
    initials: 'SM',
    age: 29,
    gestationalWeek: 24,
    trimester: 'Second',
    riskLevel: 'moderate' as RiskLevel,
    status: 'active-pregnancy' as PatientStatus,
    nurse: 'Elena Costa',
    doctor: 'Dr. Priya Sharma',
    lastCheckIn: '2026-06-20',
    nextAppointment: '2026-06-28',
    adherence: 89,
    edd: '2026-10-14',
    bloodGroup: 'O+',
    allergies: 'Penicillin',
    phone: '+39 02 555 0100',
    concerns: ['Fatigue', 'Occasional dizziness'],
    emergencyContact: 'Marco Marchetti',
  },
  {
    id: 'MED-ELR-24031',
    name: 'Yuki Tanaka',
    initials: 'YT',
    age: 26,
    gestationalWeek: 32,
    trimester: 'Third',
    riskLevel: 'low' as RiskLevel,
    status: 'active-pregnancy' as PatientStatus,
    nurse: 'Aisha Rahman',
    doctor: 'Dr. Priya Sharma',
    lastCheckIn: '2026-06-22',
    nextAppointment: '2026-07-02',
    adherence: 96,
    edd: '2026-08-10',
    bloodGroup: 'A+',
    allergies: 'None',
    phone: '+81 3 5555 0200',
    concerns: [],
    emergencyContact: 'Kenji Tanaka',
  },
  {
    id: 'MED-ELR-24005',
    name: 'Camille Dubois',
    initials: 'CD',
    age: 31,
    gestationalWeek: 36,
    trimester: 'Third',
    riskLevel: 'high' as RiskLevel,
    status: 'active-pregnancy' as PatientStatus,
    nurse: 'Elena Costa',
    doctor: 'Dr. Priya Sharma',
    lastCheckIn: '2026-06-24',
    nextAppointment: '2026-06-27',
    adherence: 74,
    edd: '2026-07-18',
    bloodGroup: 'B+',
    allergies: 'Sulfa',
    phone: '+33 1 5555 0300',
    concerns: ['Elevated blood pressure', 'Swelling'],
    emergencyContact: 'Pierre Dubois',
  },
  {
    id: 'MED-ELR-24042',
    name: 'Layla Al-Hassan',
    initials: 'LH',
    age: 24,
    gestationalWeek: 12,
    trimester: 'First',
    riskLevel: 'low' as RiskLevel,
    status: 'new' as PatientStatus,
    nurse: 'Aisha Rahman',
    doctor: 'Dr. Carlos Rivera',
    lastCheckIn: '2026-06-18',
    nextAppointment: '2026-07-05',
    adherence: 100,
    edd: '2026-12-20',
    bloodGroup: 'O-',
    allergies: 'None',
    phone: '+971 4 555 0400',
    concerns: [],
    emergencyContact: 'Omar Al-Hassan',
  },
  {
    id: 'MED-ELR-23098',
    name: 'Grace Nwachukwu',
    initials: 'GN',
    age: 34,
    gestationalWeek: 0,
    trimester: 'Postpartum',
    riskLevel: 'low' as RiskLevel,
    status: 'postpartum' as PatientStatus,
    nurse: 'Linda Park',
    doctor: 'Dr. Mei Lin Zhang',
    lastCheckIn: '2026-06-15',
    nextAppointment: '2026-07-10',
    adherence: 91,
    edd: '2026-06-02',
    bloodGroup: 'AB+',
    allergies: 'None',
    phone: '+44 20 7946 0500',
    concerns: [],
    emergencyContact: 'Chidi Nwachukwu',
  },
  {
    id: 'MED-ELR-24012',
    name: 'Ana Rodrigues',
    initials: 'AR',
    age: 28,
    gestationalWeek: 20,
    trimester: 'Second',
    riskLevel: 'moderate' as RiskLevel,
    status: 'missed-followup' as PatientStatus,
    nurse: 'Elena Costa',
    doctor: 'Dr. Priya Sharma',
    lastCheckIn: '2026-06-08',
    nextAppointment: '2026-06-26',
    adherence: 62,
    edd: '2026-10-28',
    bloodGroup: 'A-',
    allergies: 'Aspirin',
    phone: '+55 11 5555 0600',
    concerns: ['Low adherence', 'Missed last visit'],
    emergencyContact: 'João Rodrigues',
  },
  {
    id: 'MED-ELR-24027',
    name: 'Sarah Mitchell',
    initials: 'SM',
    age: 32,
    gestationalWeek: 28,
    trimester: 'Third',
    riskLevel: 'high' as RiskLevel,
    status: 'active-pregnancy' as PatientStatus,
    nurse: 'Aisha Rahman',
    doctor: 'Dr. Priya Sharma',
    lastCheckIn: '2026-06-21',
    nextAppointment: '2026-06-28',
    adherence: 78,
    edd: '2026-09-05',
    bloodGroup: 'B-',
    allergies: 'Latex',
    phone: '+1 617 555 0700',
    concerns: ['Gestational diabetes monitoring'],
    emergencyContact: 'James Mitchell',
  },
  {
    id: 'MED-ELR-24033',
    name: 'Fatou Diallo',
    initials: 'FD',
    age: 27,
    gestationalWeek: 8,
    trimester: 'First',
    riskLevel: 'low' as RiskLevel,
    status: 'new' as PatientStatus,
    nurse: 'Linda Park',
    doctor: 'Dr. Carlos Rivera',
    lastCheckIn: '2026-06-20',
    nextAppointment: '2026-07-08',
    adherence: 95,
    edd: '2027-02-14',
    bloodGroup: 'O+',
    allergies: 'None',
    phone: '+33 1 5555 0800',
    concerns: [],
    emergencyContact: 'Moussa Diallo',
  },
  {
    id: 'MED-ELR-23115',
    name: 'Ji-Yeon Kim',
    initials: 'JK',
    age: 30,
    gestationalWeek: 0,
    trimester: 'Postpartum',
    riskLevel: 'moderate' as RiskLevel,
    status: 'postpartum' as PatientStatus,
    nurse: 'Linda Park',
    doctor: 'Dr. Mei Lin Zhang',
    lastCheckIn: '2026-06-12',
    nextAppointment: '2026-06-30',
    adherence: 83,
    edd: '2026-05-20',
    bloodGroup: 'A+',
    allergies: 'Codeine',
    phone: '+82 2 5555 0900',
    concerns: ['Postpartum check pending'],
    emergencyContact: 'Park Jae-Won',
  },
  {
    id: 'MED-ELR-24019',
    name: 'Amara Diop',
    initials: 'AD',
    age: 25,
    gestationalWeek: 16,
    trimester: 'Second',
    riskLevel: 'low' as RiskLevel,
    status: 'active-pregnancy' as PatientStatus,
    nurse: 'Aisha Rahman',
    doctor: 'Dr. Priya Sharma',
    lastCheckIn: '2026-06-19',
    nextAppointment: '2026-07-03',
    adherence: 98,
    edd: '2026-12-01',
    bloodGroup: 'O+',
    allergies: 'None',
    phone: '+221 33 555 1000',
    concerns: [],
    emergencyContact: 'Ibrahima Diop',
  },
  {
    id: 'MED-ELR-24025',
    name: 'Isabel Torres',
    initials: 'IT',
    age: 33,
    gestationalWeek: 30,
    trimester: 'Third',
    riskLevel: 'moderate' as RiskLevel,
    status: 'missed-followup' as PatientStatus,
    nurse: 'Elena Costa',
    doctor: 'Dr. Priya Sharma',
    lastCheckIn: '2026-06-10',
    nextAppointment: '2026-06-27',
    adherence: 70,
    edd: '2026-08-28',
    bloodGroup: 'B+',
    allergies: 'None',
    phone: '+34 91 555 1100',
    concerns: ['Missed last 2 check-ins'],
    emergencyContact: 'Andrés Torres',
  },
  {
    id: 'MED-ELR-24038',
    name: 'Preethi Nair',
    initials: 'PN',
    age: 22,
    gestationalWeek: 6,
    trimester: 'First',
    riskLevel: 'low' as RiskLevel,
    status: 'new' as PatientStatus,
    nurse: 'Aisha Rahman',
    doctor: 'Dr. Carlos Rivera',
    lastCheckIn: '2026-06-23',
    nextAppointment: '2026-07-10',
    adherence: 100,
    edd: '2027-03-02',
    bloodGroup: 'A+',
    allergies: 'None',
    phone: '+91 22 5555 1200',
    concerns: [],
    emergencyContact: 'Rajesh Nair',
  },
];

export const APPOINTMENTS = [
  { id: 'apt1', patientId: 'MED-ELR-24018', patient: 'Sofia Marchetti', type: 'Antenatal Visit', clinician: 'Dr. Priya Sharma', date: '2026-06-28', time: '10:00 AM', mode: 'in-person', status: 'scheduled' as AppointmentStatus, reason: 'Routine 24-week check, blood pressure review, growth scan', duration: 45, location: 'Suite 3, Elara WSC' },
  { id: 'apt2', patientId: 'MED-ELR-24031', patient: 'Yuki Tanaka', type: 'Third Trimester Review', clinician: 'Dr. Priya Sharma', date: '2026-07-02', time: '11:30 AM', mode: 'in-person', status: 'scheduled' as AppointmentStatus, reason: 'Birth plan discussion and final preparations', duration: 60, location: 'Suite 1, Elara WSC' },
  { id: 'apt3', patientId: 'MED-ELR-24005', patient: 'Camille Dubois', type: 'High-Risk Review', clinician: 'Dr. Priya Sharma', date: '2026-06-27', time: '9:00 AM', mode: 'in-person', status: 'scheduled' as AppointmentStatus, reason: 'Blood pressure monitoring, pre-eclampsia assessment', duration: 60, location: 'Suite 2, Elara WSC' },
  { id: 'apt4', patientId: 'MED-ELR-24012', patient: 'Ana Rodrigues', type: 'Nurse Follow-up', clinician: 'Nurse Elena Costa', date: '2026-06-26', time: '2:00 PM', mode: 'virtual', status: 'scheduled' as AppointmentStatus, reason: 'Missed visit follow-up and adherence review', duration: 30, location: 'Video Call' },
  { id: 'apt5', patientId: 'MED-ELR-24027', patient: 'Sarah Mitchell', type: 'Diabetes Monitoring', clinician: 'Dr. Priya Sharma', date: '2026-06-28', time: '3:30 PM', mode: 'in-person', status: 'scheduled' as AppointmentStatus, reason: 'Gestational diabetes glucose review', duration: 45, location: 'Suite 3, Elara WSC' },
  { id: 'apt6', patientId: 'MED-ELR-24018', patient: 'Sofia Marchetti', type: 'Antenatal Visit', clinician: 'Dr. Priya Sharma', date: '2026-06-20', time: '10:00 AM', mode: 'in-person', status: 'completed' as AppointmentStatus, reason: 'Routine 22-week check, fundal height measurement', duration: 45, location: 'Suite 3, Elara WSC' },
  { id: 'apt7', patientId: 'MED-ELR-24012', patient: 'Ana Rodrigues', type: 'Antenatal Visit', clinician: 'Dr. Priya Sharma', date: '2026-06-14', time: '11:00 AM', mode: 'in-person', status: 'missed' as AppointmentStatus, reason: 'Scheduled 18-week review', duration: 45, location: 'Suite 1, Elara WSC' },
  { id: 'apt8', patientId: 'MED-ELR-24025', patient: 'Isabel Torres', type: 'Check-In Call', clinician: 'Nurse Elena Costa', date: '2026-06-17', time: '1:00 PM', mode: 'virtual', status: 'missed' as AppointmentStatus, reason: 'Routine nurse check-in', duration: 20, location: 'Phone Call' },
  { id: 'apt9', patientId: 'MED-ELR-23098', patient: 'Grace Nwachukwu', type: 'Postpartum Visit', clinician: 'Dr. Mei Lin Zhang', date: '2026-07-10', time: '9:30 AM', mode: 'in-person', status: 'scheduled' as AppointmentStatus, reason: '6-week postpartum review and baby wellness check', duration: 60, location: 'Suite 4, Elara WSC' },
  { id: 'apt10', patientId: 'MED-ELR-24019', patient: 'Amara Diop', type: 'Second Trimester Scan', clinician: 'Dr. Priya Sharma', date: '2026-07-03', time: '10:30 AM', mode: 'in-person', status: 'scheduled' as AppointmentStatus, reason: 'Anomaly scan and anatomy review', duration: 60, location: 'Imaging Suite, Elara WSC' },
];

export const MEDICATIONS = [
  { id: 'med1', name: 'Ferrous Sulfate', dosage: '200mg', frequency: 'Twice daily', route: 'Oral', instructions: 'Take with water after meals. Avoid taking with dairy products or antacids.', startDate: '2026-04-01', endDate: '2026-10-14', prescribedBy: 'Dr. Priya Sharma', adherence: 91, missedDoses: 4, lastTaken: '2026-06-25T08:00:00', notes: 'Monitor for GI discomfort. Dark stool is normal.', patientId: 'MED-ELR-24018' },
  { id: 'med2', name: 'Folic Acid', dosage: '400mcg', frequency: 'Once daily', route: 'Oral', instructions: 'Take in the morning with breakfast.', startDate: '2026-02-01', endDate: '2026-10-14', prescribedBy: 'Dr. Priya Sharma', adherence: 97, missedDoses: 1, lastTaken: '2026-06-25T07:30:00', notes: 'Continue throughout pregnancy.', patientId: 'MED-ELR-24018' },
  { id: 'med3', name: 'Calcium Carbonate', dosage: '500mg', frequency: 'Once daily', route: 'Oral', instructions: 'Take in the evening. Do not take at the same time as iron supplements.', startDate: '2026-04-01', endDate: '2026-10-14', prescribedBy: 'Dr. Priya Sharma', adherence: 85, missedDoses: 8, lastTaken: '2026-06-24T20:00:00', notes: 'Space at least 2 hours apart from iron.', patientId: 'MED-ELR-24018' },
  { id: 'med4', name: 'Vitamin D3', dosage: '1000 IU', frequency: 'Once daily', route: 'Oral', instructions: 'Take with a meal containing fat for better absorption.', startDate: '2026-04-01', endDate: '2026-10-14', prescribedBy: 'Dr. Priya Sharma', adherence: 88, missedDoses: 6, lastTaken: '2026-06-25T07:30:00', notes: 'Check levels at 28-week visit.', patientId: 'MED-ELR-24018' },
];

export interface Message {
  id: string;
  from: string;
  role: string;
  initials: string;
  subject: string;
  preview: string;
  time: string;
  read: boolean;
  urgent: boolean;
  tag: string;
  thread: { from: string; role: string; time: string; text: string }[];
}

export const MESSAGES: Message[] = [
  {
    id: 'msg1',
    from: 'Nurse Elena Costa',
    role: 'Nurse / Midwife',
    initials: 'EC',
    subject: 'How are you feeling today?',
    preview: 'Just checking in on your fatigue and dizziness…',
    time: 'Jun 24',
    read: true,
    urgent: false,
    tag: 'Check-in',
    thread: [
      { from: 'Nurse Elena Costa', role: 'Nurse', time: 'Jun 24, 10:30 AM', text: "Hi Sofia, just checking in. I saw you logged fatigue and mild dizziness earlier this week. Make sure you're resting between tasks and drinking enough water. If the dizziness continues or worsens, please contact us immediately. See you at your appointment on the 28th!" },
      { from: 'Sofia Marchetti', role: 'Patient', time: 'Jun 24, 11:45 AM', text: "Thank you Nurse Elena. I've been resting more and drinking more water. The dizziness has been a bit better today. I'll make sure to mention it at the appointment on Saturday." },
      { from: 'Nurse Elena Costa', role: 'Nurse', time: 'Jun 24, 12:00 PM', text: "Glad to hear it. If anything worsens before Saturday, please don't hesitate to call us. Take care!" },
    ],
  },
  {
    id: 'msg2',
    from: 'Nurse Elena Costa',
    role: 'Nurse / Midwife',
    initials: 'EC',
    subject: 'Reminder: Iron supplement spacing',
    preview: 'Please take your iron at least 2 hours apart from calcium…',
    time: 'Jun 23',
    read: true,
    urgent: false,
    tag: 'Reminder',
    thread: [
      { from: 'Nurse Elena Costa', role: 'Nurse', time: 'Jun 23, 9:00 AM', text: "Quick reminder — please take your iron supplement at least 2 hours apart from your calcium. This helps your body absorb the iron better. Your adherence has been great!" },
    ],
  },
  {
    id: 'msg3',
    from: 'Nurse Elena Costa',
    role: 'Nurse / Midwife',
    initials: 'EC',
    subject: 'Missed visit follow-up — Ana Rodrigues',
    preview: 'We noticed Ana missed her appointment on June 14th…',
    time: 'Jun 22',
    read: false,
    urgent: true,
    tag: 'Follow-up',
    thread: [
      { from: 'Nurse Elena Costa', role: 'Nurse', time: 'Jun 22, 2:00 PM', text: "Hi Ana, we noticed you missed your appointment on June 14th. Your care is important to us — please reach out so we can reschedule. We've booked a virtual check-in for June 26th at 2:00 PM. Please confirm." },
    ],
  },
  {
    id: 'msg4',
    from: 'Dr. Priya Sharma',
    role: 'Obstetrician',
    initials: 'PS',
    subject: 'Camille Dubois — BP review needed urgently',
    preview: "Camille's blood pressure was 140/90 at last visit…",
    time: 'Jun 24',
    read: false,
    urgent: true,
    tag: 'Clinical',
    thread: [
      { from: 'Dr. Priya Sharma', role: 'Doctor', time: 'Jun 24, 4:30 PM', text: "Elena, Camille's blood pressure reading from last visit was 140/90. Please contact her today and ensure she comes in as scheduled tomorrow. If you can't reach her, escalate to me directly." },
    ],
  },
  {
    id: 'msg5',
    from: 'Sofia Marchetti',
    role: 'Patient',
    initials: 'SM',
    subject: 'Question about my GTT appointment',
    preview: "Hi, I wanted to ask when I should schedule the glucose test…",
    time: 'Jun 25',
    read: false,
    urgent: false,
    tag: 'Patient query',
    thread: [
      { from: 'Sofia Marchetti', role: 'Patient', time: 'Jun 25, 8:15 AM', text: "Hi, I wanted to ask when I should schedule the glucose tolerance test. My app shows it's due before July 15th — should I call the clinic or can I book it here?" },
    ],
  },
];

export const LAB_RESULTS = [
  { id: 'lab1', test: 'Full Blood Count (FBC)', date: '2026-06-20', result: 'Haemoglobin: 10.8 g/dL', status: 'reviewed', flag: 'mild-concern', notes: 'Slightly below normal range. Continue iron supplementation. Recheck at 28 weeks.', orderedBy: 'Dr. Priya Sharma' },
  { id: 'lab2', test: 'Blood Glucose (Fasting)', date: '2026-06-20', result: '4.2 mmol/L', status: 'reviewed', flag: 'normal', notes: 'Within normal range.', orderedBy: 'Dr. Priya Sharma' },
  { id: 'lab3', test: 'Urinalysis', date: '2026-06-20', result: 'Protein: Trace. Glucose: Negative', status: 'reviewed', flag: 'normal', notes: 'Trace protein — monitor. No action required at this time.', orderedBy: 'Dr. Priya Sharma' },
  { id: 'lab4', test: 'Hepatitis B Surface Antigen', date: '2026-04-10', result: 'Negative', status: 'reviewed', flag: 'normal', notes: 'Negative — no intervention required.', orderedBy: 'Dr. Priya Sharma' },
];

export interface Document {
  id: string;
  name: string;
  category: string;
  date: string;
  uploadedBy: string;
  size: string;
  type: string;
  status: 'reviewed' | 'pending' | 'archived' | 'signed';
}

export const DOCUMENTS: Document[] = [
  { id: 'doc1', name: '20-Week Anomaly Scan Report', category: 'Ultrasound', date: '2026-06-01', uploadedBy: 'Imaging Suite, Elara WSC', size: '2.4 MB', type: 'PDF', status: 'reviewed' },
  { id: 'doc2', name: 'Full Blood Count — June 20', category: 'Lab Results', date: '2026-06-20', uploadedBy: 'Lab Services', size: '0.8 MB', type: 'PDF', status: 'reviewed' },
  { id: 'doc3', name: 'Booking Visit Summary', category: 'Care Notes', date: '2026-02-10', uploadedBy: 'Nurse Esther Okonkwo', size: '0.3 MB', type: 'PDF', status: 'reviewed' },
  { id: 'doc4', name: 'Consent Form — Antenatal Care', category: 'Consent', date: '2026-02-10', uploadedBy: 'Deborah Hassan', size: '0.2 MB', type: 'PDF', status: 'reviewed' },
  { id: 'doc5', name: 'Urinalysis Report — June 20', category: 'Lab Results', date: '2026-06-20', uploadedBy: 'Lab Services', size: '0.5 MB', type: 'PDF', status: 'reviewed' },
  { id: 'doc6', name: '12-Week Dating Scan', category: 'Ultrasound', date: '2026-04-10', uploadedBy: 'Imaging Suite, Elara WSC', size: '1.9 MB', type: 'PDF', status: 'reviewed' },
  { id: 'doc7', name: 'Iron Deficiency Anaemia — Clinical Note', category: 'Medical Records', date: '2026-06-20', uploadedBy: 'Dr. Tolu Adebayo', size: '0.4 MB', type: 'PDF', status: 'reviewed' },
  { id: 'doc8', name: 'Discharge Summary — May Visit', category: 'Discharge', date: '2026-05-15', uploadedBy: 'Elara WSC Admin', size: '0.6 MB', type: 'PDF', status: 'reviewed' },
];

export const DASHBOARD_METRICS = {
  totalMothers: 84,
  activePregnancies: 61,
  highRiskCases: 9,
  todayAppointments: 7,
  missedFollowUps: 5,
  postpartumMothers: 14,
  babiesFirstYear: 11,
  vaccinationAdherence: 87,
  avgNurseResponseTime: '3.2h',
  medicationAdherence: 86,
  careContinuityScore: 91,
};

export const ANALYTICS_DATA = {
  enrollmentTrend: [
    { month: 'Jan', count: 68 },
    { month: 'Feb', count: 71 },
    { month: 'Mar', count: 74 },
    { month: 'Apr', count: 76 },
    { month: 'May', count: 79 },
    { month: 'Jun', count: 84 },
  ],
  adherenceTrend: [
    { month: 'Jan', medication: 81, appointment: 77, vaccination: 83 },
    { month: 'Feb', medication: 83, appointment: 79, vaccination: 85 },
    { month: 'Mar', medication: 82, appointment: 81, vaccination: 86 },
    { month: 'Apr', medication: 85, appointment: 83, vaccination: 87 },
    { month: 'May', medication: 84, appointment: 82, vaccination: 88 },
    { month: 'Jun', medication: 86, appointment: 85, vaccination: 91 },
  ],
  riskDistribution: [
    { name: 'Low Risk', value: 52, fill: 'hsl(142 63% 35%)' },
    { name: 'Moderate Risk', value: 23, fill: 'hsl(38 92% 50%)' },
    { name: 'High Risk', value: 9, fill: 'hsl(0 72% 51%)' },
  ],
  consultationCompletion: [
    { month: 'Jan', video: 78, inPerson: 88 },
    { month: 'Feb', video: 81, inPerson: 89 },
    { month: 'Mar', video: 84, inPerson: 91 },
    { month: 'Apr', video: 82, inPerson: 90 },
    { month: 'May', video: 86, inPerson: 92 },
    { month: 'Jun', video: 89, inPerson: 93 },
  ],
};

export interface VaccinationEntry {
  ageLabel: string;
  vaccine: string;
  dueDate: string;
  givenDate: string | null;
  status: 'given' | 'due' | 'upcoming';
}

export const VACCINATION_SCHEDULE: VaccinationEntry[] = [
  { ageLabel: 'Birth', vaccine: 'BCG, Hepatitis B (birth dose), Vitamin K', dueDate: '2026-10-14', givenDate: '2026-10-14', status: 'given' },
  { ageLabel: '6 weeks', vaccine: 'DTaP, Hib, IPV, PCV13, Rotavirus, Hepatitis B', dueDate: '2026-11-25', givenDate: '2026-11-26', status: 'given' },
  { ageLabel: '10 weeks', vaccine: 'DTaP, Hib, IPV, PCV13, Rotavirus (2nd dose)', dueDate: '2026-12-23', givenDate: null, status: 'due' },
  { ageLabel: '14 weeks', vaccine: 'DTaP, Hib, IPV, PCV13, Rotavirus (3rd dose)', dueDate: '2027-01-20', givenDate: null, status: 'upcoming' },
  { ageLabel: '6 months', vaccine: 'Meningococcal C, Hepatitis B (final dose)', dueDate: '2027-04-14', givenDate: null, status: 'upcoming' },
  { ageLabel: '9 months', vaccine: 'Measles, Yellow fever', dueDate: '2027-07-14', givenDate: null, status: 'upcoming' },
  { ageLabel: '12 months', vaccine: 'MMR (Measles, Mumps, Rubella), Varicella', dueDate: '2027-10-14', givenDate: null, status: 'upcoming' },
];

export interface MilestoneEntry {
  ageLabel: string;
  milestone: string;
  achieved: boolean;
  achievedDate?: string;
}

export const GROWTH_MILESTONES: MilestoneEntry[] = [
  { ageLabel: '1 month', milestone: 'Responds to sounds, briefly lifts head when on tummy', achieved: true, achievedDate: 'Nov 18, 2026' },
  { ageLabel: '2 months', milestone: 'Smiles socially, follows objects with eyes, coos', achieved: true, achievedDate: 'Dec 14, 2026' },
  { ageLabel: '3 months', milestone: 'Holds head steady, laughs, brings hands to mouth', achieved: true, achievedDate: 'Jan 10, 2027' },
  { ageLabel: '4 months', milestone: 'Rolls from tummy to back, babbles, reaches for toys', achieved: false },
  { ageLabel: '6 months', milestone: 'Sits with support, transfers objects, recognises familiar faces', achieved: false },
  { ageLabel: '9 months', milestone: 'Pulls to stand, says mama/dada, waves bye-bye', achieved: false },
  { ageLabel: '12 months', milestone: 'Stands alone briefly, first words, uses pincer grasp', achieved: false },
];

export const PREGNANCY_STAGES = [
  {
    id: 'conception',
    name: 'Conception',
    weeks: 'Week 1–4',
    status: 'completed',
    goals: ['Confirm pregnancy', 'Begin folic acid supplementation', 'Avoid harmful substances'],
    changes: ['Implantation occurs', 'Early hormonal shifts', 'Possible missed period'],
    checkups: ['Confirmation blood test', 'First consultation booking'],
    hospitalTasks: ['Enroll patient on Meds-inn', 'Assign nurse and doctor', 'Create initial care plan'],
    nurseTouchpoints: ['Welcome call within 48 hours', 'Supplement education session'],
    education: ['Understanding your pregnancy test result', 'What to avoid in early pregnancy'],
    medications: ['Folic Acid 400mcg daily'],
    warnings: ['Unusual bleeding', 'Severe abdominal pain'],
    nextSteps: 'Book first trimester visit between weeks 8–12.',
  },
  {
    id: 'first-trimester',
    name: 'First Trimester',
    weeks: 'Week 5–13',
    status: 'completed',
    goals: ['Establish care plan', 'Confirm healthy development', 'Manage early symptoms'],
    changes: ['Nausea and fatigue common', 'Breast tenderness', 'Frequent urination begins'],
    checkups: ['Booking visit (8–10 weeks)', 'Dating scan (10–13 weeks)', 'NT scan'],
    hospitalTasks: ['Complete booking history', 'Order first bloods', 'Schedule dating scan'],
    nurseTouchpoints: ['Booking visit follow-up call', 'Nutrition and hydration check-in'],
    education: ['Managing morning sickness', 'Safe foods during pregnancy', 'When to call the clinic'],
    medications: ['Folic Acid 400mcg daily', 'Vitamin D3 1000 IU daily'],
    warnings: ['Heavy bleeding', 'Persistent vomiting', 'One-sided pain (ectopic risk)'],
    nextSteps: 'Prepare for second trimester anomaly scan at 18–20 weeks.',
  },
  {
    id: 'second-trimester',
    name: 'Second Trimester',
    weeks: 'Week 14–27',
    status: 'current',
    currentWeek: 24,
    goals: ['Monitor fetal growth', 'Manage anaemia if present', 'Prepare for glucose screening'],
    changes: ['Baby movements begin (18–20 weeks)', 'Energy often improves', 'Abdomen visibly grows', 'Back pain may begin'],
    checkups: ['Anomaly scan (18–20 weeks)', '24-week review', 'Glucose tolerance test (24–28 weeks)', 'Full blood count'],
    hospitalTasks: ['Review anomaly scan results', 'Order GTT if indicated', 'Update risk assessment'],
    nurseTouchpoints: ['Mid-trimester check-in call', 'Adherence review', 'Birth plan introduction'],
    education: ['Understanding fetal movement', 'Back care and safe exercise', 'Preparing for the third trimester'],
    medications: ['Folic Acid 400mcg daily', 'Ferrous Sulfate 200mg twice daily', 'Calcium 500mg daily', 'Vitamin D3 1000 IU daily'],
    warnings: ['Sudden swelling of face or hands', 'Decreased fetal movement', 'Severe headaches', 'Vision changes'],
    nextSteps: 'Schedule 28-week appointment and glucose tolerance test.',
  },
  {
    id: 'third-trimester',
    name: 'Third Trimester',
    weeks: 'Week 28–36',
    status: 'upcoming',
    goals: ['Finalize birth plan', 'Monitor for complications', 'Baby positions and presentation'],
    changes: ['Increased fetal movement', 'Braxton Hicks contractions', 'Shortness of breath', 'Sleep becomes harder'],
    checkups: ['28-week review', '32-week scan', '36-week presentation check'],
    hospitalTasks: ['Confirm birth plan', 'Review hospital admission criteria', 'Schedule remaining visits'],
    nurseTouchpoints: ['Weekly check-in calls from 34 weeks', 'Hospital tour coordination', 'Postpartum plan introduction'],
    education: ['Signs of labour', 'When to go to hospital', 'Preparing your birth bag'],
    medications: ['Continue all current supplements', 'Iron dose may increase if needed'],
    warnings: ['Reduced fetal movement', 'Contractions before 37 weeks', 'Vaginal bleeding', 'Severe headache or vision changes'],
    nextSteps: 'Prepare for delivery preparation stage from 37 weeks.',
  },
  {
    id: 'delivery-prep',
    name: 'Delivery Preparation',
    weeks: 'Week 37–40',
    status: 'upcoming',
    goals: ['Confirm delivery plan', 'Manage anxiety and preparation', 'Baby positioning monitoring'],
    changes: ['Baby drops lower', 'Cervical changes begin', 'Nesting instinct common'],
    checkups: ['Weekly visits from 37 weeks', 'Cervical assessment', 'NST if indicated'],
    hospitalTasks: ['Finalise delivery team assignment', 'Confirm emergency contacts', 'Prepare admission documentation'],
    nurseTouchpoints: ['Daily availability for questions', 'Labour signs education session'],
    education: ['Understanding active labour', 'Pain management options', 'Partner support guidance'],
    medications: ['Continue supplements until delivery', 'Discuss postnatal supplement plan'],
    warnings: ['Membrane rupture', 'Regular painful contractions', 'No fetal movement for 12 hours'],
    nextSteps: 'Await labour onset or plan for induction as clinically indicated.',
  },
  {
    id: 'delivery',
    name: 'Delivery',
    weeks: 'Birth Day',
    status: 'upcoming',
    goals: ['Safe delivery', 'Immediate newborn assessment', 'Initiate breastfeeding'],
    changes: ['Active labour and birth', 'Immediate skin-to-skin recommended', 'Placental delivery'],
    checkups: ['APGAR score at 1 and 5 minutes', 'Newborn weight and measurements', 'Maternal post-delivery check'],
    hospitalTasks: ['Document delivery details in Meds-inn', 'Create baby profile', 'Initiate postpartum care plan'],
    nurseTouchpoints: ['Labour support throughout', 'Immediate postpartum recovery check'],
    education: ['Immediate newborn care', 'First hour after birth', 'Breastfeeding initiation'],
    medications: ['Oxytocin per clinical protocol', 'Postnatal iron continuation'],
    warnings: ['Excessive postpartum bleeding', 'Baby not breathing at birth', 'Signs of infection'],
    nextSteps: 'Transition to postpartum recovery care within 24 hours.',
  },
  {
    id: 'postpartum',
    name: 'Postpartum Recovery',
    weeks: 'Week 1–6 after birth',
    status: 'upcoming',
    goals: ['Physical recovery', 'Mental wellbeing support', 'Breastfeeding establishment'],
    changes: ['Uterine involution', 'Lochia discharge', 'Breast milk production', 'Emotional adjustment'],
    checkups: ['Day 1 postnatal check', '5-day midwife visit', '6-week GP/OB review'],
    hospitalTasks: ['Schedule 6-week review', 'Assign postpartum nurse', 'Monitor mental health indicators'],
    nurseTouchpoints: ['Day 3 home visit or call', 'Weekly check-ins for 6 weeks', 'Breastfeeding support call'],
    education: ['Normal postpartum recovery', 'Signs of postpartum depression', 'Contraception options'],
    medications: ['Continue iron if indicated', 'Postnatal vitamins'],
    warnings: ['Heavy bleeding beyond day 10', 'Signs of postnatal depression', 'Wound infection signs', 'Difficulty breastfeeding'],
    nextSteps: 'Transition to baby\'s first-year care and paediatric follow-ups.',
  },
  {
    id: 'baby-first-year',
    name: "Baby's First Year",
    weeks: 'Month 1–12',
    status: 'upcoming',
    goals: ['Immunisation adherence', 'Growth monitoring', 'Developmental milestones', 'Maternal wellbeing check'],
    changes: ['Rapid infant development', 'Sleep patterns evolving', 'Introduction of solid foods (6 months)'],
    checkups: ['6-week newborn check', '8-week immunisations', '12/16-week boosters', '12-month review'],
    hospitalTasks: ['Track vaccination schedule', 'Monitor growth charts', 'Coordinate paediatric visits'],
    nurseTouchpoints: ['Monthly check-in calls', 'Milestone and vaccination reminders'],
    education: ['Understanding baby development', 'Safe sleep practices', 'When to introduce solids'],
    medications: ['Vitamin K at birth', 'Vitamin D drops from 1 week'],
    warnings: ['High fever', 'Unusual rash after vaccination', 'Feeding difficulties', 'Developmental delay signs'],
    nextSteps: 'Complete the first-year care journey. Schedule 12-month comprehensive review.',
  },
];
