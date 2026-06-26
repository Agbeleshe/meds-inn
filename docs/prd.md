# Requirements Document

## 1. Application Overview

**Application Name**: Meds-inn

**Description**: Meds-inn is a hospital-powered maternal and child-care platform that enables hospitals, clinics, nurses, doctors, and mothers to manage care from conception through pregnancy, delivery, postpartum recovery, and the baby's first year. It serves as a digital care bridge between hospitals and mothers, supporting continuous care beyond clinic visits through reminders, follow-ups, AI-assisted care summaries, appointments, video counseling, and baby-care tracking.

**Business Model**: B2B2C
- Hospitals and clinics are paying customers
- Nurses, doctors, and hospital admins manage care
- Mothers use the companion experience

**Brand Positioning**: \"Continuous maternal care, beyond the clinic.\"

**Core Value**: Helps hospitals continue supporting pregnant women after they leave the clinic through structured care coordination.

## 2. Users and Usage Scenarios

**Target Users**:
1. Hospital Admin - manages overall operations, team, analytics
2. Nurse / Midwife - provides direct patient care, follow-ups, reminders
3. Doctor - reviews cases, prescribes care plans, conducts consultations
4. Mother / Patient - receives care, tracks pregnancy, communicates with care team

**Core Usage Scenarios**:
- Hospital staff enrolling and monitoring pregnant mothers
- Nurses conducting follow-ups and sending reminders between clinic visits
- Doctors reviewing patient status and conducting video consultations
- Mothers tracking pregnancy progress, medication adherence, and appointments
- Care coordination across pregnancy stages from conception to baby's first year
- Hospital admins monitoring care quality and team performance

## 3. Page Structure and Functional Description

### Page Hierarchy

```
Meds-inn Application
├── Splash Screen
├── Landing Page
├── Privacy Policy Page
├── Cookie Policy Page
├── Terms and Conditions Page
├── Authentication / Entry Experience
└── Main Application (Role-aware)
    ├── Dashboard Layout (Shell)
    ├── Hospital Admin Overview Dashboard
    ├── Mothers / Patient Directory
    ├── Individual Mother Profile Page
    ├── Pregnancy Timeline Page
    ├── Care Plans Page
    ├── Medication Reminders Page
    ├── Appointments Page
    ├── Video Consultations Page
    ├── AI Care Briefs Page
    ├── Messages Page
    ├── Baby Care Page
    ├── Documents Page
    ├── Analytics Page
    ├── Team Page
    ├── Architecture Page
    ├── Mother-Facing Dashboard
    └── Settings
```

### 3.1 Splash Screen

**Purpose**: Display brand identity during initial loading of home/landing page.

**Elements**:
- Meds-inn logo centered on screen
- Brand name \"Meds-inn\" displayed below or integrated with logo
- Clean, minimal design matching platform's warm ivory/charcoal/teal/gold color palette

**Behavior**:
- Appears immediately when user first accesses the application
- Displays for a brief moment (2-3 seconds)
- Fades out smoothly with transition animation
- Automatically transitions to landing page after fade-out completes

**Technical Requirements**:
- Smooth fade-out animation
- No user interaction required
- Responsive design for all screen sizes

### 3.2 Cookie Consent Modal

**Purpose**: Inform users about cookie usage and obtain consent on first visit.

**Trigger**:
- Displays automatically when user first enters the application on any page
- Appears after splash screen completes (if applicable)
- Shows only once per browser (dismissed state persisted to localStorage)

**Design**:
- Premium styling consistent with warm ivory/charcoal/teal/gold design tokens
- Uses shadcn/ui component system
- Smooth entrance animation from bottom or center
- Semi-transparent backdrop overlay
- Centered modal card with rounded corners

**Content**:
- Heading: \"We Value Your Privacy\"
- Brief explanation of cookie usage for maternal healthcare platform
- Three primary action buttons:
  - Accept All
  - Reject Non-Essential
  - Manage Preferences
- Links to Cookie Policy and Privacy Policy pages

**Manage Preferences Expansion**:
- Clicking \"Manage Preferences\" expands modal to show cookie category toggles
- Cookie categories:
  - Essential Cookies (always on, toggle disabled, explanation provided)
  - Analytics Cookies (toggle enabled, explanation provided)
  - Marketing Cookies (toggle enabled, explanation provided)
- Save Preferences button
- Each category includes brief description of purpose

**Behavior**:
- User selection saved to localStorage
- Modal dismissed after user makes choice
- Does not reappear on subsequent visits unless localStorage cleared
- Preference can be changed later via Settings page or footer link

### 3.3 Landing Page

**Purpose**: Introduce Meds-inn to hospital decision-makers and demonstrate value proposition.

**Sections**:

1. Hero Section - Modern Gallery Hero
   - **Desktop Layout Split**: 40/60 ratio
     - Left side (40%): Hero headline and CTAs
     - Right side (60%): Honeycomb hexagonal gallery
   - **Gallery Layout**: Honeycomb (hexagonal) pattern displaying diverse mothers
   - **Visual Content**: Professional, modern, stylish photographs of different mothers
   - **Visual Tone**: Aspirational, sophisticated, contemporary
   - **Fade Effects**: 
     - Top edges of gallery faded/blended into background
     - Bottom edges similarly faded creating depth and integration with content below
   - **Responsive Design**: Maintains visual integrity across all screen sizes
   - **Color Palette**: Complements professional modern theme using platform's warm ivory/charcoal/teal/gold design tokens
   - **Typography**: Clean, modern, highly legible for overlaid text
   - **Interactive Elements**: Hover effects or subtle animations on individual hexagonal gallery cells (performance-conscious)
   - **Overlaid Content**:
     - Hero headline positioned on left side (40% width)
     - Two CTAs: \"View hospital demo\" and \"Explore mother experience\"
   - **Technical Requirements**: Fully responsive, performance-optimized animations

2. Stats Section
   - Key platform metrics and impact indicators

3. Problem Section
   - Describe care gaps between clinic visits
   - Statement: \"The space between visits is where care often breaks. Meds-inn helps hospitals close that gap.\"

4. Solution Section
   - Explain how Meds-inn bridges hospital and home care
   - Key capabilities overview

5. Hospital Workflow Section
   - Animated visualization showing hospital staff workflow
   - Animation demonstrates: nurse follow-ups, doctor reviews, admin oversight
   - Visual flow of care coordination from hospital to home

6. Mother Journey Section
   - Illustrate patient experience from conception to first year
   - Care continuity visualization

7. Testimonials Section
   - Hospital testimonials with real photos of hospital administrators or medical directors
   - Patient testimonials with real photos of mothers
   - Each testimonial includes: photo, name, role/hospital, quote about Meds-inn impact
   - Minimum 2 hospital testimonials and 2 patient testimonials

8. Feature Highlights
   - Care coordination, reminders, video consultations, AI care briefs, baby tracking

9. AWS + Vercel Architecture Preview
   - Brief technical credibility section
   - Link to detailed Architecture page

10. Pricing Preview
    - Hospital subscription model indication

11. Final CTA
    - Encourage demo access

12. Footer
    - Standard footer content
    - Links to Privacy Policy, Cookie Policy, Terms and Conditions pages

### 3.4 Privacy Policy Page

**Purpose**: Inform users about data collection, usage, and protection practices.

**Design**:
- Clean, readable layout using app's design system
- Warm ivory/charcoal/teal/gold color palette
- Proper typography hierarchy with section headings
- Accessible from landing page footer
- Breadcrumb navigation

**Content Sections**:

1. Introduction
   - Overview of Meds-inn's commitment to privacy
   - Scope of policy application

2. Information We Collect
   - Personal information (name, contact details, medical data)
   - Usage data (app interactions, device information)
   - Cookies and tracking technologies

3. How We Use Your Information
   - Providing maternal and child-care services
   - Care coordination between hospitals and patients
   - Platform improvement and analytics
   - Communication and notifications

4. Data Sharing and Disclosure
   - Sharing with hospital care teams
   - Third-party service providers (AWS, Vercel)
   - Legal compliance requirements
   - No sale of personal data

5. Data Security
   - Encryption and security measures
   - Access controls for care team members
   - Regular security audits

6. Your Rights
   - Access to personal data
   - Data correction and deletion requests
   - Opt-out of non-essential communications
   - Cookie preference management

7. Data Retention
   - Retention periods for medical records
   - Deletion procedures

8. Children's Privacy
   - Protection of baby data linked to mother accounts

9. International Data Transfers
   - Cross-border data handling (if applicable)

10. Changes to Privacy Policy
    - Notification process for policy updates

11. Contact Information
    - Privacy officer contact details
    - Data protection inquiry process

**Last Updated**: Display date

### 3.5 Cookie Policy Page

**Purpose**: Explain cookie usage and provide transparency about tracking technologies.

**Design**:
- Clean, readable layout using app's design system
- Warm ivory/charcoal/teal/gold color palette
- Proper typography hierarchy with section headings
- Accessible from landing page footer and cookie consent modal
- Breadcrumb navigation

**Content Sections**:

1. Introduction
   - What cookies are
   - Why Meds-inn uses cookies

2. Types of Cookies We Use
   - Essential Cookies
     - Session management
     - Authentication and security
     - Load balancing
   - Analytics Cookies
     - Usage statistics
     - Performance monitoring
     - User behavior analysis
   - Marketing Cookies
     - Advertising effectiveness
     - Personalized content

3. Cookie Details Table
   - Cookie name
   - Purpose
   - Duration
   - Category (Essential/Analytics/Marketing)

4. Third-Party Cookies
   - AWS services cookies
   - Vercel analytics cookies
   - Video consultation service cookies

5. Managing Cookie Preferences
   - How to accept or reject cookies via consent modal
   - Browser-level cookie controls
   - Impact of disabling cookies on platform functionality

6. Do Not Track Signals
   - Platform's response to DNT browser settings

7. Updates to Cookie Policy
   - Notification process for policy changes

8. Contact Information
   - Cookie-related inquiries

**Last Updated**: Display date

### 3.6 Terms and Conditions Page

**Purpose**: Define legal terms governing use of Meds-inn platform.

**Design**:
- Clean, readable layout using app's design system
- Warm ivory/charcoal/teal/gold color palette
- Proper typography hierarchy with section headings
- Accessible from landing page footer
- Breadcrumb navigation

**Content Sections**:

1. Acceptance of Terms
   - Agreement to terms by using platform
   - Eligibility requirements

2. Service Description
   - Overview of Meds-inn maternal and child-care platform
   - B2B2C service model
   - Hospital subscription and patient access

3. User Accounts and Roles
   - Hospital Admin responsibilities
   - Nurse/Midwife access and duties
   - Doctor access and duties
   - Mother/Patient access and responsibilities
   - Account security obligations

4. Acceptable Use Policy
   - Permitted uses of platform
   - Prohibited activities
   - Professional conduct requirements for care team

5. Medical Disclaimer
   - Platform as care coordination tool, not medical advice
   - AI care briefs require clinician review
   - Emergency situations guidance
   - Limitation of liability for medical outcomes

6. Intellectual Property
   - Meds-inn ownership of platform and content
   - User-generated content rights
   - Trademark usage restrictions

7. Data and Privacy
   - Reference to Privacy Policy
   - HIPAA compliance commitment (if applicable)
   - Data ownership and access rights

8. Payment Terms (for Hospital Subscribers)
   - Subscription fees and billing
   - Refund policy
   - Payment method requirements

9. Service Availability
   - Uptime commitments
   - Maintenance windows
   - Service interruption notifications

10. Limitation of Liability
    - Disclaimer of warranties
    - Limitation of damages
    - Indemnification clauses

11. Termination
    - Conditions for account termination
    - Data retention after termination
    - Effect of termination on ongoing care

12. Dispute Resolution
    - Governing law
    - Arbitration procedures
    - Class action waiver

13. Changes to Terms
    - Notification process for updates
    - Continued use constitutes acceptance

14. Contact Information
    - Legal inquiries contact details

**Last Updated**: Display date

### 3.7 Authentication / Entry Experience

**Purpose**: Provide demo access for different user roles.

**Elements**:
- Meds-inn logo
- Brand statement
- Role switcher interface
- Demo access cards for each role:
  - Hospital Admin (Deborah Hassan)
  - Nurse / Midwife (Nurse Esther Okonkwo)
  - Doctor (Dr. Tolu Adebayo)
  - Mother / Patient (Amina Bello)
- Each card includes human description of role and demo credentials

### 3.8 Main Dashboard Layout

**Purpose**: Provide consistent navigation shell for all authenticated users.

**Components**:

**Left Sidebar Navigation**:
- Overview
- Mothers
- Appointments
- Care Plans
- Medication Reminders
- Messages
- Video Consultations
- Baby Care
- Analytics
- Team
- AI Care Briefs
- Documents
- Architecture
- Settings

**Top Navigation Bar**:
- Search functionality
- Notifications icon
- Dark mode toggle button
- Organization switcher (Elara Women's Specialist Clinic)
- Active role indicator
- Profile menu

**Main Content Area**:
- Page-specific content renders here

**Dark Mode Toggle**:
- Toggle button located in top navigation bar
- Icon-based toggle (sun/moon icon)
- Clicking toggle switches between light and dark themes
- Theme preference persisted across sessions
- Smooth transition animation when switching themes

### 3.9 Hospital Admin Overview Dashboard

**Purpose**: Provide hospital admin with operational overview and key metrics.

**Organization Context**: Elara Women's Specialist Clinic

**Sections**:

1. Today at a Glance
   - Current date and time
   - Quick summary of daily activities

2. Key Metric Cards:
   - Total enrolled mothers
   - Active pregnancies
   - High-risk cases
   - Today's appointments
   - Missed follow-ups
   - Postpartum mothers
   - Babies in first-year follow-up
   - Vaccination adherence rate
   - Average nurse response time
   - Medication adherence rate

3. Care Continuity Score
   - Overall care quality indicator

4. Mothers Needing Follow-up
   - List of patients requiring attention

5. Recent Maternal Alerts
   - High-priority notifications

6. Upcoming Consultations
   - Scheduled video and in-person appointments

7. Nurse Activity Summary
   - Team workload and response metrics

8. Appointment Performance
   - Attendance and completion rates

9. Postpartum Follow-up Status
   - Post-delivery care tracking

10. Baby Vaccination Adherence
    - First-year immunization compliance

11. AI Operations Summary
    - AI-generated insights and recommendations

### 3.10 Mothers / Patient Directory

**Purpose**: Browse and manage all enrolled mothers.

**Features**:
- Search by name or patient ID
- Filters: risk level, gestational stage, assigned staff, status
- Sorting options
- Tabs:
  - All
  - Active Pregnancy
  - High Risk
  - Postpartum
  - New Enrollments
  - Missed Follow-up

**Patient Row Information**:
- Name
- Patient ID
- Gestational week (if pregnant)
- Assigned nurse
- Assigned doctor
- Risk level indicator
- Last check-in date
- Next appointment date
- Medication adherence percentage
- Status badge

**Demo Patients**:
- Amina Bello (MED-ELR-24018, 24 weeks, moderate risk)
- Zainab Musa
- Kemi Adewale
- Hadiza Bello
- Grace Nwafor
- Adaobi Eze
- Sarah Ibrahim
- Ruth Daniel
- Chioma Okeke
- Maryam Lawal
- Blessing Okoro
- Fatima Abdullahi

**Actions**:
- Click patient row to view full profile

### 3.11 Individual Mother Profile Page

**Purpose**: Comprehensive view of individual patient care journey.

**Patient**: Amina Bello
- Age: 29
- Patient ID: MED-ELR-24018
- Gestational Week: 24
- Risk Level: Moderate
- Blood Type: O+
- Allergies: Penicillin
- EDD: October 14, 2026
- Assigned Nurse: Nurse Esther Okonkwo
- Assigned Doctor: Dr. Tolu Adebayo

**Sections**:

1. Summary Header
   - Patient photo, name, key demographics
   - Current pregnancy status
   - Risk indicators
   - Assigned care team

2. Care Timeline
   - Chronological view of all care events
   - Appointments, check-ins, notes, alerts

3. Current Pregnancy Overview
   - Gestational age
   - Baby development status
   - Recent vitals
   - Weight tracking

4. Appointment History
   - Past and upcoming appointments
   - Attendance record
   - Visit summaries

5. Medication Reminders
   - Active medications
   - Adherence tracking
   - Missed doses

6. Symptom Log
   - Patient-reported symptoms
   - Severity and frequency
   - Clinician responses

7. Lab Results
   - Recent test results
   - Historical trends
   - Flagged abnormalities

8. Uploaded Documents
   - Ultrasound reports
   - Medical records
   - Consent forms

9. Nurse Notes
   - Follow-up notes from assigned nurse
   - Care observations

10. Doctor Notes
    - Clinical assessments
    - Treatment plans

11. AI Care Brief
    - AI-generated summary of patient status
    - Risk cues and recommendations

12. Baby Care Transition Plan
    - Postpartum and first-year care preparation

**Quick Actions**:
- Schedule appointment
- Start video consultation
- Send reminder
- Add nurse note
- Upload report
- Escalate case
- Generate AI care brief

### 3.12 Pregnancy Timeline Page

**Purpose**: Visualize complete care journey across pregnancy stages.

**Stages**:
1. Conception
2. First Trimester
3. Second Trimester (Current for Amina - 24 weeks)
4. Third Trimester
5. Delivery Preparation
6. Delivery
7. Postpartum Recovery
8. Baby's First Year

**For Each Stage**:
- Care goals
- Expected physical and emotional changes
- Required checkups and screenings
- Hospital tasks and responsibilities
- Nurse touchpoints and follow-ups
- Education items for mother
- Medication reminders
- Warning signs to monitor
- Next steps and transitions

**Visual Treatment**:
- Timeline visualization showing progression
- Current stage highlighted
- Completed stages marked
- Upcoming stages previewed

### 3.13 Care Plans Page

**Purpose**: Define and track structured care plans for each patient.

**Sections**:

1. Trimester Goals
   - Stage-specific health objectives
   - Completion status

2. Nutrition Guidance
   - Dietary recommendations
   - Food safety guidelines

3. Hydration Goals
   - Daily water intake targets

4. Supplements
   - Prescribed vitamins and minerals
   - Dosage and timing

5. Appointment Schedule
   - Planned checkup frequency
   - Upcoming visit dates

6. Counseling Tasks
   - Mental health support
   - Education sessions

7. Risk Monitoring
   - Specific conditions to watch
   - Monitoring frequency

8. Postpartum Plan
   - Recovery expectations
   - Follow-up schedule

9. Baby-Care Preparation
   - Prenatal education
   - Hospital tour scheduling

**Interactions**:
- Edit buttons for each section
- Completion checkboxes
- Review status indicators
- Save changes functionality

### 3.14 Medication Reminders Page

**Purpose**: Manage medication schedules and track adherence.

**Two Views**:

**View 1: Clinician Medication Management**
- Medication name
- Dosage
- Frequency
- Route of administration
- Instructions
- Start date
- End date
- Prescribed by (clinician name)
- Adherence rate percentage
- Missed doses count
- Last taken timestamp
- Clinical notes

**View 2: Mother-Facing Reminder View**
- What to take (medication name)
- When to take (time and frequency)
- How to take (instructions)
- Clinician instruction notes
- Taken / Skipped buttons
- Daily adherence summary
- Reminder notifications

**Important Note**: Interface clearly shows medications are prescribed by clinicians, not automatically generated.

### 3.15 Appointments Page

**Purpose**: Schedule and manage all patient appointments.

**Views**:
- Calendar view (monthly/weekly)
- List view (chronological)

**Appointment Information**:
- Date and time
- Patient name
- Appointment type (checkup, consultation, ultrasound, etc.)
- Assigned clinician
- Location (virtual / in-person)
- Reason for visit
- Status (scheduled, completed, missed, cancelled)
- Duration

**Sections**:
- Upcoming appointments
- Missed visits requiring follow-up
- Follow-up requests from patients

**Actions**:
- Book new appointment
- Reschedule existing appointment
- Mark as attended
- Send reminder to patient
- Start consultation (for virtual appointments)
- Add outcome note after visit

### 3.16 Video Consultations Page

**Purpose**: Conduct and manage virtual care consultations.

**Sections**:

1. Upcoming Consultations List
   - Scheduled video appointments
   - Patient name, time, reason

2. Active Consultation Card
   - Currently in-progress consultation details
   - Join button

3. Video Room Interface (Mock)
   - Patient video panel
   - Clinician video panel
   - Call controls (mute, camera, end call)
   - Notes side panel for real-time documentation
   - Session agenda display

4. Consultation Summary
   - Post-call summary form
   - Key discussion points
   - Follow-up actions
   - Next appointment scheduling

**Features**:
- Start consultation button
- In-call note-taking
- Screen sharing indicator
- Connection quality indicator
- Recording status (if applicable)

### 3.17 AI Care Briefs Page

**Purpose**: Provide AI-generated care summaries to assist clinicians.

**Content Structure**:

**Generated Care Brief Example** (Amina Bello):
\"Amina Bello is 24 weeks pregnant with 89% medication adherence. She missed one appointment in the last 30 days and recently reported fatigue and occasional dizziness. Suggested next step: nurse follow-up within 48 hours and review at the next scheduled visit.\"

**Brief Components**:
- Patient summary
- Risk cues identified
- Adherence trends (medication, appointments)
- Missed touchpoints
- Suggested follow-ups
- Recent symptom changes
- Behavioral patterns

**Metadata**:
- Generated date and time
- Reviewed by clinician status
- Clinician notes added to brief

**Actions**:
- Regenerate brief button
- Add clinician note button
- Mark as reviewed
- Share with care team

**Important Note**: AI assists clinicians but does not diagnose or prescribe. All recommendations require clinician review and approval.

### 3.18 Messages Page

**Purpose**: Facilitate communication between care team and mothers.

**Features**:

1. Inbox
   - All conversations listed
   - Unread count badges

2. Threaded Conversations
   - Nurse-to-mother messaging
   - Doctor-to-nurse notes
   - Team coordination threads

3. Message Composition
   - Quick templates for common messages
   - Appointment reminders
   - Care check-ins
   - Medication reminders

4. Message Attributes
   - Urgent label for priority messages
   - Attachment support
   - Read/unread status
   - Timestamp

5. Filters
   - By sender role
   - By urgency
   - By read status
   - By date range

**Actions**:
- Compose new message
- Reply to thread
- Attach file
- Mark as urgent
- Archive conversation

### 3.19 Baby Care Page

**Purpose**: Track baby's health and development during first year.

**Demo Baby**: Baby Bello
- Mother: Amina Bello
- Birth Date: October 14, 2026
- Birth Weight: 3.2kg
- Delivery Type: Vaginal delivery

**Sections**:

1. Baby Profile
   - Name, birth details, current age
   - Growth metrics (weight, length, head circumference)

2. Vaccination Schedule
   - Required immunizations by age
   - Completed vaccinations
   - Upcoming vaccination dates
   - Adherence status

3. Growth Milestones
   - Developmental milestones by month
   - Achieved milestones marked
   - Expected upcoming milestones

4. Feeding Notes
   - Breastfeeding or formula tracking
   - Feeding frequency
   - Introduction of solid foods

5. Development Reminders
   - Age-appropriate activities
   - Warning signs to monitor

6. Postpartum Mother Check-ins
   - Mother's recovery status
   - Postpartum visit attendance

7. Nurse Follow-up Notes
   - Home visit summaries
   - Phone check-in notes

8. First-Year Care Journey
   - Timeline of baby's first year
   - Hospital touchpoints
   - Pediatrician visits

### 3.20 Documents Page

**Purpose**: Store and organize all patient medical documents.

**Categories**:
- Ultrasound reports
- Lab results
- Discharge summaries
- Care notes
- Consent forms
- Uploaded medical documents

**Document Card Information**:
- Document name
- Category tag
- Upload date
- Uploaded by (user name and role)
- File type and size
- Status (pending review, reviewed, archived)

**Features**:
- Upload new document interface
- Drag-and-drop upload
- File preview drawer
- Download document
- Category filtering
- Search by document name
- Sort by date or category

**Actions**:
- Upload document
- Preview document
- Download document
- Delete document
- Add document notes
- Share with care team

### 3.21 Analytics Page

**Purpose**: Provide hospital admin with performance insights.

**Key Metrics**:
- Total enrolled mothers
- Active care plans
- Missed appointment rate
- Medication adherence rate
- Postpartum follow-up completion rate
- Video consultation completion rate
- Average nurse response time
- Vaccination adherence rate
- Risk distribution (low, moderate, high)
- Patient engagement trends
- Care continuity score

**Visualizations**:
- Metric cards with trend indicators
- Line charts for time-series data
- Bar charts for categorical comparisons
- Pie charts for distribution analysis
- Tables for detailed breakdowns

**Filters**:
- Date range selector
- Care team member filter
- Risk level filter
- Pregnancy stage filter

**Design Note**: Charts should be elegant and uncluttered, prioritizing clarity.

### 3.22 Team Page

**Purpose**: Manage hospital care team members.

**Demo Team Members**:
1. Deborah Hassan - Hospital Admin
2. Nurse Esther Okonkwo - Senior Midwife
3. Nurse Mariam Sule - Maternal Care Nurse
4. Nurse Linda James - Postpartum Care
5. Dr. Tolu Adebayo - Obstetrician
6. Dr. Ifeoma Nnaji - Pediatrician
7. Dr. Samuel Danladi - Family Physician

**Team Member Card Information**:
- Name and photo
- Role/title
- Number of assigned mothers
- Current workload indicator
- Activity status (active, away, offline)
- Permissions level
- Contact information
- Last active timestamp

**Features**:
- Team member list view
- Search team members
- Filter by role
- Sort by workload or activity

**Actions**:
- View team member profile
- Invite new team member (modal)
- Edit team member details
- Adjust permissions
- Reassign patients
- Send message

### 3.23 Architecture Page

**Purpose**: Demonstrate technical architecture for hackathon judges.

**Headline**: \"Built with Vercel + AWS\"

**Service Cards**:
1. v0 - Frontend development
2. Vercel - Hosting and deployment
3. Amazon Cognito - User authentication
4. Amazon DynamoDB - Database storage
5. Amazon S3 - Document and media storage
6. AWS Lambda - Serverless functions
7. Amazon SNS/SES - Notifications and email
8. Amazon Chime SDK - Video consultations
9. Amazon Bedrock - AI care briefs
10. Amazon CloudWatch - Monitoring and logging

**Architecture Flow Diagram**:
```
Users (Mother/Nurse/Doctor/Admin)
    ↓
Vercel App (Next.js Frontend)
    ↓
API Layer
    ↓
AWS Services:
- Cognito (Authentication)
- DynamoDB (Data Storage)
- S3 (File Storage)
- Lambda (Business Logic)
- SNS/SES (Notifications)
- Chime SDK (Video)
- Bedrock (AI)
- CloudWatch (Monitoring)
```

**Content**:
- Brief description of each service's role
- How services integrate
- Data flow explanation
- Security and compliance notes

### 3.24 Mother-Facing Dashboard

**Purpose**: Provide simplified, reassuring patient experience.

**Tone**: Softer, simpler, more supportive than clinician views.

**Sections**:

1. Current Pregnancy Week
   - Week number and trimester
   - Visual progress indicator

2. Baby Development Note
   - Age-appropriate development description
   - \"Your baby is now the size of...\"

3. Next Appointment
   - Date, time, location
   - Assigned clinician
   - Preparation instructions

4. Today's Reminders
   - Medication reminders
   - Hydration goals
   - Activity suggestions

5. Medication Checklist
   - Today's medications
   - Taken/not taken status
   - Instructions

6. Nurse Message
   - Latest message from assigned nurse
   - Reply option

7. Care Checklist
   - Upcoming tasks (appointments, tests, education)
   - Completion status

8. Education for This Week
   - Relevant pregnancy information
   - Tips and guidance

9. Hospital Support
   - Contact information for care team
   - Emergency guidance

10. Emergency Guidance Card
    - Warning signs requiring immediate attention
    - Emergency contact numbers

11. Postpartum Transition Preview
    - What to expect after delivery
    - Preparation checklist

**Actions**:
- Mark medication as taken
- Send message to nurse
- Schedule appointment
- View care plan
- Access educational resources

### 3.25 Settings Page

**Purpose**: Manage user preferences and account settings.

**Sections**:
- Profile information
- Notification preferences
- Theme preference (light/dark mode)
- Language and region
- Privacy settings
- Cookie preferences (link to manage cookie consent)
- Account security
- Organization settings (for admins)

## 4. Business Rules and Logic

### 4.1 Role-Based Access Control

**Hospital Admin**:
- Full access to all pages and features
- Can view all patients and team members
- Can manage team permissions
- Can access analytics and reports

**Nurse / Midwife**:
- Can view assigned patients
- Can add notes and send messages
- Can schedule appointments
- Can update care plans
- Cannot access analytics or team management

**Doctor**:
- Can view assigned patients
- Can add clinical notes
- Can conduct video consultations
- Can review AI care briefs
- Can prescribe medications and care plans

**Mother / Patient**:
- Can only view own information
- Can communicate with assigned care team
- Can track own pregnancy and baby
- Cannot access other patients or team features

### 4.2 Care Continuity Rules

**Appointment Follow-up**:
- Missed appointments trigger automatic follow-up task for assigned nurse
- Follow-up must occur within 48 hours

**Medication Adherence**:
- Adherence below 80% triggers nurse notification
- Three consecutive missed doses trigger urgent alert

**Risk Escalation**:
- High-risk patients require weekly check-ins
- Moderate-risk patients require bi-weekly check-ins
- Any reported warning symptoms trigger immediate nurse review

**AI Care Brief Generation**:
- Briefs generated weekly for all active patients
- High-risk patients receive briefs twice weekly
- All briefs require clinician review before action

### 4.3 Communication Rules

**Message Priority**:
- Urgent messages appear at top of inbox
- Urgent messages trigger push notifications
- Non-urgent messages batched for daily digest

**Response Time Expectations**:
- Urgent messages: within 2 hours
- Standard messages: within 24 hours
- Appointment requests: within 48 hours

### 4.4 Data Consistency Rules

**Patient Assignment**:
- Each patient must have one assigned nurse
- Each patient must have one assigned doctor
- Assignments can be changed by admin or current assignee

**Care Plan Updates**:
- Care plans must be reviewed each trimester
- Changes to care plans require doctor approval
- Patients notified of care plan changes

**Document Management**:
- All uploaded documents require category assignment
- Documents marked as reviewed by clinician
- Sensitive documents restricted to care team only

### 4.5 Baby Care Transition

**Postpartum Activation**:
- Baby care section activates upon delivery date entry
- Postpartum care plan automatically generated
- First-year vaccination schedule populated

**Mother-Baby Linking**:
- Baby profile linked to mother's profile
- Shared care timeline for mother and baby
- Postpartum mother check-ins included in baby care page

### 4.6 Dark Mode Rules

**Theme Switching**:
- User clicks dark mode toggle in top navigation bar
- Theme switches immediately with smooth transition animation
- All pages and components update to dark theme colors

**Theme Persistence**:
- User's theme preference saved to browser storage
- Theme preference restored on next session
- Theme preference synced across browser tabs

**Color Token Application**:
- Light mode uses ivory backgrounds, charcoal text, teal and gold accents
- Dark mode uses dark charcoal backgrounds, ivory text, adjusted teal and gold accents
- All UI components support both light and dark color tokens
- Charts and data visualizations adapt colors for dark mode readability

### 4.7 Splash Screen Rules

**Display Trigger**:
- Splash screen appears when user first accesses the application home/landing page
- Displays during initial page load

**Display Duration**:
- Remains visible for 2-3 seconds
- Automatically transitions to landing page after duration completes

**Transition Behavior**:
- Smooth fade-out animation when transitioning to landing page
- No user interaction required to dismiss splash screen
- Landing page content begins loading during splash screen display

### 4.8 Cookie Consent Rules

**Display Trigger**:
- Cookie consent modal appears on first visit to any page
- Displays after splash screen completes (if applicable)
- Does not appear if user has previously made a choice (checked via localStorage)

**User Actions**:
- Accept All: Sets all cookie categories to enabled, saves preference to localStorage, dismisses modal
- Reject Non-Essential: Sets only Essential cookies to enabled, disables Analytics and Marketing, saves preference, dismisses modal
- Manage Preferences: Expands modal to show individual cookie category toggles

**Manage Preferences Behavior**:
- Essential cookies toggle always on and disabled (cannot be turned off)
- Analytics and Marketing toggles enabled and user-controllable
- Save Preferences button commits user choices to localStorage and dismisses modal

**Persistence**:
- User's cookie preferences saved to localStorage
- Preferences persist across sessions and browser tabs
- Modal does not reappear unless localStorage is cleared or user manually changes preferences via Settings

**Animation**:
- Modal enters with smooth animation from bottom or center
- Backdrop overlay fades in
- Dismissal includes smooth fade-out animation

### 4.9 Policy Page Access Rules

**Footer Links**:
- Privacy Policy, Cookie Policy, and Terms and Conditions links displayed in landing page footer
- Links accessible from all public pages

**Navigation**:
- Clicking policy link navigates to respective policy page
- Breadcrumb navigation provided for easy return to previous page

**Content Display**:
- Policy pages use consistent design system with warm ivory/charcoal/teal/gold color palette
- Proper typography hierarchy with section headings
- Clean, readable layout optimized for long-form content

## 5. Exceptions and Edge Cases

| Scenario | Handling |
|----------|----------|
| Patient misses multiple appointments | Escalate to doctor, flag as high-risk, require admin review |
| Medication adherence drops below 50% | Urgent nurse follow-up, schedule in-person consultation |
| Patient reports severe symptoms | Immediate notification to assigned doctor, emergency guidance displayed |
| Video consultation connection fails | Provide reconnection option, fallback to phone call, reschedule if needed |
| AI care brief identifies critical risk | Require immediate clinician review, block brief visibility until reviewed |
| Team member leaves organization | Reassign all patients to other team members, archive user account |
| Patient uploads large file | Display upload progress, validate file size limit, provide compression option |
| Multiple users edit same patient record | Last save wins, display conflict warning, suggest review |
| Patient account inactive for 90 days | Send re-engagement message, flag for nurse follow-up |
| Vaccination due date passes | Send overdue reminder, escalate to pediatrician after 14 days |
| User switches theme during active session | Apply theme change immediately without page reload, maintain current page state |
| Image search returns no suitable results | Use placeholder images with appropriate alt text, retry search with alternative keywords |
| Animated workflow section fails to load | Display static workflow diagram as fallback |
| Hexagonal gallery images fail to load | Display placeholder hexagons with gradient backgrounds matching design tokens |
| Hover effects cause performance issues on mobile | Disable hover animations on touch devices, use tap interactions instead |
| Splash screen fails to load | Skip splash screen and load landing page directly |
| Splash screen animation interrupted | Complete fade-out immediately and proceed to landing page |
| Cookie consent modal fails to load | Allow user to proceed to application, log error, display fallback cookie notice |
| localStorage unavailable or disabled | Cookie consent modal displays on every visit, preferences not persisted |
| User clears localStorage after setting cookie preferences | Cookie consent modal reappears on next visit, user must make choice again |
| User clicks policy link from cookie consent modal | Open policy page in new tab, keep modal open in original tab |
| Policy page content fails to load | Display error message with retry option, provide contact information for support |

## 6. Acceptance Criteria

1. User accesses application home page and views splash screen displaying Meds-inn logo and brand name
2. Splash screen remains visible for 2-3 seconds then smoothly fades out
3. Landing page loads after splash screen fade-out completes
4. Cookie consent modal appears on first visit with Accept All, Reject Non-Essential, and Manage Preferences options
5. User clicks Manage Preferences, modal expands to show Essential (disabled), Analytics, and Marketing cookie toggles
6. User selects cookie preferences, clicks Save Preferences, and modal dismisses with preference saved to localStorage
7. User navigates to landing page footer and clicks Privacy Policy link, Privacy Policy page loads with complete content
8. User navigates to landing page footer and clicks Cookie Policy link, Cookie Policy page loads with complete content
9. User navigates to landing page footer and clicks Terms and Conditions link, Terms and Conditions page loads with complete content
10. User views landing page hero section with 40/60 desktop layout split (left side copy 40%, right side honeycomb gallery 60%)
11. User views modern gallery hero section with honeycomb hexagonal pattern displaying diverse mothers, with fade effects on top and bottom edges
12. User hovers over individual hexagonal gallery cells and sees subtle animations or hover effects
13. User selects Hospital Admin role from authentication page and views Elara Women's Specialist Clinic dashboard with dark mode toggle visible in top navigation bar
14. User clicks dark mode toggle, theme switches to dark mode with smooth transition, and all pages display correct dark theme colors
15. User navigates to Mothers directory in dark mode, filters by High Risk, and views patient list with proper dark theme styling
16. User clicks Amina Bello's row, opens profile page in dark mode, and views complete care information with correct dark color tokens
17. User navigates to Settings page and clicks cookie preferences link, opens cookie consent management interface

## 7. Out of Scope for This Release

- Backend implementation and database integration
- Real user authentication and authorization
- Actual video call functionality
- Real-time notifications and push alerts
- Payment processing for hospital subscriptions
- Multi-language support beyond English
- Mobile native applications
- Offline mode functionality
- Third-party EHR system integration
- Automated prescription generation
- AI-powered diagnosis capabilities
- Telemedicine regulatory compliance implementation
- HIPAA compliance certification
- Data encryption and security implementation
- Backup and disaster recovery systems
- Load balancing and scalability infrastructure
- Automated testing suite
- User onboarding workflows
- In-app help documentation
- Analytics export functionality
- Custom report generation
- Bulk patient import
- SMS notification delivery
- Email template customization
- Role permission customization beyond predefined roles
- Multi-hospital organization management
- Patient data migration tools
- API documentation for third-party integrations
- Automated image optimization for landing page
- A/B testing for landing page variations
- Advanced animation controls or customization
- User-submitted testimonials workflow
- High contrast mode or accessibility-specific themes beyond standard dark mode
- Custom hexagonal gallery layout editor
- Dynamic gallery image management system
- Advanced image cropping or masking for hexagonal shapes
- Splash screen customization options
- Splash screen skip functionality
- Legal review or validation of policy page content
- Cookie consent compliance with specific regional regulations (GDPR, CCPA, etc.)
- Automated cookie scanning and categorization
- Cookie consent analytics and reporting
- Integration with third-party consent management platforms
- Granular cookie preference management beyond three categories
- Cookie consent version control and change tracking
- Automated policy page content updates
- Multi-language versions of policy pages