

# BrewCycle Analytics Dashboard

A modern, dark-themed industrial analytics dashboard for visualizing brewing batch production efficiency.

---

## 🎨 Design Foundation

**Visual Style:**
- Dark industrial theme with `slate-900` background
- Emerald accents for expected/target metrics
- Rose/Orange for delays and real-time values
- Clean card-based layout with subtle borders
- Professional typography with clear data hierarchy

**Navigation:**
- Sidebar navigation with icons for quick access
- Three main sections: Overview, Batch Comparison, Machine Detail
- Responsive design for different screen sizes

---

## 📊 View 1: Global Dashboard (Overview)

**KPI Cards Row:**
- Total Batches Processed (count with trend indicator)
- Average Cycle Deviation (percentage with color coding)
- Machine with Highest Idle Time (name + idle minutes)

**Main Visualization:**
- Grouped bar chart comparing Average Real Time vs Expected Time
- Organized by machine groups (Cocedor, Macerador, Filtro, etc.)
- Interactive tooltips showing detailed metrics

**Alerts Widget:**
- Sidebar panel listing batches with delays > 30 minutes
- Shows batch ID, machine group, and delay amount
- Sorted by severity (highest delay first)

---

## 🔄 View 2: Batch Comparison Tool

**Selection Controls:**
- Two dropdown selectors for Batch A and Batch B
- Pre-populated with available batch IDs from mock data

**Comparison Chart:**
- Side-by-side horizontal bar chart
- Each machine group shows both batches' durations
- Clear visual separation between the two batches

**Delta Indicators:**
- Green checkmark when Batch A is faster
- Red indicator when Batch B is faster
- Displays time difference for each step

---

## 🔧 View 3: Machine Detail View

**Machine Selector:**
- Dropdown to choose specific equipment (Cocedor 1, Macerador 2, etc.)

**Trend Scatter Plot:**
- X-axis: Batch sequence/ID
- Y-axis: Real processing time
- Reveals if machine is getting slower over time

**Gap Analysis Card:**
- Maximum gap duration (longest stop)
- Average idle time
- Visual indicator for performance status

---

## 📁 Mock Data

Pre-generated realistic brewing data including:
- 20+ batches with unique IDs
- 6 machine groups with realistic timing variations
- Intentional delays in some batches for alert testing
- Seasonal patterns to make trend analysis meaningful

---

## 🔐 Authentication (Phase 2)

Basic login protection will be added once you connect to Supabase or Lovable Cloud:
- Simple email/password authentication
- Protected routes requiring login
- Session management

---

## 🛠️ Technical Approach

- **Charts:** Recharts with responsive containers
- **Components:** shadcn/ui Cards, Select, Tables, Badges
- **Icons:** lucide-react for industrial-style iconography
- **State:** React state for filters and selections
- **Routing:** React Router for navigation between views

