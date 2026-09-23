"""
CalcVerse — Complete Playwright Test Suite
Tests navigation, multi-converter grid, multi-finance grid,
standard calculator, scientific calculator (DEG/RAD, memory),
all unit converters with non-negative guards, percentage, equations,
enhanced BMI (Gender, Age, Metric & Imperial), Tip & Split, Unit price,
age, time interval, and Desmos-style graphing calculator with virtual keypad.
"""

import math
from pathlib import Path
import pytest
from playwright.sync_api import sync_playwright

FILE_URL = Path(__file__).parent.resolve().joinpath("index.html").as_uri()


@pytest.fixture(scope="module")
def page():
    """Launch headless browser once for all tests."""
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(viewport={"width": 1280, "height": 850})
        pg = context.new_page()
        pg.goto(FILE_URL)
        pg.wait_for_load_state("domcontentloaded")
        yield pg
        browser.close()


# ────────────────────────── Navigation ──────────────────────────

class TestNavigation:
    def test_default_view_is_standard(self, page):
        view = page.locator("#view-standard")
        assert "active" in view.get_attribute("class")

    def test_switch_to_scientific(self, page):
        page.click('[data-calc="scientific"]')
        assert "active" in page.locator("#view-scientific").get_attribute("class")
        assert page.locator("#calc-title").inner_text().strip() == "Scientific"

    def test_switch_to_percentage(self, page):
        page.click('[data-calc="percentage"]')
        assert "active" in page.locator("#view-percentage").get_attribute("class")

    def test_switch_to_weight(self, page):
        page.click('[data-calc="weight"]')
        assert "active" in page.locator("#view-weight").get_attribute("class")

    def test_switch_to_length(self, page):
        page.click('[data-calc="length"]')
        assert "active" in page.locator("#view-length").get_attribute("class")

    def test_switch_to_equations(self, page):
        page.click('[data-calc="equations"]')
        assert "active" in page.locator("#view-equations").get_attribute("class")

    def test_switch_to_age(self, page):
        page.click('[data-calc="age"]')
        assert "active" in page.locator("#view-age").get_attribute("class")

    def test_switch_to_time_interval(self, page):
        page.click('[data-calc="time-interval"]')
        assert "active" in page.locator("#view-time-interval").get_attribute("class")

    def test_switch_to_unit_grid(self, page):
        page.click('.grid-mode-btn[data-calc="unit-grid"]')
        page.wait_for_timeout(100)
        assert "active" in page.locator("#view-unit-grid").get_attribute("class")
        assert page.locator("#unit-grid-container .grid-card").count() >= 2

    def test_switch_to_finance_grid(self, page):
        page.click('.grid-mode-btn[data-calc="finance-grid"]')
        page.wait_for_timeout(100)
        assert "active" in page.locator("#view-finance-grid").get_attribute("class")
        assert page.locator("#finance-grid-container .grid-card").count() >= 2

    def test_switch_back_to_standard(self, page):
        page.click('[data-calc="standard"]')
        assert "active" in page.locator("#view-standard").get_attribute("class")

    def test_nav_search_filters(self, page):
        search = page.locator("#nav-search")
        search.fill("weight")
        page.wait_for_timeout(150)
        weight_btn = page.locator('[data-calc="weight"]')
        assert weight_btn.is_visible()
        search.fill("")
        page.wait_for_timeout(150)


# ────────────────────────── Standard Calculator ──────────────────────────

class TestStandardCalculator:
    def _ensure_standard(self, page):
        page.click('[data-calc="standard"]')

    def test_display_shows_zero(self, page):
        self._ensure_standard(page)
        text = page.locator("#std-display").inner_text()
        assert text == "0"

    def test_number_input(self, page):
        self._ensure_standard(page)
        page.click('#view-standard [data-action="clear"]')
        page.click('#view-standard [data-val="5"]')
        text = page.locator("#std-display").inner_text()
        assert "5" in text

    def test_addition(self, page):
        self._ensure_standard(page)
        page.click('#view-standard [data-action="clear"]')
        page.click('#view-standard [data-val="3"]')
        page.click('#view-standard [data-action="add"]')
        page.click('#view-standard [data-val="7"]')
        page.click('#view-standard [data-action="equals"]')
        text = page.locator("#std-display").inner_text()
        assert "10" in text

    def test_subtraction(self, page):
        self._ensure_standard(page)
        page.click('#view-standard [data-action="clear"]')
        page.click('#view-standard [data-val="9"]')
        page.click('#view-standard [data-action="subtract"]')
        page.click('#view-standard [data-val="4"]')
        page.click('#view-standard [data-action="equals"]')
        text = page.locator("#std-display").inner_text()
        assert "5" in text

    def test_multiplication(self, page):
        self._ensure_standard(page)
        page.click('#view-standard [data-action="clear"]')
        page.click('#view-standard [data-val="6"]')
        page.click('#view-standard [data-action="multiply"]')
        page.click('#view-standard [data-val="8"]')
        page.click('#view-standard [data-action="equals"]')
        text = page.locator("#std-display").inner_text()
        assert "48" in text

    def test_division(self, page):
        self._ensure_standard(page)
        page.click('#view-standard [data-action="clear"]')
        page.click('#view-standard [data-val="2"]')
        page.click('#view-standard [data-val="0"]')
        page.click('#view-standard [data-action="divide"]')
        page.click('#view-standard [data-val="4"]')
        page.click('#view-standard [data-action="equals"]')
        text = page.locator("#std-display").inner_text()
        assert "5" in text

    def test_clear(self, page):
        self._ensure_standard(page)
        page.click('#view-standard [data-val="5"]')
        page.click('#view-standard [data-action="clear"]')
        text = page.locator("#std-display").inner_text()
        assert text == "0"

    def test_decimal(self, page):
        self._ensure_standard(page)
        page.click('#view-standard [data-action="clear"]')
        page.click('#view-standard [data-val="3"]')
        page.click('#view-standard [data-val="."]')
        page.click('#view-standard [data-val="5"]')
        text = page.locator("#std-display").inner_text()
        assert "3.5" in text

    def test_expression_formatting_no_zero_times_zero(self, page):
        self._ensure_standard(page)
        page.click('#view-standard [data-action="clear"]')
        page.click('#view-standard [data-val="2"]')
        page.click('#view-standard [data-val="5"]')
        page.click('#view-standard [data-val="8"]')
        page.click('#view-standard [data-val="2"]')
        page.click('#view-standard [data-action="multiply"]')

        # Verify expression shows real number, NOT 0 *
        expr = page.locator("#std-expression").inner_text()
        assert "2,582" in expr and "0 ×" not in expr

        page.click('#view-standard [data-val="2"]')
        page.click('#view-standard [data-val="6"]')
        page.click('#view-standard [data-val="2"]')
        page.click('#view-standard [data-val="0"]')
        page.click('#view-standard [data-action="equals"]')

        expr_after = page.locator("#std-expression").inner_text()
        assert "2,582 × 2,620 =" in expr_after
        assert "0 × 0 =" not in expr_after
        display_val = page.locator("#std-display").inner_text()
        assert "6,764,840" in display_val

        # Verify expression clears when user starts typing a new calculation
        page.click('#view-standard [data-val="5"]')
        expr_cleared = page.locator("#std-expression").inner_text()
        assert expr_cleared == ""

    def test_standard_advanced_functions(self, page):
        self._ensure_standard(page)
        # Square
        page.click('#view-standard [data-action="clear"]')
        page.click('#view-standard [data-val="9"]')
        page.click('#view-standard [data-action="square"]')
        assert page.locator("#std-display").inner_text() == "81"

        # Square root
        page.click('#view-standard [data-action="sqrt"]')
        assert page.locator("#std-display").inner_text() == "9"

        # Reciprocal
        page.click('#view-standard [data-action="clear"]')
        page.click('#view-standard [data-val="4"]')
        page.click('#view-standard [data-action="reciprocal"]')
        assert page.locator("#std-display").inner_text() == "0.25"

        # Negate
        page.click('#view-standard [data-action="negate"]')
        assert "-0.25" in page.locator("#std-display").inner_text()

        # Backspace & CE
        page.click('#view-standard [data-action="clear"]')
        page.click('#view-standard [data-val="1"]')
        page.click('#view-standard [data-val="2"]')
        page.click('#view-standard [data-val="3"]')
        page.click('#view-standard [data-action="backspace"]')
        assert page.locator("#std-display").inner_text() == "12"
        page.click('#view-standard [data-action="ce"]')
        assert page.locator("#std-display").inner_text() == "0"

    def test_standard_divide_by_zero(self, page):
        self._ensure_standard(page)
        page.click('#view-standard [data-action="clear"]')
        page.click('#view-standard [data-val="5"]')
        page.click('#view-standard [data-action="divide"]')
        page.click('#view-standard [data-val="0"]')
        page.click('#view-standard [data-action="equals"]')
        assert "Cannot divide by zero" in page.locator("#std-display").inner_text()


# ────────────────────────── Scientific Calculator ──────────────────────────

class TestScientificCalculator:
    def _ensure_sci(self, page):
        page.click('[data-calc="scientific"]')

    def test_deg_rad_toggle(self, page):
        self._ensure_sci(page)
        deg_btn = page.locator("#sci-deg-btn")
        rad_btn = page.locator("#sci-rad-btn")
        mode = page.locator("#sci-mode-indicator")

        rad_btn.click()
        assert mode.inner_text() == "RAD"
        deg_btn.click()
        assert mode.inner_text() == "DEG"

    def test_sin_degrees(self, page):
        self._ensure_sci(page)
        page.click("#sci-deg-btn")
        page.click('#view-scientific [data-action="sci-clear"]')
        page.click('#view-scientific [data-val="9"]')
        page.click('#view-scientific [data-val="0"]')
        page.click('#view-scientific [data-action="sci-sin"]')
        val = float(page.locator("#sci-display").inner_text())
        assert abs(val - 1.0) < 0.001

    def test_cos_and_tan(self, page):
        self._ensure_sci(page)
        page.click("#sci-deg-btn")
        page.click('#view-scientific [data-action="sci-clear"]')
        page.click('#view-scientific [data-val="0"]')
        page.click('#view-scientific [data-action="sci-cos"]')
        val_cos = float(page.locator("#sci-display").inner_text())
        assert abs(val_cos - 1.0) < 0.001

        page.click('#view-scientific [data-action="sci-clear"]')
        page.click('#view-scientific [data-val="4"]')
        page.click('#view-scientific [data-val="5"]')
        page.click('#view-scientific [data-action="sci-tan"]')
        val_tan = float(page.locator("#sci-display").inner_text())
        assert abs(val_tan - 1.0) < 0.001

    def test_2nd_mode_arcsin(self, page):
        self._ensure_sci(page)
        page.click("#sci-deg-btn")
        page.click('#view-scientific [data-action="sci-clear"]')
        page.click('#view-scientific [data-action="sci-2nd"]')
        page.click('#view-scientific [data-val="1"]')
        page.click('#view-scientific [data-action="sci-sin"]')  # asin(1) = 90 deg
        val = float(page.locator("#sci-display").inner_text())
        assert abs(val - 90.0) < 0.001
        # Toggle 2nd back off
        page.click('#view-scientific [data-action="sci-2nd"]')

    def test_square_root(self, page):
        self._ensure_sci(page)
        page.click('#view-scientific [data-action="sci-clear"]')
        page.click('#view-scientific [data-val="8"]')
        page.click('#view-scientific [data-val="1"]')
        page.click('#view-scientific [data-action="sci-sqrt"]')
        val = float(page.locator("#sci-display").inner_text())
        assert abs(val - 9.0) < 0.001

    def test_powers_and_roots(self, page):
        self._ensure_sci(page)
        # Power x^y: 2^5 = 32
        page.click('#view-scientific [data-action="sci-clear"]')
        page.click('#view-scientific [data-val="2"]')
        page.click('#view-scientific [data-action="sci-power"]')
        page.click('#view-scientific [data-val="5"]')
        page.click('#view-scientific [data-action="sci-equals"]')
        assert page.locator("#sci-display").inner_text() == "32"

        # Cube: 4^3 = 64
        page.click('#view-scientific [data-action="sci-clear"]')
        page.click('#view-scientific [data-val="4"]')
        page.click('#view-scientific [data-action="sci-cube"]')
        assert page.locator("#sci-display").inner_text() == "64"

        # Cube root: cbrt(64) = 4
        page.click('#view-scientific [data-action="sci-cbrt"]')
        assert page.locator("#sci-display").inner_text() == "4"

        # 10^x: 10^3 = 1000
        page.click('#view-scientific [data-action="sci-clear"]')
        page.click('#view-scientific [data-val="3"]')
        page.click('#view-scientific [data-action="sci-10x"]')
        assert "1,000" in page.locator("#sci-display").inner_text()

        # e^x: e^0 = 1
        page.click('#view-scientific [data-action="sci-clear"]')
        page.click('#view-scientific [data-val="0"]')
        page.click('#view-scientific [data-action="sci-ex"]')
        assert page.locator("#sci-display").inner_text() == "1"

    def test_logs_factorial_abs_mod(self, page):
        self._ensure_sci(page)
        # log10(100) = 2
        page.click('#view-scientific [data-action="sci-clear"]')
        page.click('#view-scientific [data-val="1"]')
        page.click('#view-scientific [data-val="0"]')
        page.click('#view-scientific [data-val="0"]')
        page.click('#view-scientific [data-action="sci-log"]')
        assert page.locator("#sci-display").inner_text() == "2"

        # Factorial: 5! = 120
        page.click('#view-scientific [data-action="sci-clear"]')
        page.click('#view-scientific [data-val="5"]')
        page.click('#view-scientific [data-action="sci-factorial"]')
        assert page.locator("#sci-display").inner_text() == "120"

        # Abs: |-42| = 42
        page.click('#view-scientific [data-action="sci-clear"]')
        page.click('#view-scientific [data-val="4"]')
        page.click('#view-scientific [data-val="2"]')
        page.click('#view-scientific [data-action="sci-negate"]')
        page.click('#view-scientific [data-action="sci-abs"]')
        assert page.locator("#sci-display").inner_text() == "42"

        # Mod: 17 mod 5 = 2
        page.click('#view-scientific [data-action="sci-clear"]')
        page.click('#view-scientific [data-val="1"]')
        page.click('#view-scientific [data-val="7"]')
        page.click('#view-scientific [data-action="sci-mod"]')
        page.click('#view-scientific [data-val="5"]')
        page.click('#view-scientific [data-action="sci-equals"]')
        assert page.locator("#sci-display").inner_text() == "2"

    def test_constants_pi_e(self, page):
        self._ensure_sci(page)
        page.click('#view-scientific [data-action="sci-clear"]')
        page.click('#view-scientific [data-action="sci-pi"]')
        pi_val = float(page.locator("#sci-display").inner_text())
        assert abs(pi_val - math.pi) < 0.001

        page.click('#view-scientific [data-action="sci-clear"]')
        page.click('#view-scientific [data-action="sci-e"]')
        e_val = float(page.locator("#sci-display").inner_text())
        assert abs(e_val - math.e) < 0.001

    def test_memory_functions(self, page):
        self._ensure_sci(page)
        page.click('#view-scientific [data-action="sci-mc"]')
        page.click('#view-scientific [data-action="sci-clear"]')
        # Store 50 in memory
        page.click('#view-scientific [data-val="5"]')
        page.click('#view-scientific [data-val="0"]')
        page.click('#view-scientific [data-action="sci-mplus"]')

        # Add 25 to memory -> 75
        page.click('#view-scientific [data-val="2"]')
        page.click('#view-scientific [data-val="5"]')
        page.click('#view-scientific [data-action="sci-mplus"]')

        # Clear display and recall memory
        page.click('#view-scientific [data-action="sci-clear"]')
        page.click('#view-scientific [data-action="sci-mr"]')
        assert page.locator("#sci-display").inner_text() == "75"

        # Subtract 15 from memory -> 60
        page.click('#view-scientific [data-val="1"]')
        page.click('#view-scientific [data-val="5"]')
        page.click('#view-scientific [data-action="sci-mminus"]')

        page.click('#view-scientific [data-action="sci-clear"]')
        page.click('#view-scientific [data-action="sci-mr"]')
        assert page.locator("#sci-display").inner_text() == "60"

        # Clear memory
        page.click('#view-scientific [data-action="sci-mc"]')
        page.click('#view-scientific [data-action="sci-mr"]')
        assert page.locator("#sci-display").inner_text() == "0"

    def test_multi_operand_pemdas(self, page):
        self._ensure_sci(page)
        page.click('#view-scientific [data-action="sci-clear"]')
        # 2 + 3 × 4 = 14 (NOT 20)
        page.click('#view-scientific [data-val="2"]')
        page.click('#view-scientific [data-action="sci-add"]')
        page.click('#view-scientific [data-val="3"]')
        page.click('#view-scientific [data-action="sci-multiply"]')
        page.click('#view-scientific [data-val="4"]')
        page.click('#view-scientific [data-action="sci-equals"]')

        assert page.locator("#sci-display").inner_text() == "14"
        expr = page.locator("#sci-expression").inner_text()
        assert "2 + 3 × 4 =" in expr

    def test_multi_step_chaining(self, page):
        self._ensure_sci(page)
        page.click('#view-scientific [data-action="sci-clear"]')
        # 10 + 20 ÷ 4 − 3 = 12
        page.click('#view-scientific [data-val="1"]')
        page.click('#view-scientific [data-val="0"]')
        page.click('#view-scientific [data-action="sci-add"]')
        page.click('#view-scientific [data-val="2"]')
        page.click('#view-scientific [data-val="0"]')
        page.click('#view-scientific [data-action="sci-divide"]')
        page.click('#view-scientific [data-val="4"]')
        page.click('#view-scientific [data-action="sci-subtract"]')
        page.click('#view-scientific [data-val="3"]')
        page.click('#view-scientific [data-action="sci-equals"]')

        assert page.locator("#sci-display").inner_text() == "12"
        expr = page.locator("#sci-expression").inner_text()
        assert "10 + 20 ÷ 4 − 3 =" in expr

    def test_parentheses_precedence(self, page):
        self._ensure_sci(page)
        page.click('#view-scientific [data-action="sci-clear"]')
        # ( 2 + 3 ) × 4 = 20
        page.click('#view-scientific [data-action="sci-lparen"]')
        page.click('#view-scientific [data-val="2"]')
        page.click('#view-scientific [data-action="sci-add"]')
        page.click('#view-scientific [data-val="3"]')
        page.click('#view-scientific [data-action="sci-rparen"]')
        page.click('#view-scientific [data-action="sci-multiply"]')
        page.click('#view-scientific [data-val="4"]')
        page.click('#view-scientific [data-action="sci-equals"]')

        assert page.locator("#sci-display").inner_text() == "20"
        expr = page.locator("#sci-expression").inner_text()
        assert "( 2 + 3 ) × 4 =" in expr

    def test_negative_operand_division(self, page):
        """Tests the exact calculation shown in user screenshot: -369 ÷ 2 = -184.5"""
        self._ensure_sci(page)
        page.click('#view-scientific [data-action="sci-clear"]')
        # Click minus first to start negative number: -369
        page.click('#view-scientific [data-action="sci-subtract"]')
        page.click('#view-scientific [data-val="3"]')
        page.click('#view-scientific [data-val="6"]')
        page.click('#view-scientific [data-val="9"]')
        page.click('#view-scientific [data-action="sci-divide"]')
        page.click('#view-scientific [data-val="2"]')
        page.click('#view-scientific [data-action="sci-equals"]')

        display_val = page.locator("#sci-display").inner_text()
        assert "-184.5" in display_val
        expr = page.locator("#sci-expression").inner_text()
        assert "-369 ÷ 2 =" in expr

    def test_power_precedence_in_expression(self, page):
        self._ensure_sci(page)
        page.click('#view-scientific [data-action="sci-clear"]')
        # 2 + 3 ^ 2 = 11 (powers evaluated before addition)
        page.click('#view-scientific [data-val="2"]')
        page.click('#view-scientific [data-action="sci-add"]')
        page.click('#view-scientific [data-val="3"]')
        page.click('#view-scientific [data-action="sci-power"]')
        page.click('#view-scientific [data-val="2"]')
        page.click('#view-scientific [data-action="sci-equals"]')

        assert page.locator("#sci-display").inner_text() == "11"

    def test_continue_chaining_after_equals(self, page):
        self._ensure_sci(page)
        page.click('#view-scientific [data-action="sci-clear"]')
        # 5 × 4 = 20, then + 6 = 26
        page.click('#view-scientific [data-val="5"]')
        page.click('#view-scientific [data-action="sci-multiply"]')
        page.click('#view-scientific [data-val="4"]')
        page.click('#view-scientific [data-action="sci-equals"]')
        assert page.locator("#sci-display").inner_text() == "20"

        # Continue calculation using result
        page.click('#view-scientific [data-action="sci-add"]')
        page.click('#view-scientific [data-val="6"]')
        page.click('#view-scientific [data-action="sci-equals"]')
        assert page.locator("#sci-display").inner_text() == "26"



# ────────────────────────── Converters & Non-Negative Validation ──────────────────────────

class TestConverters:
    def test_weight_conversion(self, page):
        page.click('[data-calc="weight"]')
        page.fill("#weight-input", "1")
        page.select_option("#weight-from", "kg")
        page.select_option("#weight-to", "lb")
        page.wait_for_timeout(100)
        result = page.locator("#weight-output").inner_text()
        val = float(result.replace(",", ""))
        assert abs(val - 2.20462) < 0.02

    def test_weight_negative_guard(self, page):
        page.click('[data-calc="weight"]')
        page.fill("#weight-input", "-5")
        page.wait_for_timeout(100)
        input_val = page.locator("#weight-input").input_value()
        out_val = float(page.locator("#weight-output").inner_text().replace(",", ""))
        assert float(input_val) >= 0
        assert out_val >= 0

    def test_length_conversion(self, page):
        page.click('[data-calc="length"]')
        page.fill("#length-input", "1")
        page.select_option("#length-from", "m")
        page.select_option("#length-to", "ft")
        page.wait_for_timeout(100)
        result = page.locator("#length-output").inner_text()
        val = float(result.replace(",", ""))
        assert abs(val - 3.28084) < 0.02

    def test_length_negative_guard(self, page):
        page.click('[data-calc="length"]')
        page.fill("#length-input", "-10")
        page.wait_for_timeout(100)
        input_val = page.locator("#length-input").input_value()
        out_val = float(page.locator("#length-output").inner_text().replace(",", ""))
        assert float(input_val) >= 0
        assert out_val >= 0

    def test_temperature_c_to_f(self, page):
        page.click('[data-calc="temperature"]')
        page.fill("#temp-input", "100")
        page.select_option("#temp-from", "c")
        page.select_option("#temp-to", "f")
        page.wait_for_timeout(100)
        result = page.locator("#temp-output").inner_text()
        val = float(result.replace(",", ""))
        assert abs(val - 212) < 0.1

    def test_speed_conversion(self, page):
        page.click('[data-calc="speed"]')
        page.fill("#speed-input", "100")
        page.select_option("#speed-from", "kmh")
        page.select_option("#speed-to", "mph")
        page.wait_for_timeout(100)
        result = page.locator("#speed-output").inner_text()
        val = float(result.replace(",", ""))
        assert abs(val - 62.137) < 0.5

    def test_area_conversion(self, page):
        page.click('[data-calc="area"]')
        page.fill("#area-input", "10")
        page.select_option("#area-from", "sqm")
        page.select_option("#area-to", "sqft")
        page.wait_for_timeout(100)
        result = page.locator("#area-output").inner_text()
        val = float(result.replace(",", ""))
        assert abs(val - 107.639) < 0.2

    def test_currency_formatting(self, page):
        page.click('[data-calc="currency"]')
        page.fill("#currency-input", "100")
        page.select_option("#currency-from", "USD")
        page.select_option("#currency-to", "EUR")
        page.wait_for_timeout(100)
        result = page.locator("#currency-output").inner_text()
        assert "." in result
        # Verify 2 decimals format
        decimals = result.split(".")[1]
        assert len(decimals) == 2

    def test_swap_button(self, page):
        page.click('[data-calc="weight"]')
        page.select_option("#weight-from", "kg")
        page.select_option("#weight-to", "lb")
        page.fill("#weight-input", "1")
        page.wait_for_timeout(100)
        page.click("#weight-swap")
        page.wait_for_timeout(150)
        from_val = page.locator("#weight-from").input_value()
        to_val = page.locator("#weight-to").input_value()
        assert from_val == "lb"
        assert to_val == "kg"


# ────────────────────────── Multi-Grid Workstations (Max 4) ──────────────────────────

class TestMultiGrids:
    def test_unit_grid_add_and_remove(self, page):
        page.click('.grid-mode-btn[data-calc="unit-grid"]')
        page.wait_for_timeout(100)
        initial_count = page.locator("#unit-grid-container .grid-card").count()
        assert initial_count >= 2

        # Add card
        page.click("#add-unit-grid-card")
        page.wait_for_timeout(100)
        new_count = page.locator("#unit-grid-container .grid-card").count()
        assert new_count == initial_count + 1

        # Remove a card
        page.click("#unit-grid-container .grid-card-remove >> nth=0")
        page.wait_for_timeout(100)
        after_remove = page.locator("#unit-grid-container .grid-card").count()
        assert after_remove == initial_count

    def test_finance_grid_add_and_remove(self, page):
        page.click('.grid-mode-btn[data-calc="finance-grid"]')
        page.wait_for_timeout(100)
        initial_count = page.locator("#finance-grid-container .grid-card").count()
        assert initial_count >= 2

        page.click("#add-finance-grid-card")
        page.wait_for_timeout(100)
        assert page.locator("#finance-grid-container .grid-card").count() == initial_count + 1


# ────────────────────────── Enhanced BMI & Finance Tools ──────────────────────────

class TestBMIAndFinance:
    def test_bmi_metric_with_gender_and_age(self, page):
        page.click('[data-calc="bmi"]')
        page.click('.gender-btn[data-gender="female"]')
        page.fill("#bmi-age", "28")
        page.click('button[data-bmi-unit="metric"]')
        page.fill("#bmi-weight-kg", "60")
        page.fill("#bmi-height-cm", "165")
        page.click("#bmi-calc")
        page.wait_for_timeout(100)
        result = page.locator("#bmi-result").inner_text()
        assert "22.0" in result
        assert "Normal" in result
        assert "Body Fat" in result
        assert "FEMALE" in result

    def test_bmi_imperial(self, page):
        page.click('[data-calc="bmi"]')
        page.click('.gender-btn[data-gender="male"]')
        page.click('button[data-bmi-unit="imperial"]')
        page.fill("#bmi-weight-lb", "160")
        page.fill("#bmi-height-ft", "5")
        page.fill("#bmi-height-in", "10")
        page.click("#bmi-calc")
        page.wait_for_timeout(100)
        result = page.locator("#bmi-result").inner_text()
        assert "23.0" in result
        assert "Normal" in result

    def test_tip_split(self, page):
        page.click('[data-calc="tip"]')
        page.fill("#tip-bill", "100")
        page.fill("#tip-custom-pct", "20")
        page.fill("#tip-people", "4")
        page.click("#tip-calc")
        page.wait_for_timeout(100)
        result = page.locator("#tip-result").inner_text()
        assert "120.00" in result
        assert "30.00" in result

    def test_unit_price(self, page):
        page.click('[data-calc="unitprice"]')
        page.fill("#up-price", "100")
        page.fill("#up-discount", "25")
        page.fill("#up-qty", "3")
        page.click("#up-calc")
        page.wait_for_timeout(100)
        result = page.locator("#up-result").inner_text()
        assert "75.00" in result
        assert "25.00" in result


# ────────────────────────── Math Solvers & Date Time ──────────────────────────

class TestMathAndDateTime:
    def test_percentage(self, page):
        page.click('[data-calc="percentage"]')
        page.click('[data-pct-tab="of"]')
        page.fill("#pct-of-percent", "25")
        page.fill("#pct-of-number", "200")
        page.click("#pct-of-calc")
        page.wait_for_timeout(100)
        result = page.locator("#pct-of-result").inner_text()
        assert "50" in result

    def test_linear_equation(self, page):
        page.click('[data-calc="equations"]')
        page.click('[data-eq-tab="linear"]')
        page.fill("#eq-a", "2")
        page.fill("#eq-b", "-6")
        page.click("#eq-linear-solve")
        page.wait_for_timeout(100)
        result = page.locator("#eq-linear-result").inner_text()
        assert "3" in result

    def test_quadratic_equation(self, page):
        page.click('[data-eq-tab="quadratic"]')
        page.fill("#eq-qa", "1")
        page.fill("#eq-qb", "-5")
        page.fill("#eq-qc", "6")
        page.click("#eq-quad-solve")
        page.wait_for_timeout(100)
        result = page.locator("#eq-quad-result").inner_text()
        assert "3" in result
        assert "2" in result

    def test_age_calculation(self, page):
        page.click('[data-calc="age"]')
        page.fill("#age-dob", "2000-01-01")
        page.fill("#age-asof", "2026-09-22")
        page.click("#age-calc")
        page.wait_for_timeout(100)
        result = page.locator("#age-result").inner_text()
        assert "26" in result

    def test_time_interval(self, page):
        page.click('[data-calc="time-interval"]')
        page.fill("#ti-start", "2020-01-01")
        page.fill("#ti-end", "2021-01-01")
        page.click("#ti-calc")
        page.wait_for_timeout(100)
        result = page.locator("#ti-result").inner_text()
        assert "1 year" in result.lower() or "366" in result or "1 years" in result


# ────────────────────────── Desmos Graph with On-Screen Math Keypad ──────────────────────────

class TestDesmosGraph:
    def test_graph_view_and_canvas(self, page):
        page.click('[data-calc="graph"]')
        page.wait_for_timeout(300)
        canvas = page.locator("#graph-canvas")
        assert canvas.is_visible()

    def test_desmos_virtual_keypad_toggle(self, page):
        page.click('[data-calc="graph"]')
        page.wait_for_timeout(200)
        keypad = page.locator("#desmos-keypad")
        toggle = page.locator("#desmos-keypad-toggle")
        assert keypad.is_visible()

        # Click toggle pill to collapse
        toggle.click()
        page.wait_for_timeout(250)
        assert "collapsed" in keypad.get_attribute("class")

        # Click toggle pill to expand
        toggle.click()
        page.wait_for_timeout(250)
        assert "collapsed" not in keypad.get_attribute("class")

    def test_virtual_keypad_typing_and_latex_preview(self, page):
        page.click('[data-calc="graph"]')
        page.wait_for_timeout(200)

        # Focus first expression input
        first_input = page.locator(".graph-expr >> nth=0")
        first_input.fill("")
        first_input.focus()

        # Click keypad buttons: 'x' and '^2'
        page.click('#desmos-keypad .kbtn[data-k="x"]')
        page.click('#desmos-keypad .kbtn[data-k="^2"]')
        page.wait_for_timeout(150)

        assert "x^2" in first_input.input_value() or "x" in first_input.input_value()
        # Verify LaTeX preview formatted
        preview = page.locator("#latex-preview-0").inner_text()
        assert "x" in preview or "²" in preview

    def test_graph_add_button_text_is_plus(self, page):
        page.click('[data-calc="graph"]')
        page.wait_for_timeout(200)
        btn = page.locator("#graph-add")
        assert btn.inner_text().strip() == "+"

    def test_graph_table_custom_range_and_editable_values(self, page):
        page.click('[data-calc="graph"]')
        page.wait_for_timeout(200)

        # Type y = sin(x) with y= prefix into first expression
        first_input = page.locator(".graph-expr >> nth=0")
        first_input.fill("y = sin(x)")
        first_input.dispatch_event("input")
        page.wait_for_timeout(100)

        # Open Table
        page.click("#graph-table-toggle")
        page.wait_for_timeout(200)
        table_container = page.locator("#graph-table-container")
        assert table_container.is_visible()

        # Set custom range: 0 to 4 step 2
        page.fill("#tbl-start-x", "0")
        page.fill("#tbl-end-x", "4")
        page.fill("#tbl-step-x", "2")
        page.click("#tbl-gen-btn")
        page.wait_for_timeout(150)

        # Verify rows generated and values are valid numbers (not undefined)
        rows = page.locator("#graph-table-body tr")
        assert rows.count() == 3  # 0, 2, 4
        y_val_0 = rows.nth(0).locator(".table-y-cell").inner_text()
        assert y_val_0 == "0" or y_val_0 == "0.0" or "0" in y_val_0
        assert "undefined" not in y_val_0

        # Test editing an x-value directly in the table
        first_x_input = rows.nth(0).locator(".table-x-val")
        first_x_input.fill("1.5708")
        first_x_input.dispatch_event("input")
        page.wait_for_timeout(150)
        updated_y = rows.nth(0).locator(".table-y-cell").inner_text()
        # sin(pi/2) ~ 1
        assert "1" in updated_y or "0.999" in updated_y

    def test_keypad_extended_functions_drawer(self, page):
        page.click('[data-calc="graph"]')
        page.wait_for_timeout(200)

        page.click("#kbtn-more-fn")
        page.wait_for_timeout(150)
        drawer = page.locator("#keypad-extra-fns")
        assert drawer.is_visible()

        # Verify extended math functions exist
        assert page.locator('#keypad-extra-fns [data-k="cot("]').is_visible()
        assert page.locator('#keypad-extra-fns [data-k="sec("]').is_visible()
        assert page.locator('#keypad-extra-fns [data-k="log2("]').is_visible()
        assert page.locator('#keypad-extra-fns [data-k="round("]').is_visible()


class TestUserRefinements:
    def test_independent_bmi_kg_and_ft(self, page):
        page.click('[data-calc="bmi"]')
        page.wait_for_timeout(200)

        # Choose KG for weight, FT for height
        page.click('#bmi-w-unit-toggle [data-w-unit="kg"]')
        page.click('#bmi-h-unit-toggle [data-h-unit="ft"]')

        page.fill("#bmi-weight-kg", "70")
        page.fill("#bmi-height-ft", "5")
        page.fill("#bmi-height-in", "9")
        page.click("#bmi-calc")

        result = page.locator("#bmi-result").inner_text()
        # 70 kg, 5'9" (1.7526m) -> BMI approx 22.8
        assert "BMI Score:" in result
        assert "22." in result or "23." in result

    def test_independent_bmi_lb_and_cm(self, page):
        page.click('[data-calc="bmi"]')
        page.wait_for_timeout(200)

        # Choose LB for weight, CM for height
        page.click('#bmi-w-unit-toggle [data-w-unit="lb"]')
        page.click('#bmi-h-unit-toggle [data-h-unit="cm"]')

        page.fill("#bmi-weight-lb", "154")
        page.fill("#bmi-height-cm", "175")
        page.click("#bmi-calc")

        result = page.locator("#bmi-result").inner_text()
        assert "BMI Score:" in result
        assert "22." in result or "23." in result

    def test_unit_converter_digit_color_is_white(self, page):
        page.click('[data-calc="weight"]')
        page.wait_for_timeout(200)

        output_el = page.locator("#weight-output")
        color = output_el.evaluate("el => window.getComputedStyle(el).color")
        # rgb(248, 250, 252) is #f8fafc (var(--text))
        assert "248" in color or "255" in color or "250" in color
        assert color != "rgb(56, 189, 248)"  # not blue

    def test_operator_font_size(self, page):
        page.click('[data-calc="standard"]')
        page.wait_for_timeout(200)
        btn_add = page.locator('.calc-btn.btn-op[data-action="add"]')
        font_size = btn_add.evaluate("el => parseFloat(window.getComputedStyle(el).fontSize)")
        assert font_size >= 24  # Large, readable operators

    def test_calculator_scrollbar_removed_and_graph_custom_scrollbar(self, page):
        # 1. Standard calculator display has zero scrollbar
        page.click('[data-calc="standard"]')
        page.wait_for_timeout(200)
        std_display = page.locator("#std-display")
        sb_width_std = std_display.evaluate("el => window.getComputedStyle(el).scrollbarWidth")
        assert sb_width_std == "none"

        # 2. Scientific calculator display has zero scrollbar
        page.click('[data-calc="scientific"]')
        page.wait_for_timeout(200)
        sci_display = page.locator("#sci-display")
        sb_width_sci = sci_display.evaluate("el => window.getComputedStyle(el).scrollbarWidth")
        assert sb_width_sci == "none"

        # 3. Graph keypad drawer has custom sleek scrollbar (not none, not white)
        page.click('[data-calc="graph"]')
        page.wait_for_timeout(200)
        drawer = page.locator("#keypad-extra-fns")
        sb_width_drawer = drawer.evaluate("el => window.getComputedStyle(el).scrollbarWidth")
        assert sb_width_drawer == "thin"

    def test_operator_unrotated_and_clean_math_typography(self, page):
        # Verify 13 + expression uses BevellierDigits for numbers and clean upright math font for operators
        page.click('[data-calc="standard"]')
        page.wait_for_timeout(200)
        page.click('#view-standard [data-action="clear"]')
        page.click('#view-standard [data-val="1"]')
        page.click('#view-standard [data-val="3"]')
        page.click('#view-standard [data-action="add"]')
        
        expr = page.locator("#std-expression").inner_text()
        assert expr == "13 +"

        # Operator button uses clean math font rather than decorative tilted glyph
        btn_add = page.locator('.calc-btn.btn-op[data-action="add"]')
        font_family = btn_add.evaluate("el => window.getComputedStyle(el).fontFamily")
        assert "sans-serif" in font_family or "system-ui" in font_family or "Segoe UI" in font_family or "Roboto" in font_family
