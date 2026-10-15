# DabbaIQ Video & Live Demo Walkthrough Script

**Time:** ~3 minutes  
**Target Audience:** Hacktoberfest 2026 Judges & Open-Source Community  
**Persona:** Small tiffin service operator ("Annapurna Tiffin Kitchen")

---

## Act 1: The Challenge (0:00 – 0:30)

1. **Open on Dashboard (`/`)**:
   - Point out the tagline: *"Cook the right amount. Waste less. Earn more."*
   - Highlight the dilemma: Over-preparing leads to wasted dal and vegetables (financial loss). Under-preparing leads to angry office customers who get turned away.
   - Show the live header badges: MongoDB connected, Gemma AI inference status.

---

## Act 2: Deterministic Baseline & AI Prep Planning (0:30 – 1:30)

1. **Navigate to AI Preparation Planner (`/planner`)**:
   - Set target date to tomorrow (Lunch service).
   - Show the selected recipes: *Dal Tadka, Steamed Rice, Chapati, Aloo Gobi Sabzi*.
   - Enter advance phone orders: Sharma Office ordered 10 chapatis and 5 extra dal.
   - Enter kitchen notes: *"Expecting light rain around 1 PM; prioritize using up fresh tomatoes expiring in 2 days."*
2. **Click "Generate Plan & Shopping List"**:
   - **Show Deterministic Calculations**:
     - Explain the Baseline Forecast: "Average of 4 previous matching Wednesdays: 25 portions."
     - Show the explicit safety buffer (+15% = +4 portions) yielding 29 total prep.
     - Show the Shortage Shopping List: The system calculates exact kilograms of toor dal, onions, and cooking oil needed, compares with stock on hand, and flags shortages with estimated cost.
   - **Show Gemma AI Grounded Advisory**:
     - Gemma reads the notes, suggests cooking the dal and sabzi with the aging tomatoes, and outputs a customer WhatsApp description.
3. **Click "Confirm Preparation Plan"**:
   - Plan is locked into the active kitchen target.

---

## Act 3: Kitchen Inventory & Recipe Unit Costing (1:30 – 2:00)

1. **Navigate to Recipes (`/recipes`)**:
   - Open *Dal Tadka*.
   - Show how the cost per portion (₹13.40) is calculated from the bills of materials and stored ingredient costs.
   - Demonstrate the "AI Description" modal: Generate descriptions in English, Hindi, or Marathi using Gemma.
2. **Navigate to Inventory (`/inventory`)**:
   - Show low-stock badges and expiring warnings.
   - Demonstrate the quick stock adjustment buttons (+1, +5, -1) for fast kitchen tallying.

---

## Act 4: Waste Tracking & Audited Financial Reports (2:00 – 2:45)

1. **Navigate to Waste Tracker (`/waste`)**:
   - Show the Prepared vs. Sold chart.
   - Review logged leftover portions and estimated food-cost losses.
2. **Navigate to Reports (`/reports`)**:
   - Select a 14-day date range.
   - Review total revenue, estimated ingredient cost, food waste loss, and estimated gross margin.
   - Click "Sales CSV" to show one-click CSV export ready for accounting or Excel.

---

## Act 5: System Health & Privacy Conclusion (2:45 – 3:00)

1. **Navigate to Settings (`/settings`)**:
   - Show the diagnostic dashboard verifying MongoDB Atlas and Ollama server status.
   - Emphasize the open-weight AI value proposition: Zero proprietary customer or recipe data leaves the computer.
