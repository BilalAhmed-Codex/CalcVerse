import os
from pathlib import Path
from playwright.sync_api import sync_playwright

def main():
    file_url = Path("index.html").resolve().as_uri()
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(viewport={"width": 1280, "height": 850})
        page = context.new_page()
        page.goto(file_url)
        page.wait_for_load_state("domcontentloaded")
        page.wait_for_timeout(300)
        
        # 1. Standard Calculator
        page.screenshot(path="screenshot_standard.png")
        print("Standard screenshot saved.")
        
        # 1b. Standard Calculator Calculation (Testing 2582 * 2620 =)
        page.click('#view-standard [data-action="clear"]')
        page.click('#view-standard [data-val="2"]')
        page.click('#view-standard [data-val="5"]')
        page.click('#view-standard [data-val="8"]')
        page.click('#view-standard [data-val="2"]')
        page.click('#view-standard [data-action="multiply"]')
        page.click('#view-standard [data-val="2"]')
        page.click('#view-standard [data-val="6"]')
        page.click('#view-standard [data-val="2"]')
        page.click('#view-standard [data-val="0"]')
        page.click('#view-standard [data-action="equals"]')
        page.wait_for_timeout(200)
        page.screenshot(path="screenshot_calculation.png")
        print("Standard Calculation screenshot saved.")

        # 1c. Operator In-Progress Expression (Testing 13 +)
        page.click('#view-standard [data-action="clear"]')
        page.click('#view-standard [data-val="1"]')
        page.click('#view-standard [data-val="3"]')
        page.click('#view-standard [data-action="add"]')
        page.wait_for_timeout(200)
        page.screenshot(path="screenshot_operator_upright.png")
        print("Operator Upright screenshot saved.")
        
        # 2. Scientific Calculator (Compact Frame)
        page.click('button[data-calc="scientific"]')
        page.wait_for_timeout(200)
        page.screenshot(path="screenshot_scientific.png")
        print("Scientific screenshot saved.")

        # 2b. Scientific Multi-Operand PEMDAS: 2 + 3 * 4 = 14
        page.click('#view-scientific [data-action="sci-clear"]')
        page.click('#view-scientific [data-val="2"]')
        page.click('#view-scientific [data-action="sci-add"]')
        page.click('#view-scientific [data-val="3"]')
        page.click('#view-scientific [data-action="sci-multiply"]')
        page.click('#view-scientific [data-val="4"]')
        page.click('#view-scientific [data-action="sci-equals"]')
        page.wait_for_timeout(200)
        page.screenshot(path="screenshot_sci_pemdas.png")
        page.screenshot(path=r"C:\Users\ProChad69\.gemini\antigravity\brain\bde4a33b-b576-4aaa-ab34-c624aa1ea7ce\screenshot_sci_pemdas.png")
        print("Scientific PEMDAS screenshot saved.")

        # 2c. Scientific Negative Multi-Operand: -369 / 2 = -184.5
        page.click('#view-scientific [data-action="sci-clear"]')
        page.click('#view-scientific [data-action="sci-subtract"]')
        page.click('#view-scientific [data-val="3"]')
        page.click('#view-scientific [data-val="6"]')
        page.click('#view-scientific [data-val="9"]')
        page.click('#view-scientific [data-action="sci-divide"]')
        page.click('#view-scientific [data-val="2"]')
        page.click('#view-scientific [data-action="sci-equals"]')
        page.wait_for_timeout(200)
        page.screenshot(path="screenshot_sci_negative_div.png")
        page.screenshot(path=r"C:\Users\ProChad69\.gemini\antigravity\brain\bde4a33b-b576-4aaa-ab34-c624aa1ea7ce\screenshot_sci_negative_div.png")
        print("Scientific Negative Division screenshot saved.")
        
        # 3. Desmos Graphing Calculator with Table and Functions Drawer
        page.click('button[data-calc="graph"]')
        page.wait_for_timeout(300)
        # Open Table
        page.click("#graph-table-toggle")
        page.wait_for_timeout(200)
        # Open functions drawer
        page.click("#kbtn-more-fn")
        page.wait_for_timeout(200)
        page.screenshot(path="screenshot_graph_table_fns.png")
        print("Graph with Table and Functions Drawer screenshot saved.")

        # 4. Multi-Unit Converter Grid
        page.click('.grid-mode-btn[data-calc="unit-grid"]')
        page.wait_for_timeout(200)
        page.click('#add-unit-grid-card')
        page.wait_for_timeout(200)
        page.screenshot(path="screenshot_unit_grid.png")
        print("Unit Grid screenshot saved.")

        # 5. Body Mass Index (BMI) with Independent Units (e.g. KG + FT/IN)
        page.click('button[data-calc="bmi"]')
        page.click('.gender-btn[data-gender="female"]')
        page.fill("#bmi-age", "28")
        # Toggle KG + FT
        page.click('#bmi-w-unit-toggle [data-w-unit="kg"]')
        page.click('#bmi-h-unit-toggle [data-h-unit="ft"]')
        page.fill("#bmi-weight-kg", "62")
        page.fill("#bmi-height-ft", "5")
        page.fill("#bmi-height-in", "6")
        page.click("#bmi-calc")
        page.wait_for_timeout(200)
        page.screenshot(path="screenshot_bmi.png")
        print("BMI screenshot saved.")

        # 6. Weight Converter (verifying digit color)
        page.click('button[data-calc="weight"]')
        page.fill("#weight-input", "85")
        page.wait_for_timeout(200)
        page.screenshot(path="screenshot_weight_color.png")
        print("Weight Converter screenshot saved.")

        browser.close()

if __name__ == "__main__":
    main()
