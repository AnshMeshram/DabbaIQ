import urllib.request
import re
import json
import html

base_url = "http://localhost:3000"

routes = [
    {
        "path": "/",
        "name": "Dashboard",
        "expected_elements": ["Master Kitchen Desk", "LIVE", "Today's Shift", "Production Vol", "Sales Velocity", "Food Loss Cost", "Restock Warnings", "Record Sale", "7-Day Portion Sales & Revenue Ledger"],
        "expected_links": ["/experience", "/planner", "/inventory", "/recipes", "/sales", "/waste", "/reports", "/settings", "/project-info"]
    },
    {
        "path": "/experience",
        "name": "3D Tiffin Story",
        "expected_elements": ["EVERY DABBA", "HAS A STORY", "CAD_REF: DAB-MUM-2026-T4", "State 1: Closed Stack", "State 2: Lid Lifting", "State 3: Tier 4 Separating", "State 4: Disassembled Floating", "State 5: Feature Architecture", "State 6: Complete Kitchen System"],
        "expected_links": ["/", "/planner", "/inventory", "/recipes", "/project-info"]
    },
    {
        "path": "/planner",
        "name": "AI Planner",
        "expected_elements": ["AI Preparation Planner", "Target Meal", "Portion Demand", "Safety Buffer", "Recipe Requirements & BOM Demand", "Gemma 2"],
        "expected_links": ["/inventory", "/recipes"]
    },
    {
        "path": "/inventory",
        "name": "Inventory & Stock",
        "expected_elements": ["Inventory & Stock", "Low-Stock", "Reorder Level", "Cost / Unit", "Expiry", "Find Wholesale Suppliers"],
        "expected_links": ["/planner", "/recipes"]
    },
    {
        "path": "/recipes",
        "name": "Recipe Library",
        "expected_elements": ["Recipe Library", "Portion Cost", "Ingredients BOM", "Cost / Dabba", "Dietary Labels"],
        "expected_links": ["/inventory", "/planner"]
    },
    {
        "path": "/sales",
        "name": "Sales Log",
        "expected_elements": ["Sales Log", "Record Sale", "Portions Sold", "Revenue", "Meal Period", "Import CSV"],
        "expected_links": ["/reports", "/waste"]
    },
    {
        "path": "/waste",
        "name": "Waste Tracker",
        "expected_elements": ["Waste Tracker", "Scrap", "Sunken Cost", "Reason", "Food Loss Mitigation"],
        "expected_links": ["/reports", "/sales"]
    },
    {
        "path": "/reports",
        "name": "Reports",
        "expected_elements": ["Business & Operations Reports", "Revenue", "Waste Cost", "P&L", "Export CSV"],
        "expected_links": ["/sales", "/waste"]
    },
    {
        "path": "/settings",
        "name": "Settings",
        "expected_elements": ["Settings & System Diagnostics", "Station", "MUM-04", "MongoDB", "Gemma", "Temporal", "Health"],
        "expected_links": ["/project-info", "/privacy", "/terms"]
    },
    {
        "path": "/privacy",
        "name": "Privacy Policy",
        "expected_elements": ["Privacy & DPDP Notice", "Digital Personal Data Protection", "Zero Cloud AI Egress", "Data Retention"],
        "expected_links": ["/terms", "/settings"]
    },
    {
        "path": "/terms",
        "name": "Terms of Service",
        "expected_elements": ["Terms of Service", "Kitchen Operations", "Operational License", "Disclaimer"],
        "expected_links": ["/privacy", "/settings"]
    },
    {
        "path": "/project-info",
        "name": "Project Info",
        "expected_elements": ["System Architecture", "1. Problem Statement", "2. System Architecture & Data Flow", "3. Operational Module Status Matrix", "4. Verified Technology Stack", "5. Backend API Contracts & Endpoints", "6. Known Limitations", "7. Privacy", "8. Local Run"],
        "expected_links": ["/", "/settings", "/privacy", "/terms"]
    }
]

print("=== DEEP SEMANTIC ROUTE AUDIT ===")
all_passed = True

for r in routes:
    url = base_url + r["path"]
    try:
        req = urllib.request.Request(url, headers={"User-Agent": "Release-Auditor"})
        with urllib.request.urlopen(req, timeout=10) as resp:
            raw_html = resp.read().decode("utf-8")
            decoded_html = html.unescape(raw_html)
            status = resp.status
            
            # Check expected elements
            missing_elements = [el for el in r["expected_elements"] if el not in decoded_html]
            
            # Check expected links
            missing_links = [l for l in r["expected_links"] if f'href="{l}"' not in decoded_html and f"href='{l}'" not in decoded_html]
            
            if status == 200 and not missing_elements:
                print(f"[PASS] {r['path']:15} ({r['name']:20}) - HTTP 200, all {len(r['expected_elements'])} elements found")
            else:
                all_passed = False
                print(f"[WARN] {r['path']:15} ({r['name']:20}) - HTTP {status}")
                if missing_elements:
                    print(f"       Missing elements: {missing_elements}")
                if missing_links:
                    print(f"       Missing links: {missing_links}")
    except Exception as e:
        all_passed = False
        print(f"[FAIL] {r['path']:15} - Error: {e}")

print(f"\nAudit completed. Overall Status: {'ALL PASSED' if all_passed else 'WARNINGS FOUND'}")
