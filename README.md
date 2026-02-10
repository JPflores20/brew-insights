# Brew Insights 🍺

**Brew Insights** is an industrial data analytics platform designed to visualize, compare, and optimize batch production processes. The application allows data ingestion via Excel files, offering interactive dashboards for cycle time analysis, machine efficiency, and process deviations.

Built with **React**, **Vite**, and **TypeScript**, utilizing **Shadcn UI** for a modern interface.

## 🚀 Key Features

* **Data Ingestion**: Local processing of Excel files (`.xlsx`) to generate instant reports.
* **Cycle Analysis**: Visualization of Real vs. Ideal times using area charts and interactive Gantt charts.
* **Machine Detail**: Step-by-step breakdown of each piece of equipment, detection of idle times (Gaps), and material consumption.
* **Batch Comparison**: Tools to compare performance between different production batches.
* **Process Capability (Cpk)**: Statistical calculation of process capability for critical variables (Temperature, Pressure, etc.).
* **AI Insights**: Automated analysis to generate diagnostics on inefficiencies and downtimes.
* **Responsive Design**: Adaptive interface with light/dark mode support.

## 🛠️ Tech Stack

**Core:**
* [React 18](https://react.dev/) - UI Library.
* [Vite](https://vitejs.dev/) - Development environment and bundler.
* [TypeScript](https://www.typescriptlang.org/) - Static typing.
* [Bun](https://bun.sh/) - Package manager and runtime.

**UI & Styles:**
* [Tailwind CSS](https://tailwindcss.com/) - Utility-first CSS framework.
* [Shadcn UI](https://ui.shadcn.com/) - Reusable components based on Radix UI.
* [Lucide React](https://lucide.dev/) - Iconography.

**Data & Charts:**
* [Recharts](https://recharts.org/) - Charting library for React.
* [TanStack Query](https://tanstack.com/query) - Asynchronous state management.
* [XLSX](https://docs.sheetjs.com/) - Excel file parsing.

**Utilities:**
* [React Hook Form](https://react-hook-form.com/) + [Zod](https://zod.dev/) - Form handling and validation.
* [Date-fns](https://date-fns.org/) - Date manipulation.

## 📦 Installation and Setup

### Prerequisites
Ensure you have Node.js (v18+) or Bun installed.

1.  **Clone the repository:**
    ```bash
    git clone [https://github.com/your-username/brew-insights.git](https://github.com/your-username/brew-insights.git)
    cd brew-insights
    ```

2.  **Install dependencies:**
    Recommended using Bun if available, or npm:
    ```bash
    # Using Bun
    bun install

    # Or using npm
    npm install
    ```

## ▶️ Running the App

### Development
To start the local development server:

```bash
bun dev
# or
npm run dev