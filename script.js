/**
 * CalcVerse Core Application Logic
 * Pure vanilla JavaScript (ES6+). Zero external runtime dependencies.
 * Anti-AI-slop compliant: Deterministic, robust, high performance.
 */

'use strict';

document.addEventListener('DOMContentLoaded', () => {

    // ==========================================================================
    // 1. NAVIGATION & HISTORY SYSTEM
    // ==========================================================================
    const navItems = document.querySelectorAll('.nav-item');
    const calcViews = document.querySelectorAll('.calc-view');
    const calcTitle = document.getElementById('calc-title');
    const menuToggle = document.getElementById('menu-toggle');
    const sidebar = document.getElementById('sidebar');
    const sidebarOverlay = document.getElementById('sidebar-overlay');
    const navSearch = document.getElementById('nav-search');

    // History drawer elements
    const historyDrawer = document.getElementById('history-drawer');
    const historyToggleBtn = document.getElementById('history-toggle-btn');
    const historyCloseBtn = document.getElementById('history-close-btn');
    const historyClearBtn = document.getElementById('history-clear-btn');
    const historyList = document.getElementById('history-list');

    let graphInitialized = false;
    let calculationHistory = [];

    const VIEW_TITLES = {
        'standard': 'Standard',
        'scientific': 'Scientific',
        'percentage': 'Percentage',
        'equations': 'Equations',
        'graph': 'Graph',
        'unit-grid': 'Unit Converters Grid',
        'weight': 'Weight Converter',
        'length': 'Length Converter',
        'volume': 'Volume Converter',
        'temperature': 'Temperature Converter',
        'speed': 'Speed Converter',
        'angle': 'Angle Converter',
        'area': 'Area Converter',
        'datastorage': 'Data Storage Converter',
        'finance-grid': 'Finance Tools Grid',
        'currency': 'Currency Converter',
        'tip': 'Tip & Split Bill',
        'unitprice': 'Unit Price & Discount',
        'bmi': 'Body Mass Index (BMI)',
        'age': 'Age Calculator',
        'time-interval': 'Time Interval'
    };

    function setActiveView(calcName) {
        calcViews.forEach(view => {
            view.classList.remove('active');
            if (view.id === `view-${calcName}`) {
                view.classList.add('active');
            }
        });

        navItems.forEach(item => {
            const matches = item.dataset.calc === calcName;
            item.classList.toggle('active', matches);
        });

        if (calcTitle) {
            calcTitle.textContent = VIEW_TITLES[calcName] || calcName;
        }

        // Initialize or resize Graph on view
        if (calcName === 'graph') {
            if (!graphInitialized && typeof window.initGraph === 'function') {
                setTimeout(() => {
                    window.initGraph();
                    graphInitialized = true;
                }, 60);
            } else if (graphInitialized && typeof window.resizeGraph === 'function') {
                setTimeout(() => window.resizeGraph(), 60);
            }
        }

        // Ensure grid views render when opened
        if (calcName === 'unit-grid') {
            renderUnitGrid();
        } else if (calcName === 'finance-grid') {
            renderFinanceGrid();
        }

        // Close sidebar on mobile
        if (sidebar) sidebar.classList.remove('open');
        if (sidebarOverlay) sidebarOverlay.classList.remove('open');
    }

    navItems.forEach(item => {
        item.addEventListener('click', () => {
            const calcName = item.dataset.calc;
            if (calcName) setActiveView(calcName);
        });
    });

    // Grid mode buttons in sidebar headers
    document.querySelectorAll('.grid-mode-btn').forEach(btn => {
        btn.addEventListener('click', e => {
            e.stopPropagation();
            const calcName = btn.dataset.calc;
            if (calcName) setActiveView(calcName);
        });
    });

    // Sidebar Mobile Toggle
    if (menuToggle && sidebar) {
        menuToggle.addEventListener('click', () => {
            sidebar.classList.toggle('open');
            if (sidebarOverlay) sidebarOverlay.classList.toggle('open');
        });
    }

    if (sidebarOverlay) {
        sidebarOverlay.addEventListener('click', () => {
            if (sidebar) sidebar.classList.remove('open');
            sidebarOverlay.classList.remove('open');
        });
    }

    // Sidebar Search Filter
    if (navSearch) {
        navSearch.addEventListener('input', e => {
            const query = e.target.value.toLowerCase().trim();
            navItems.forEach(item => {
                const title = (item.dataset.calcTitle || item.textContent).toLowerCase();
                const sub = (item.querySelector('.nav-item-sub')?.textContent || '').toLowerCase();
                const matches = title.includes(query) || sub.includes(query);
                item.style.display = matches ? 'flex' : 'none';
            });
            // Show/hide group labels based on whether any children are visible
            document.querySelectorAll('.nav-group').forEach(group => {
                const visibleChildren = group.querySelectorAll('.nav-item:not([style*="display: none"])');
                group.style.display = (visibleChildren.length > 0 || query === '') ? 'block' : 'none';
            });
        });
    }

    // History Drawer
    function openHistory() {
        if (historyDrawer) {
            historyDrawer.classList.add('open');
            historyDrawer.setAttribute('aria-hidden', 'false');
        }
    }

    function closeHistory() {
        if (historyDrawer) {
            historyDrawer.classList.remove('open');
            historyDrawer.setAttribute('aria-hidden', 'true');
        }
    }

    function addHistoryEntry(expr, val) {
        calculationHistory.unshift({ expr, val, time: new Date().toLocaleTimeString() });
        if (calculationHistory.length > 40) calculationHistory.pop();
        renderHistoryList();
    }

    function renderHistoryList() {
        if (!historyList) return;
        if (calculationHistory.length === 0) {
            historyList.innerHTML = '<div class="history-empty">No calculations recorded yet.</div>';
            return;
        }
        historyList.innerHTML = '';
        calculationHistory.forEach(item => {
            const div = document.createElement('div');
            div.className = 'history-item';
            div.innerHTML = `
                <div class="history-item-expr">${item.expr}</div>
                <div class="history-item-val">${item.val}</div>
            `;
            div.addEventListener('click', () => {
                const activeStd = document.getElementById('view-standard')?.classList.contains('active');
                if (activeStd) {
                    stdCurrentValue = item.val.replace(/,/g, '');
                    updateStdDisplay();
                }
            });
            historyList.appendChild(div);
        });
    }

    if (historyToggleBtn) historyToggleBtn.addEventListener('click', openHistory);
    if (historyCloseBtn) historyCloseBtn.addEventListener('click', closeHistory);
    if (historyClearBtn) {
        historyClearBtn.addEventListener('click', () => {
            calculationHistory = [];
            renderHistoryList();
        });
    }

    // Number formatting utility with precision control
    function formatNumber(val, maxDecimals = 6) {
        if (val === null || val === undefined) return '0';
        const num = typeof val === 'number' ? val : parseFloat(val);
        if (isNaN(num)) return '0';
        if (!isFinite(num)) return num.toString();
        const factor = Math.pow(10, maxDecimals);
        const rounded = Math.round((num + Number.EPSILON) * factor) / factor;
        const str = rounded.toString();
        if (str.includes('e') || Math.abs(rounded) > 1e12 || (Math.abs(rounded) < 1e-6 && rounded !== 0)) {
            return parseFloat(rounded.toPrecision(8)).toString();
        }
        const parts = str.split('.');
        const isNegZero = rounded < 0 && parts[0] === '-0';
        const intPart = parseInt(parts[0], 10);
        const formattedInt = isNaN(intPart) ? '0' : intPart.toLocaleString('en-US');
        parts[0] = isNegZero ? '-' + formattedInt : formattedInt;
        return parts.join('.');
    }

    function formatCurrency(val) {
        if (isNaN(val)) return '0.00';
        return val.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }

    // ==========================================================================
    // 2. STANDARD CALCULATOR
    // ==========================================================================
    let stdCurrentValue = '0';
    let stdPreviousValue = null;
    let stdOperator = null;
    let stdShouldResetDisplay = false;

    const stdDisplay = document.getElementById('std-display');
    const stdExpression = document.getElementById('std-expression');

    function updateStdDisplay() {
        if (!stdDisplay) return;
        const num = parseFloat(stdCurrentValue);
        if (isNaN(num)) {
            stdDisplay.textContent = stdCurrentValue;
        } else {
            if (stdCurrentValue.endsWith('.')) {
                stdDisplay.textContent = formatNumber(num) + '.';
            } else if (stdCurrentValue.includes('.') && stdCurrentValue.endsWith('0')) {
                stdDisplay.textContent = stdCurrentValue;
            } else {
                stdDisplay.textContent = formatNumber(num);
            }
        }
    }

    function stdHandleNumber(num) {
        if (stdCurrentValue === '0' || stdShouldResetDisplay) {
            stdCurrentValue = num;
            stdShouldResetDisplay = false;
            if (stdOperator === null && stdExpression) {
                stdExpression.textContent = '';
            }
        } else {
            if (num === '.' && stdCurrentValue.includes('.')) return;
            if (stdCurrentValue.replace(/[^0-9]/g, '').length >= 15) return;
            stdCurrentValue += num;
        }
        updateStdDisplay();
    }

    function stdCalculate() {
        if (stdOperator === null || stdPreviousValue === null) return;
        const prev = parseFloat(stdPreviousValue);
        const curr = parseFloat(stdCurrentValue);
        let result = 0;

        switch (stdOperator) {
            case 'add': result = prev + curr; break;
            case 'subtract': result = prev - curr; break;
            case 'multiply': result = prev * curr; break;
            case 'divide':
                if (curr === 0) {
                    stdCurrentValue = 'Cannot divide by zero';
                    stdOperator = null;
                    stdPreviousValue = null;
                    updateStdDisplay();
                    return;
                }
                result = prev / curr;
                break;
        }

        const opSymbols = { add: '+', subtract: '−', multiply: '×', divide: '÷' };
        addHistoryEntry(`${formatNumber(prev)} ${opSymbols[stdOperator]} ${formatNumber(curr)} =`, formatNumber(result));

        stdCurrentValue = result.toString();
        stdOperator = null;
        stdPreviousValue = null;
        updateStdDisplay();
    }

    function stdHandleAction(action) {
        const curr = parseFloat(stdCurrentValue);
        switch (action) {
            case 'clear':
                stdCurrentValue = '0';
                stdPreviousValue = null;
                stdOperator = null;
                if (stdExpression) stdExpression.textContent = '';
                break;
            case 'ce':
                stdCurrentValue = '0';
                break;
            case 'backspace':
                if (stdCurrentValue.length > 1) {
                    stdCurrentValue = stdCurrentValue.slice(0, -1);
                } else {
                    stdCurrentValue = '0';
                }
                break;
            case 'add':
            case 'subtract':
            case 'multiply':
            case 'divide':
                if (stdOperator !== null && !stdShouldResetDisplay) {
                    stdCalculate();
                }
                stdPreviousValue = stdCurrentValue;
                stdOperator = action;
                stdShouldResetDisplay = true;
                const symbols = { add: '+', subtract: '−', multiply: '×', divide: '÷' };
                if (stdExpression) stdExpression.textContent = `${formatNumber(stdPreviousValue)} ${symbols[action]}`;
                break;
            case 'equals':
                if (stdOperator) {
                    const symbols = { add: '+', subtract: '−', multiply: '×', divide: '÷' };
                    if (stdExpression) stdExpression.textContent = `${formatNumber(stdPreviousValue)} ${symbols[stdOperator]} ${formatNumber(stdCurrentValue)} =`;
                    stdCalculate();
                    stdShouldResetDisplay = true;
                }
                break;
            case 'percent':
                if (stdOperator && stdPreviousValue) {
                    stdCurrentValue = (parseFloat(stdPreviousValue) * (curr / 100)).toString();
                } else {
                    stdCurrentValue = (curr / 100).toString();
                }
                stdShouldResetDisplay = true;
                break;
            case 'negate':
                stdCurrentValue = (curr * -1).toString();
                break;
            case 'reciprocal':
                stdCurrentValue = (1 / curr).toString();
                stdShouldResetDisplay = true;
                break;
            case 'square':
                stdCurrentValue = (curr ** 2).toString();
                stdShouldResetDisplay = true;
                break;
            case 'sqrt':
                stdCurrentValue = Math.sqrt(curr).toString();
                stdShouldResetDisplay = true;
                break;
        }
        updateStdDisplay();
    }

    document.querySelectorAll('#view-standard .calc-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const val = btn.dataset.val;
            const action = btn.dataset.action;
            if (val !== undefined) stdHandleNumber(val);
            if (action) stdHandleAction(action);
        });
    });

    // ==========================================================================
    // 3. SCIENTIFIC CALCULATOR (Multi-Operand Expression Engine with PEMDAS)
    // ==========================================================================
    let sciCurrentValue = '0';
    let sciTokens = []; // Array of tokens { type: 'num'|'op'|'paren', value: any, display: string }
    let sciHasActiveInput = false;
    let sciShouldResetDisplay = false;
    let sciJustCalculated = false;
    let isDegMode = true;
    let sciMemory = 0;
    let is2ndActive = false;

    const sciDisplay = document.getElementById('sci-display');
    const sciExpression = document.getElementById('sci-expression');
    const sciModeIndicator = document.getElementById('sci-mode-indicator');
    const sciMemIndicator = document.getElementById('sci-mem-indicator');
    const sciDegBtn = document.getElementById('sci-deg-btn');
    const sciRadBtn = document.getElementById('sci-rad-btn');

    function updateSciDisplay() {
        if (!sciDisplay) return;
        const num = parseFloat(sciCurrentValue);
        if (isNaN(num) || sciCurrentValue === '-') {
            sciDisplay.textContent = sciCurrentValue;
        } else {
            if (sciCurrentValue.endsWith('.')) {
                sciDisplay.textContent = formatNumber(num) + '.';
            } else if (sciCurrentValue.includes('.') && sciCurrentValue.endsWith('0')) {
                sciDisplay.textContent = sciCurrentValue;
            } else {
                sciDisplay.textContent = formatNumber(num);
            }
        }
    }

    function updateSciExpression() {
        if (!sciExpression) return;
        sciExpression.textContent = sciTokens.map(t => t.display).join(' ');
    }

    function factorial(n) {
        if (n < 0 || !Number.isInteger(n)) return NaN;
        if (n > 170) return Infinity;
        let res = 1;
        for (let i = 2; i <= n; i++) res *= i;
        return res;
    }

    function toRadians(angle) {
        return isDegMode ? (angle * Math.PI) / 180 : angle;
    }

    function fromRadians(rad) {
        return isDegMode ? (rad * 180) / Math.PI : rad;
    }

    // Mathematical Evaluator with PEMDAS Order of Operations
    function evaluateScientificTokens(tokens) {
        if (!tokens || tokens.length === 0) return 0;

        const precedence = {
            'sci-add': 1,
            'sci-subtract': 1,
            'sci-multiply': 2,
            'sci-divide': 2,
            'sci-mod': 2,
            'sci-power': 3,
            'sci-nroot': 3,
            'unary-minus': 4
        };
        const rightAssoc = {
            'sci-power': true,
            'sci-nroot': true,
            'unary-minus': true
        };

        const output = [];
        const opStack = [];

        // Preprocessing for unary minus
        const processed = [];
        for (let i = 0; i < tokens.length; i++) {
            let t = tokens[i];
            if (t.type === 'op' && (t.value === 'sci-subtract' || t.value === '-')) {
                const prev = i === 0 ? null : processed[processed.length - 1];
                if (!prev || prev.type === 'op' || (prev.type === 'paren' && prev.value === '(')) {
                    t = { type: 'unary-minus', value: 'unary-minus' };
                }
            }
            processed.push(t);
        }

        for (let token of processed) {
            if (token.type === 'num') {
                output.push(token);
            } else if (token.type === 'paren' && token.value === '(') {
                opStack.push(token);
            } else if (token.type === 'paren' && token.value === ')') {
                while (opStack.length > 0 && opStack[opStack.length - 1].value !== '(') {
                    output.push(opStack.pop());
                }
                if (opStack.length > 0 && opStack[opStack.length - 1].value === '(') {
                    opStack.pop();
                }
            } else if (token.type === 'op' || token.type === 'unary-minus') {
                const val = token.value;
                while (opStack.length > 0 && opStack[opStack.length - 1].value !== '(') {
                    const top = opStack[opStack.length - 1];
                    const precTop = precedence[top.value] || 0;
                    const precVal = precedence[val] || 0;
                    if ((!rightAssoc[val] && precVal <= precTop) || (rightAssoc[val] && precVal < precTop)) {
                        output.push(opStack.pop());
                    } else {
                        break;
                    }
                }
                opStack.push(token);
            }
        }

        while (opStack.length > 0) {
            const top = opStack.pop();
            if (top.value !== '(' && top.value !== ')') {
                output.push(top);
            }
        }

        const evalStack = [];
        for (let token of output) {
            if (token.type === 'num') {
                evalStack.push(token.value);
            } else if (token.type === 'unary-minus') {
                if (evalStack.length < 1) return NaN;
                const a = evalStack.pop();
                evalStack.push(-a);
            } else if (token.type === 'op') {
                if (evalStack.length < 2) return NaN;
                const b = evalStack.pop();
                const a = evalStack.pop();
                switch (token.value) {
                    case 'sci-add': evalStack.push(a + b); break;
                    case 'sci-subtract': evalStack.push(a - b); break;
                    case 'sci-multiply': evalStack.push(a * b); break;
                    case 'sci-divide':
                        if (b === 0) return 'Cannot divide by zero';
                        evalStack.push(a / b);
                        break;
                    case 'sci-mod': evalStack.push(a % b); break;
                    case 'sci-power': evalStack.push(Math.pow(a, b)); break;
                    case 'sci-nroot': evalStack.push(Math.pow(b, 1 / a)); break;
                }
            }
        }

        if (evalStack.length !== 1) return NaN;
        return evalStack[0];
    }

    function sciHandleNumber(num) {
        if (sciJustCalculated) {
            sciTokens = [];
            if (sciExpression) sciExpression.textContent = '';
            sciCurrentValue = num === '.' ? '0.' : num;
            sciJustCalculated = false;
            sciHasActiveInput = true;
            sciShouldResetDisplay = false;
        } else if (sciShouldResetDisplay || !sciHasActiveInput || sciCurrentValue === '0') {
            sciCurrentValue = num === '.' ? '0.' : num;
            sciHasActiveInput = true;
            sciShouldResetDisplay = false;
        } else {
            if (num === '.' && sciCurrentValue.includes('.')) return;
            if (sciCurrentValue.replace(/[^0-9]/g, '').length >= 15) return;
            sciCurrentValue += num;
        }
        updateSciDisplay();
    }

    function sciHandleAction(action) {
        const curr = parseFloat(sciCurrentValue);
        const symbols = {
            'sci-add': '+',
            'sci-subtract': '−',
            'sci-multiply': '×',
            'sci-divide': '÷',
            'sci-power': '^',
            'sci-nroot': 'y√',
            'sci-mod': 'mod'
        };

        switch (action) {
            case 'sci-clear':
                sciTokens = [];
                sciCurrentValue = '0';
                sciHasActiveInput = false;
                sciShouldResetDisplay = false;
                sciJustCalculated = false;
                if (sciExpression) sciExpression.textContent = '';
                break;

            case 'sci-ce':
                sciCurrentValue = '0';
                sciHasActiveInput = false;
                sciShouldResetDisplay = false;
                break;

            case 'sci-backspace':
                if (sciHasActiveInput) {
                    if (sciCurrentValue.length > 1) {
                        sciCurrentValue = sciCurrentValue.slice(0, -1);
                    } else {
                        sciCurrentValue = '0';
                        sciHasActiveInput = false;
                    }
                } else if (sciTokens.length > 0) {
                    sciTokens.pop();
                    updateSciExpression();
                }
                break;

            case 'sci-lparen':
                if (sciJustCalculated) {
                    sciTokens = [];
                    sciJustCalculated = false;
                    if (sciExpression) sciExpression.textContent = '';
                }
                if (sciHasActiveInput) {
                    // Implicit multiplication: e.g. 5( becomes 5 × (
                    const num = parseFloat(sciCurrentValue);
                    sciTokens.push({ type: 'num', value: num, display: formatNumber(num) });
                    sciTokens.push({ type: 'op', value: 'sci-multiply', symbol: '×', display: '×' });
                    sciHasActiveInput = false;
                }
                sciTokens.push({ type: 'paren', value: '(', display: '(' });
                updateSciExpression();
                break;

            case 'sci-rparen':
                if (sciHasActiveInput) {
                    const num = parseFloat(sciCurrentValue);
                    sciTokens.push({ type: 'num', value: num, display: formatNumber(num) });
                    sciHasActiveInput = false;
                }
                sciTokens.push({ type: 'paren', value: ')', display: ')' });
                updateSciExpression();
                break;

            case 'sci-add':
            case 'sci-subtract':
            case 'sci-multiply':
            case 'sci-divide':
            case 'sci-power':
            case 'sci-nroot':
            case 'sci-mod':
                // Check if user clicked minus at start to enter a negative number
                if (action === 'sci-subtract' && !sciHasActiveInput && sciTokens.length === 0 && (sciCurrentValue === '0' || sciCurrentValue === '')) {
                    sciCurrentValue = '-';
                    sciHasActiveInput = true;
                    sciShouldResetDisplay = false;
                    updateSciDisplay();
                    return;
                }

                if (sciJustCalculated) {
                    const prevNum = parseFloat(sciCurrentValue);
                    sciTokens = [{ type: 'num', value: prevNum, display: formatNumber(prevNum) }];
                    sciJustCalculated = false;
                    sciShouldResetDisplay = false;
                } else if (sciHasActiveInput) {
                    const num = parseFloat(sciCurrentValue);
                    sciTokens.push({ type: 'num', value: num, display: formatNumber(num) });
                    sciHasActiveInput = false;
                    sciShouldResetDisplay = false;
                } else if (sciTokens.length === 0) {
                    const num = parseFloat(sciCurrentValue) || 0;
                    sciTokens.push({ type: 'num', value: num, display: formatNumber(num) });
                    sciShouldResetDisplay = false;
                } else {
                    const last = sciTokens[sciTokens.length - 1];
                    if (last.type === 'op') {
                        sciTokens.pop(); // replace last operator
                    }
                }

                sciTokens.push({ type: 'op', value: action, symbol: symbols[action], display: symbols[action] });
                updateSciExpression();
                break;

            case 'sci-equals':
                if (sciHasActiveInput) {
                    const num = parseFloat(sciCurrentValue);
                    sciTokens.push({ type: 'num', value: num, display: formatNumber(num) });
                    sciHasActiveInput = false;
                }
                if (sciTokens.length === 0) return;

                // Handle dangling trailing operator
                const lastToken = sciTokens[sciTokens.length - 1];
                if (lastToken.type === 'op') {
                    const prevNum = parseFloat(sciCurrentValue);
                    sciTokens.push({ type: 'num', value: prevNum, display: formatNumber(prevNum) });
                }

                // Auto-close any unclosed open parentheses
                const openCount = sciTokens.filter(t => t.type === 'paren' && t.value === '(').length;
                const closeCount = sciTokens.filter(t => t.type === 'paren' && t.value === ')').length;
                for (let i = 0; i < openCount - closeCount; i++) {
                    sciTokens.push({ type: 'paren', value: ')', display: ')' });
                }

                const fullExpr = sciTokens.map(t => t.display).join(' ');
                const result = evaluateScientificTokens(sciTokens);

                if (typeof result === 'string') {
                    sciCurrentValue = result;
                    sciTokens = [];
                    sciJustCalculated = true;
                    if (sciExpression) sciExpression.textContent = fullExpr + ' =';
                } else if (isNaN(result) || !isFinite(result)) {
                    sciCurrentValue = 'Error';
                    sciTokens = [];
                    sciJustCalculated = true;
                    if (sciExpression) sciExpression.textContent = fullExpr + ' =';
                } else {
                    if (sciExpression) sciExpression.textContent = fullExpr + ' =';
                    sciCurrentValue = result.toString();
                    addHistoryEntry(fullExpr + ' =', formatNumber(result));
                    sciTokens = [];
                    sciJustCalculated = true;
                }
                break;

            case 'sci-percent':
                if (sciTokens.length > 0 && sciTokens[sciTokens.length - 1].type === 'op') {
                    const lastNum = [...sciTokens].reverse().find(t => t.type === 'num');
                    const base = lastNum ? lastNum.value : 1;
                    sciCurrentValue = (base * (curr / 100)).toString();
                } else {
                    sciCurrentValue = (curr / 100).toString();
                }
                sciHasActiveInput = true;
                break;

            case 'sci-negate':
                sciCurrentValue = (curr * -1).toString();
                sciHasActiveInput = true;
                break;

            case 'sci-reciprocal':
                sciCurrentValue = (1 / curr).toString();
                sciHasActiveInput = true;
                break;

            case 'sci-square':
                sciCurrentValue = (curr ** 2).toString();
                sciHasActiveInput = true;
                break;

            case 'sci-cube':
                sciCurrentValue = (curr ** 3).toString();
                sciHasActiveInput = true;
                break;

            case 'sci-sqrt':
                sciCurrentValue = Math.sqrt(curr).toString();
                sciHasActiveInput = true;
                break;

            case 'sci-cbrt':
                sciCurrentValue = Math.cbrt(curr).toString();
                sciHasActiveInput = true;
                break;

            case 'sci-abs':
                sciCurrentValue = Math.abs(curr).toString();
                sciHasActiveInput = true;
                break;

            case 'sci-pi':
                sciCurrentValue = Math.PI.toString();
                sciHasActiveInput = true;
                break;

            case 'sci-e':
                sciCurrentValue = Math.E.toString();
                sciHasActiveInput = true;
                break;

            case 'sci-sin':
                sciCurrentValue = is2ndActive ? fromRadians(Math.asin(curr)).toString() : Math.sin(toRadians(curr)).toString();
                sciHasActiveInput = true;
                break;

            case 'sci-cos':
                sciCurrentValue = is2ndActive ? fromRadians(Math.acos(curr)).toString() : Math.cos(toRadians(curr)).toString();
                sciHasActiveInput = true;
                break;

            case 'sci-tan':
                sciCurrentValue = is2ndActive ? fromRadians(Math.atan(curr)).toString() : Math.tan(toRadians(curr)).toString();
                sciHasActiveInput = true;
                break;

            case 'sci-ln':
                sciCurrentValue = Math.log(curr).toString();
                sciHasActiveInput = true;
                break;

            case 'sci-log':
                sciCurrentValue = Math.log10(curr).toString();
                sciHasActiveInput = true;
                break;

            case 'sci-exp':
            case 'sci-ex':
                sciCurrentValue = Math.exp(curr).toString();
                sciHasActiveInput = true;
                break;

            case 'sci-10x':
                sciCurrentValue = (10 ** curr).toString();
                sciHasActiveInput = true;
                break;

            case 'sci-fact':
            case 'sci-factorial':
                sciCurrentValue = factorial(curr).toString();
                sciHasActiveInput = true;
                break;

            case 'sci-deg':
                isDegMode = true;
                if (sciModeIndicator) sciModeIndicator.textContent = 'DEG';
                if (sciDegBtn) sciDegBtn.classList.add('active-pill');
                if (sciRadBtn) sciRadBtn.classList.remove('active-pill');
                break;

            case 'sci-rad':
                isDegMode = false;
                if (sciModeIndicator) sciModeIndicator.textContent = 'RAD';
                if (sciRadBtn) sciRadBtn.classList.add('active-pill');
                if (sciDegBtn) sciDegBtn.classList.remove('active-pill');
                break;

            case 'sci-mc':
                sciMemory = 0;
                if (sciMemIndicator) sciMemIndicator.style.display = 'none';
                break;

            case 'sci-mr':
                sciCurrentValue = sciMemory.toString();
                sciHasActiveInput = true;
                sciShouldResetDisplay = true;
                updateSciDisplay();
                break;

            case 'sci-mplus':
                sciMemory += curr;
                sciHasActiveInput = true;
                sciShouldResetDisplay = true;
                if (sciMemIndicator) sciMemIndicator.style.display = 'inline-block';
                break;

            case 'sci-mminus':
                sciMemory -= curr;
                sciHasActiveInput = true;
                sciShouldResetDisplay = true;
                if (sciMemIndicator) sciMemIndicator.style.display = 'inline-block';
                break;

            case 'sci-2nd':
                is2ndActive = !is2ndActive;
                const btn2nd = document.getElementById('sci-2nd-btn');
                if (btn2nd) btn2nd.classList.toggle('active', is2ndActive);
                const btnSin = document.querySelector('button[data-action="sci-sin"]');
                if (btnSin) btnSin.textContent = is2ndActive ? 'asin' : 'sin';
                const btnCos = document.querySelector('button[data-action="sci-cos"]');
                if (btnCos) btnCos.textContent = is2ndActive ? 'acos' : 'cos';
                const btnTan = document.querySelector('button[data-action="sci-tan"]');
                if (btnTan) btnTan.textContent = is2ndActive ? 'atan' : 'tan';
                break;
        }
        updateSciDisplay();
    }


    document.querySelectorAll('#view-scientific .calc-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const val = btn.dataset.val;
            const action = btn.dataset.action;
            if (val !== undefined) sciHandleNumber(val);
            if (action) sciHandleAction(action);
        });
    });

    // ==========================================================================
    // 4. PERCENTAGE CALCULATOR
    // ==========================================================================
    const pctTabs = document.querySelectorAll('button[data-pct-tab]');
    const pctPanels = {
        of: document.getElementById('pct-of'),
        change: document.getElementById('pct-change'),
        diff: document.getElementById('pct-diff')
    };

    pctTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            pctTabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            Object.values(pctPanels).forEach(panel => {
                if (panel) panel.classList.remove('active');
            });
            const target = pctPanels[tab.dataset.pctTab];
            if (target) target.classList.add('active');
        });
    });

    const pctOfCalc = document.getElementById('pct-of-calc');
    if (pctOfCalc) {
        pctOfCalc.addEventListener('click', () => {
            const p = parseFloat(document.getElementById('pct-of-percent').value);
            const n = parseFloat(document.getElementById('pct-of-number').value);
            if (!isNaN(p) && !isNaN(n)) {
                const res = (p / 100) * n;
                document.getElementById('pct-of-result').textContent = `${p}% of ${n} = ${formatNumber(res)}`;
            }
        });
    }

    const pctChangeCalc = document.getElementById('pct-change-calc');
    if (pctChangeCalc) {
        pctChangeCalc.addEventListener('click', () => {
            const from = parseFloat(document.getElementById('pct-change-from').value);
            const to = parseFloat(document.getElementById('pct-change-to').value);
            if (!isNaN(from) && !isNaN(to) && from !== 0) {
                const res = ((to - from) / from) * 100;
                document.getElementById('pct-change-result').textContent = `${formatNumber(res)}% ${res >= 0 ? 'Increase' : 'Decrease'} (Difference: ${formatNumber(to - from)})`;
            }
        });
    }

    const pctDiffCalc = document.getElementById('pct-diff-calc');
    if (pctDiffCalc) {
        pctDiffCalc.addEventListener('click', () => {
            const v1 = parseFloat(document.getElementById('pct-diff-v1').value);
            const v2 = parseFloat(document.getElementById('pct-diff-v2').value);
            if (!isNaN(v1) && !isNaN(v2)) {
                const res = (Math.abs(v1 - v2) / ((v1 + v2) / 2)) * 100;
                document.getElementById('pct-diff-result').textContent = `Percentage Difference: ${formatNumber(res)}%`;
            }
        });
    }

    // ==========================================================================
    // 5. UNIT CONVERTERS & PHYSICAL NON-NEGATIVE GUARDS
    // ==========================================================================
    const convertersData = {
        weight: { kg: 1, g: 0.001, mg: 0.000001, lb: 0.45359237, oz: 0.028349523, stone: 6.350293, ton: 1000, ust: 907.18474 },
        length: { m: 1, km: 1000, cm: 0.01, mm: 0.001, mi: 1609.344, yd: 0.9144, ft: 0.3048, in: 0.0254, nm: 1852 },
        volume: { l: 1, ml: 0.001, gal: 3.78541178, qt: 0.9463529, pt: 0.4731764, cup: 0.24, floz: 0.0295735, m3: 1000, cm3: 0.001, igal: 4.54609 },
        speed: { ms: 1, kmh: 0.27777778, mph: 0.44704, kn: 0.514444, mach: 343, fts: 0.3048 },
        angle: { deg: 1, rad: 57.2957795, grad: 0.9, turn: 360, arcmin: 1 / 60, arcsec: 1 / 3600 },
        area: { sqm: 1, sqkm: 1000000, sqft: 0.09290304, sqyd: 0.83612736, sqmi: 2589988.11, acre: 4046.8564, hectare: 10000 },
        datastorage: { b: 1, kb: 1024, mb: 1048576, gb: 1073741824, tb: 1099511627776, pb: 1125899906842624 },
        currency: { USD: 1, EUR: 0.92, GBP: 0.79, JPY: 149.5, INR: 83.1, CNY: 7.24, AUD: 1.53, CAD: 1.36, CHF: 0.88, PKR: 278.5, BRL: 4.97, KRW: 1320 }
    };

    const NON_NEGATIVE_CONVERTERS = ['weight', 'length', 'volume', 'speed', 'area', 'datastorage', 'currency'];

    function convertTemp(val, from, to) {
        let c = 0;
        if (from === 'c') c = val;
        else if (from === 'f') c = (val - 32) * 5 / 9;
        else if (from === 'k') c = val - 273.15;
        else if (from === 'r') c = (val - 491.67) * 5 / 9;

        if (to === 'c') return c;
        if (to === 'f') return c * 9 / 5 + 32;
        if (to === 'k') return c + 273.15;
        if (to === 'r') return c * 9 / 5 + 491.67;
        return c;
    }

    ['weight', 'length', 'volume', 'temperature', 'speed', 'angle', 'area', 'datastorage', 'currency'].forEach(convName => {
        const prefix = convName === 'temperature' ? 'temp' : convName;
        const input = document.getElementById(`${prefix}-input`);
        const selFrom = document.getElementById(`${prefix}-from`);
        const selTo = document.getElementById(`${prefix}-to`);
        const output = document.getElementById(`${prefix}-output`);
        const swapBtn = document.getElementById(`${prefix}-swap`);

        if (input && selFrom && selTo && output) {
            // Prevent typing minus sign for physical quantities
            if (NON_NEGATIVE_CONVERTERS.includes(convName)) {
                input.min = '0';
                input.addEventListener('keydown', e => {
                    if (e.key === '-' || e.key === 'Minus') e.preventDefault();
                });
            }

            const doConvert = () => {
                let val = parseFloat(input.value);
                if (isNaN(val)) {
                    output.textContent = convName === 'currency' ? '0.00' : '0';
                    return;
                }
                // Clamp negative values for physical quantities
                if (NON_NEGATIVE_CONVERTERS.includes(convName) && val < 0) {
                    val = 0;
                    input.value = '0';
                }

                const from = selFrom.value;
                const to = selTo.value;
                let res = 0;
                if (convName === 'temperature') {
                    res = convertTemp(val, from, to);
                } else {
                    const factors = convertersData[convName];
                    if (factors && factors[from] && factors[to]) {
                        res = (val * factors[from]) / factors[to];
                    }
                }
                output.textContent = convName === 'currency' ? formatCurrency(res) : formatNumber(res, 6);
            };

            input.addEventListener('input', doConvert);
            selFrom.addEventListener('change', doConvert);
            selTo.addEventListener('change', doConvert);
            if (swapBtn) {
                swapBtn.addEventListener('click', () => {
                    const temp = selFrom.value;
                    selFrom.value = selTo.value;
                    selTo.value = temp;
                    doConvert();
                });
            }
        }
    });

    // ==========================================================================
    // 6. MULTI-UNIT CONVERTER GRID (Max 4 simultaneous converters)
    // ==========================================================================
    const unitGridContainer = document.getElementById('unit-grid-container');
    const addUnitGridBtn = document.getElementById('add-unit-grid-card');
    const resetUnitGridBtn = document.getElementById('reset-unit-grid');

    const UNIT_TYPES = [
        { id: 'weight', name: 'Weight' },
        { id: 'length', name: 'Length' },
        { id: 'area', name: 'Area' },
        { id: 'volume', name: 'Volume' },
        { id: 'temperature', name: 'Temperature' },
        { id: 'speed', name: 'Speed' },
        { id: 'angle', name: 'Angle' },
        { id: 'datastorage', name: 'Data Storage' }
    ];

    let activeUnitGridCards = ['weight', 'length']; // default 2 cards

    function renderUnitGrid() {
        if (!unitGridContainer) return;
        unitGridContainer.innerHTML = '';

        activeUnitGridCards.forEach((convType, idx) => {
            const card = document.createElement('div');
            card.className = 'grid-card';
            card.setAttribute('data-type', convType);

            // Options for From/To selects
            let optionsHtml = '';
            if (convType === 'temperature') {
                optionsHtml = `
                    <option value="c">Celsius (°C)</option>
                    <option value="f" selected>Fahrenheit (°F)</option>
                    <option value="k">Kelvin (K)</option>
                `;
            } else if (convertersData[convType]) {
                const keys = Object.keys(convertersData[convType]);
                optionsHtml = keys.map((k, i) => `<option value="${k}" ${i === 1 ? 'selected' : ''}>${k.toUpperCase()}</option>`).join('');
            }

            // Type selector options
            const typeOpts = UNIT_TYPES.map(t => `<option value="${t.id}" ${t.id === convType ? 'selected' : ''}>${t.name}</option>`).join('');

            card.innerHTML = `
                <div class="grid-card-head">
                    <select class="grid-type-select" data-card-idx="${idx}">
                        ${typeOpts}
                    </select>
                    ${activeUnitGridCards.length > 1 ? `<button class="grid-card-remove" data-remove-idx="${idx}" title="Remove converter">&times;</button>` : ''}
                </div>
                <div class="converter-row">
                    <input type="number" class="field-input grid-input" placeholder="Value" value="1" min="0">
                    <select class="field-select grid-from">${optionsHtml}</select>
                </div>
                <button class="swap-btn grid-swap" title="Swap">
                    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M7 16V4m0 12l-3-3m3 3l3-3"/><path d="M17 8v12m0-12l3 3m-3-3l-3 3"/></svg>
                </button>
                <div class="converter-row">
                    <div class="field-output grid-output">0</div>
                    <select class="field-select grid-to">${optionsHtml}</select>
                </div>
            `;

            // Card Event Logic
            const inputEl = card.querySelector('.grid-input');
            const fromEl = card.querySelector('.grid-from');
            const toEl = card.querySelector('.grid-to');
            const outEl = card.querySelector('.grid-output');
            const swapBtn = card.querySelector('.grid-swap');
            const typeSelect = card.querySelector('.grid-type-select');
            const removeBtn = card.querySelector('.grid-card-remove');

            const calculateCard = () => {
                let val = parseFloat(inputEl.value);
                if (isNaN(val)) {
                    outEl.textContent = '0';
                    return;
                }
                if (NON_NEGATIVE_CONVERTERS.includes(convType) && val < 0) {
                    val = 0;
                    inputEl.value = '0';
                }
                const f = fromEl.value;
                const t = toEl.value;
                let res = 0;
                if (convType === 'temperature') {
                    res = convertTemp(val, f, t);
                } else if (convertersData[convType]) {
                    const factors = convertersData[convType];
                    if (factors[f] && factors[t]) {
                        res = (val * factors[f]) / factors[t];
                    }
                }
                outEl.textContent = formatNumber(res, 4);
            };

            inputEl.addEventListener('input', calculateCard);
            fromEl.addEventListener('change', calculateCard);
            toEl.addEventListener('change', calculateCard);
            swapBtn.addEventListener('click', () => {
                const temp = fromEl.value;
                fromEl.value = toEl.value;
                toEl.value = temp;
                calculateCard();
            });

            typeSelect.addEventListener('change', e => {
                activeUnitGridCards[idx] = e.target.value;
                renderUnitGrid();
            });

            if (removeBtn) {
                removeBtn.addEventListener('click', () => {
                    activeUnitGridCards.splice(idx, 1);
                    renderUnitGrid();
                });
            }

            calculateCard();
            unitGridContainer.appendChild(card);
        });

        // Update add button state (max 4)
        if (addUnitGridBtn) {
            addUnitGridBtn.disabled = activeUnitGridCards.length >= 4;
            addUnitGridBtn.style.opacity = activeUnitGridCards.length >= 4 ? '0.5' : '1';
        }
    }

    if (addUnitGridBtn) {
        addUnitGridBtn.addEventListener('click', () => {
            if (activeUnitGridCards.length >= 4) return;
            const remaining = UNIT_TYPES.find(t => !activeUnitGridCards.includes(t.id));
            activeUnitGridCards.push(remaining ? remaining.id : 'weight');
            renderUnitGrid();
        });
    }

    if (resetUnitGridBtn) {
        resetUnitGridBtn.addEventListener('click', () => {
            activeUnitGridCards = ['weight', 'length'];
            renderUnitGrid();
        });
    }

    // ==========================================================================
    // 7. MULTI-FINANCE WORKSTATION GRID (Max 4 simultaneous tools)
    // ==========================================================================
    const financeGridContainer = document.getElementById('finance-grid-container');
    const addFinanceGridBtn = document.getElementById('add-finance-grid-card');
    const resetFinanceGridBtn = document.getElementById('reset-finance-grid');

    const FINANCE_TYPES = [
        { id: 'currency', name: 'Currency Converter' },
        { id: 'tip', name: 'Tip & Split Bill' },
        { id: 'unitprice', name: 'Unit Price & Discount' },
        { id: 'percentage', name: 'Percentage' }
    ];

    let activeFinanceGridCards = ['currency', 'tip'];

    function renderFinanceGrid() {
        if (!financeGridContainer) return;
        financeGridContainer.innerHTML = '';

        activeFinanceGridCards.forEach((toolType, idx) => {
            const card = document.createElement('div');
            card.className = 'grid-card';
            card.setAttribute('data-type', toolType);

            const typeOpts = FINANCE_TYPES.map(t => `<option value="${t.id}" ${t.id === toolType ? 'selected' : ''}>${t.name}</option>`).join('');

            let bodyHtml = '';
            if (toolType === 'currency') {
                bodyHtml = `
                    <div class="converter-row">
                        <input type="number" class="field-input fin-cur-input" placeholder="Amount" value="100" min="0">
                        <select class="field-select fin-cur-from">
                            <option value="USD">USD ($)</option>
                            <option value="EUR">EUR (€)</option>
                            <option value="GBP">GBP (£)</option>
                            <option value="JPY">JPY (¥)</option>
                        </select>
                    </div>
                    <div class="converter-row" style="margin-top:8px;">
                        <div class="field-output fin-cur-out">0.00</div>
                        <select class="field-select fin-cur-to">
                            <option value="EUR" selected>EUR (€)</option>
                            <option value="USD">USD ($)</option>
                            <option value="GBP">GBP (£)</option>
                            <option value="JPY">JPY (¥)</option>
                        </select>
                    </div>
                `;
            } else if (toolType === 'tip') {
                bodyHtml = `
                    <div style="display:flex;gap:8px;">
                        <input type="number" class="field-input fin-tip-bill" placeholder="Bill ($)" value="60" min="0">
                        <input type="number" class="field-input fin-tip-pct" placeholder="Tip %" value="15" min="0">
                        <input type="number" class="field-input fin-tip-split" placeholder="People" value="2" min="1">
                    </div>
                    <div class="field-output fin-tip-out" style="margin-top:8px;font-size:14px;">Total/Person: $34.50</div>
                `;
            } else if (toolType === 'unitprice') {
                bodyHtml = `
                    <div style="display:flex;gap:8px;">
                        <input type="number" class="field-input fin-disc-price" placeholder="Price ($)" value="80" min="0">
                        <input type="number" class="field-input fin-disc-pct" placeholder="Discount %" value="20" min="0">
                    </div>
                    <div class="field-output fin-disc-out" style="margin-top:8px;font-size:14px;">Final: $64.00 (Saved: $16.00)</div>
                `;
            } else {
                bodyHtml = `
                    <div style="display:flex;gap:8px;">
                        <input type="number" class="field-input fin-pct-p" placeholder="%" value="25">
                        <input type="number" class="field-input fin-pct-n" placeholder="Of Number" value="200">
                    </div>
                    <div class="field-output fin-pct-out" style="margin-top:8px;font-size:14px;">Result: 50</div>
                `;
            }

            card.innerHTML = `
                <div class="grid-card-head">
                    <select class="grid-type-select fin-type-select" data-card-idx="${idx}">
                        ${typeOpts}
                    </select>
                    ${activeFinanceGridCards.length > 1 ? `<button class="grid-card-remove fin-card-remove" data-remove-idx="${idx}" title="Remove tool">&times;</button>` : ''}
                </div>
                <div class="grid-card-body">
                    ${bodyHtml}
                </div>
            `;

            // Setup listeners based on type
            const typeSelect = card.querySelector('.fin-type-select');
            const removeBtn = card.querySelector('.fin-card-remove');

            typeSelect.addEventListener('change', e => {
                activeFinanceGridCards[idx] = e.target.value;
                renderFinanceGrid();
            });

            if (removeBtn) {
                removeBtn.addEventListener('click', () => {
                    activeFinanceGridCards.splice(idx, 1);
                    renderFinanceGrid();
                });
            }

            if (toolType === 'currency') {
                const curIn = card.querySelector('.fin-cur-input');
                const curFrom = card.querySelector('.fin-cur-from');
                const curTo = card.querySelector('.fin-cur-to');
                const curOut = card.querySelector('.fin-cur-out');
                const calcCur = () => {
                    const amt = parseFloat(curIn.value);
                    if (isNaN(amt)) { curOut.textContent = '0.00'; return; }
                    const res = (amt * convertersData.currency[curFrom.value]) / convertersData.currency[curTo.value];
                    curOut.textContent = formatCurrency(res);
                };
                curIn.addEventListener('input', calcCur);
                curFrom.addEventListener('change', calcCur);
                curTo.addEventListener('change', calcCur);
                calcCur();
            } else if (toolType === 'tip') {
                const bill = card.querySelector('.fin-tip-bill');
                const pct = card.querySelector('.fin-tip-pct');
                const split = card.querySelector('.fin-tip-split');
                const out = card.querySelector('.fin-tip-out');
                const calcTip = () => {
                    const b = parseFloat(bill.value) || 0;
                    const p = parseFloat(pct.value) || 0;
                    const s = Math.max(1, parseInt(split.value, 10) || 1);
                    const tipAmt = b * (p / 100);
                    const total = b + tipAmt;
                    out.textContent = `Total: $${(total / s).toFixed(2)}/person (Tip: $${tipAmt.toFixed(2)})`;
                };
                bill.addEventListener('input', calcTip);
                pct.addEventListener('input', calcTip);
                split.addEventListener('input', calcTip);
                calcTip();
            } else if (toolType === 'unitprice') {
                const price = card.querySelector('.fin-disc-price');
                const pct = card.querySelector('.fin-disc-pct');
                const out = card.querySelector('.fin-disc-out');
                const calcDisc = () => {
                    const pr = parseFloat(price.value) || 0;
                    const d = parseFloat(pct.value) || 0;
                    const saved = pr * (d / 100);
                    const finalPr = pr - saved;
                    out.textContent = `Final: $${finalPr.toFixed(2)} (Saved: $${saved.toFixed(2)})`;
                };
                price.addEventListener('input', calcDisc);
                pct.addEventListener('input', calcDisc);
                calcDisc();
            } else {
                const pEl = card.querySelector('.fin-pct-p');
                const nEl = card.querySelector('.fin-pct-n');
                const out = card.querySelector('.fin-pct-out');
                const calcPct = () => {
                    const p = parseFloat(pEl.value) || 0;
                    const n = parseFloat(nEl.value) || 0;
                    out.textContent = `Result: ${formatNumber((p / 100) * n)}`;
                };
                pEl.addEventListener('input', calcPct);
                nEl.addEventListener('input', calcPct);
                calcPct();
            }

            financeGridContainer.appendChild(card);
        });

        if (addFinanceGridBtn) {
            addFinanceGridBtn.disabled = activeFinanceGridCards.length >= 4;
            addFinanceGridBtn.style.opacity = activeFinanceGridCards.length >= 4 ? '0.5' : '1';
        }
    }

    if (addFinanceGridBtn) {
        addFinanceGridBtn.addEventListener('click', () => {
            if (activeFinanceGridCards.length >= 4) return;
            const remaining = FINANCE_TYPES.find(t => !activeFinanceGridCards.includes(t.id));
            activeFinanceGridCards.push(remaining ? remaining.id : 'currency');
            renderFinanceGrid();
        });
    }

    if (resetFinanceGridBtn) {
        resetFinanceGridBtn.addEventListener('click', () => {
            activeFinanceGridCards = ['currency', 'tip'];
            renderFinanceGrid();
        });
    }

    // ==========================================================================
    // 8. TIP & SPLIT BILL (Single View)
    // ==========================================================================
    const tipBill = document.getElementById('tip-bill');
    const tipPeople = document.getElementById('tip-people');
    const tipCustomPct = document.getElementById('tip-custom-pct');
    const tipCalcBtn = document.getElementById('tip-calc');
    const tipPresetBtns = document.querySelectorAll('.preset-btn[data-tip-val]');
    const tipResult = document.getElementById('tip-result');
    let currentTipPercent = 15;

    tipPresetBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            tipPresetBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentTipPercent = parseFloat(btn.dataset.tipVal);
            if (tipCustomPct) tipCustomPct.value = currentTipPercent;
            calculateTip();
        });
    });

    if (tipCustomPct) {
        tipCustomPct.addEventListener('input', () => {
            tipPresetBtns.forEach(b => b.classList.remove('active'));
            const customVal = parseFloat(tipCustomPct.value);
            if (!isNaN(customVal) && customVal >= 0) {
                currentTipPercent = customVal;
                calculateTip();
            }
        });
    }

    function calculateTip() {
        if (!tipBill || !tipResult) return;
        const bill = parseFloat(tipBill.value);
        const split = parseInt(tipPeople?.value || '1', 10);
        if (isNaN(bill) || bill < 0 || isNaN(split) || split <= 0) {
            tipResult.innerHTML = '';
            return;
        }

        const tipAmount = bill * (currentTipPercent / 100);
        const total = bill + tipAmount;
        const tipPerPerson = tipAmount / split;
        const totalPerPerson = total / split;

        tipResult.innerHTML = `
            <div>Tip Amount: <strong>$${formatCurrency(tipAmount)}</strong> (${currentTipPercent}%)</div>
            <div>Total Bill: <strong>$${formatCurrency(total)}</strong></div>
            <div style="margin-top:6px;border-top:1px dashed var(--border);padding-top:6px;">
                <div>Tip per person: <strong>$${formatCurrency(tipPerPerson)}</strong></div>
                <div>Total per person: <strong style="color:var(--accent);">$${formatCurrency(totalPerPerson)}</strong></div>
            </div>
        `;
    }

    if (tipBill) tipBill.addEventListener('input', calculateTip);
    if (tipPeople) tipPeople.addEventListener('input', calculateTip);
    if (tipCalcBtn) tipCalcBtn.addEventListener('click', calculateTip);

    // ==========================================================================
    // 9. UNIT PRICE & DISCOUNT (Single View)
    // ==========================================================================
    const upCalcBtn = document.getElementById('up-calc');
    if (upCalcBtn) {
        upCalcBtn.addEventListener('click', () => {
            const price = parseFloat(document.getElementById('up-price')?.value);
            const disc = parseFloat(document.getElementById('up-discount')?.value) || 0;
            const qty = Math.max(1, parseInt(document.getElementById('up-qty')?.value, 10) || 1);
            const resEl = document.getElementById('up-result');
            if (!resEl || isNaN(price) || price < 0) return;

            const savings = price * (disc / 100);
            const discountedTotal = price - savings;
            const unitPrice = discountedTotal / qty;

            resEl.innerHTML = `
                <div>You Save: <strong>$${formatCurrency(savings)}</strong> (${disc}%)</div>
                <div>Discounted Total: <strong>$${formatCurrency(discountedTotal)}</strong></div>
                <div style="margin-top:6px;border-top:1px dashed var(--border);padding-top:6px;">
                    Unit Price (${qty} item${qty > 1 ? 's' : ''}): <strong style="color:var(--accent);">$${formatCurrency(unitPrice)}/unit</strong>
                </div>
            `;
        });
    }

    // ==========================================================================
    // 10. BODY MASS INDEX (BMI) — Gender, Age, Independent Weight & Height Units
    // ==========================================================================
    const bmiTabs = document.querySelectorAll('button[data-bmi-unit]');
    const bmiCalc = document.getElementById('bmi-calc');
    const bmiResult = document.getElementById('bmi-result');
    const genderBtns = document.querySelectorAll('.gender-btn');
    const bmiWToggleBtns = document.querySelectorAll('#bmi-w-unit-toggle .unit-pill-btn');
    const bmiHToggleBtns = document.querySelectorAll('#bmi-h-unit-toggle .unit-pill-btn');
    const bmiWeightKgPanel = document.getElementById('bmi-weight-kg-panel');
    const bmiWeightLbPanel = document.getElementById('bmi-weight-lb-panel');
    const bmiHeightCmPanel = document.getElementById('bmi-height-cm-panel');
    const bmiHeightFtPanel = document.getElementById('bmi-height-ft-panel');

    let bmiGender = 'male';
    let bmiWeightUnit = 'kg';
    let bmiHeightUnit = 'cm';

    genderBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            genderBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            bmiGender = btn.dataset.gender || 'male';
        });
    });

    function syncBmiPresetTabs() {
        bmiTabs.forEach(tab => {
            const mode = tab.dataset.bmiUnit;
            if (mode === 'metric') {
                tab.classList.toggle('active', bmiWeightUnit === 'kg' && bmiHeightUnit === 'cm');
            } else if (mode === 'imperial') {
                tab.classList.toggle('active', bmiWeightUnit === 'lb' && bmiHeightUnit === 'ft');
            }
        });
    }

    function setBmiWeightUnit(unit) {
        bmiWeightUnit = unit;
        bmiWToggleBtns.forEach(btn => btn.classList.toggle('active', btn.dataset.wUnit === unit));
        if (bmiWeightKgPanel) bmiWeightKgPanel.style.display = unit === 'kg' ? 'block' : 'none';
        if (bmiWeightLbPanel) bmiWeightLbPanel.style.display = unit === 'lb' ? 'block' : 'none';
        syncBmiPresetTabs();
    }

    function setBmiHeightUnit(unit) {
        bmiHeightUnit = unit;
        bmiHToggleBtns.forEach(btn => btn.classList.toggle('active', btn.dataset.hUnit === unit));
        if (bmiHeightCmPanel) bmiHeightCmPanel.style.display = unit === 'cm' ? 'block' : 'none';
        if (bmiHeightFtPanel) bmiHeightFtPanel.style.display = unit === 'ft' ? 'grid' : 'none';
        syncBmiPresetTabs();
    }

    bmiWToggleBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            setBmiWeightUnit(btn.dataset.wUnit);
        });
    });

    bmiHToggleBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            setBmiHeightUnit(btn.dataset.hUnit);
        });
    });

    bmiTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const mode = tab.dataset.bmiUnit;
            if (mode === 'metric') {
                setBmiWeightUnit('kg');
                setBmiHeightUnit('cm');
            } else if (mode === 'imperial') {
                setBmiWeightUnit('lb');
                setBmiHeightUnit('ft');
            }
        });
    });

    if (bmiCalc) {
        bmiCalc.addEventListener('click', () => {
            const age = parseInt(document.getElementById('bmi-age')?.value, 10) || 25;

            let weightKg = 0;
            if (bmiWeightUnit === 'kg') {
                const kg = parseFloat(document.getElementById('bmi-weight-kg')?.value);
                if (isNaN(kg) || kg <= 0) return;
                weightKg = kg;
            } else {
                const lb = parseFloat(document.getElementById('bmi-weight-lb')?.value);
                if (isNaN(lb) || lb <= 0) return;
                weightKg = lb * 0.45359237;
            }

            let heightM = 0;
            if (bmiHeightUnit === 'cm') {
                const cm = parseFloat(document.getElementById('bmi-height-cm')?.value);
                if (isNaN(cm) || cm <= 0) return;
                heightM = cm / 100;
            } else {
                const ft = parseFloat(document.getElementById('bmi-height-ft')?.value) || 0;
                const inches = parseFloat(document.getElementById('bmi-height-in')?.value) || 0;
                const totalInches = ft * 12 + inches;
                if (totalInches <= 0) return;
                heightM = totalInches * 0.0254;
            }

            let bmi = weightKg / (heightM * heightM);

            let status = 'Normal weight';
            let color = 'var(--accent)';
            if (bmi < 18.5) { status = 'Underweight'; color = 'var(--text-secondary)'; }
            else if (bmi >= 25 && bmi < 30) { status = 'Overweight'; color = '#fbbf24'; }
            else if (bmi >= 30) { status = 'Obese'; color = 'var(--coral)'; }

            // Body fat estimate (Deurenberg formula)
            // Adult body fat % = (1.20 × BMI) + (0.23 × age) - (10.8 × gender) - 5.4 (gender: male=1, female=0)
            const genderFactor = bmiGender === 'male' ? 1 : 0;
            const bodyFat = Math.max(2, (1.20 * bmi) + (0.23 * age) - (10.8 * genderFactor) - 5.4);

            // Healthy weight range for height
            const minHealthyKg = 18.5 * (heightM * heightM);
            const maxHealthyKg = 24.9 * (heightM * heightM);
            const healthyWeightStr = bmiWeightUnit === 'kg'
                ? `${minHealthyKg.toFixed(1)} kg – ${maxHealthyKg.toFixed(1)} kg`
                : `${(minHealthyKg * 2.20462).toFixed(1)} lb – ${(maxHealthyKg * 2.20462).toFixed(1)} lb`;

            bmiResult.innerHTML = `
                <div>BMI Score: <strong style="font-size:20px;color:${color}">${bmi.toFixed(1)}</strong></div>
                <div>Category: <strong style="color:${color}">${status}</strong></div>
                <div>Estimated Body Fat: <strong>${bodyFat.toFixed(1)}%</strong> (${bmiGender.toUpperCase()}, ${age} yrs)</div>
                <div>Healthy Weight for Height: <strong>${healthyWeightStr}</strong></div>
                <div style="font-size:12px;color:var(--text-muted);margin-top:6px;">Standard healthy BMI reference: 18.5 – 24.9 kg/m²</div>
            `;
        });
    }

    // ==========================================================================
    // 11. EQUATIONS SOLVER
    // ==========================================================================
    const eqTabs = document.querySelectorAll('button[data-eq-tab]');
    const eqPanels = {
        linear: document.getElementById('eq-linear'),
        quadratic: document.getElementById('eq-quadratic'),
        system: document.getElementById('eq-system')
    };

    eqTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            eqTabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            Object.values(eqPanels).forEach(panel => {
                if (panel) panel.classList.remove('active');
            });
            const target = eqPanels[tab.dataset.eqTab];
            if (target) target.classList.add('active');
        });
    });

    const linearSolve = document.getElementById('eq-linear-solve');
    if (linearSolve) {
        linearSolve.addEventListener('click', () => {
            const a = parseFloat(document.getElementById('eq-a').value);
            const b = parseFloat(document.getElementById('eq-b').value);
            const out = document.getElementById('eq-linear-result');
            if (isNaN(a) || isNaN(b)) return;
            if (a === 0) {
                out.textContent = b === 0 ? 'Infinite solutions (Identity)' : 'No solution (Contradiction)';
            } else {
                out.textContent = `x = ${formatNumber(-b / a)}`;
            }
        });
    }

    const quadSolve = document.getElementById('eq-quad-solve');
    if (quadSolve) {
        quadSolve.addEventListener('click', () => {
            const a = parseFloat(document.getElementById('eq-qa').value);
            const b = parseFloat(document.getElementById('eq-qb').value);
            const c = parseFloat(document.getElementById('eq-qc').value);
            const out = document.getElementById('eq-quad-result');
            if (isNaN(a) || isNaN(b) || isNaN(c)) return;
            if (a === 0) {
                out.textContent = 'Not a quadratic equation (a = 0)';
                return;
            }
            const d = b * b - 4 * a * c;
            if (d > 0) {
                const root1 = (-b + Math.sqrt(d)) / (2 * a);
                const root2 = (-b - Math.sqrt(d)) / (2 * a);
                out.textContent = `Discriminant Δ = ${formatNumber(d)}\nx₁ = ${formatNumber(root1)}\nx₂ = ${formatNumber(root2)}`;
            } else if (d === 0) {
                const root = -b / (2 * a);
                out.textContent = `One real repeated root:\nx = ${formatNumber(root)}`;
            } else {
                const real = (-b / (2 * a)).toFixed(4);
                const img = (Math.sqrt(-d) / (2 * a)).toFixed(4);
                out.textContent = `Complex roots:\nx₁ = ${real} + ${img}i\nx₂ = ${real} − ${img}i`;
            }
        });
    }

    const sysSolve = document.getElementById('eq-sys-solve');
    if (sysSolve) {
        sysSolve.addEventListener('click', () => {
            const a1 = parseFloat(document.getElementById('eq-a1').value);
            const b1 = parseFloat(document.getElementById('eq-b1').value);
            const c1 = parseFloat(document.getElementById('eq-c1').value);
            const a2 = parseFloat(document.getElementById('eq-a2').value);
            const b2 = parseFloat(document.getElementById('eq-b2').value);
            const c2 = parseFloat(document.getElementById('eq-c2').value);
            const out = document.getElementById('eq-sys-result');
            if ([a1, b1, c1, a2, b2, c2].some(isNaN)) return;

            const d = a1 * b2 - a2 * b1;
            if (d === 0) {
                out.textContent = 'No unique solution (Determinant = 0)';
            } else {
                const x = (c1 * b2 - c2 * b1) / d;
                const y = (a1 * c2 - a2 * c1) / d;
                out.textContent = `x = ${formatNumber(x)}\ny = ${formatNumber(y)}`;
            }
        });
    }

    // ==========================================================================
    // 12. AGE CALCULATOR
    // ==========================================================================
    const ageAsOf = document.getElementById('age-asof');
    if (ageAsOf) {
        ageAsOf.valueAsDate = new Date();
    }
    const ageCalc = document.getElementById('age-calc');
    if (ageCalc) {
        ageCalc.addEventListener('click', () => {
            const dob = new Date(document.getElementById('age-dob').value);
            const asof = new Date(document.getElementById('age-asof').value);
            const out = document.getElementById('age-result');

            if (isNaN(dob.getTime()) || isNaN(asof.getTime())) return;
            if (dob > asof) {
                out.textContent = "Date of Birth cannot be after 'As Of' date.";
                return;
            }

            let years = asof.getFullYear() - dob.getFullYear();
            let months = asof.getMonth() - dob.getMonth();
            let days = asof.getDate() - dob.getDate();

            if (days < 0) {
                months--;
                const tempDate = new Date(asof.getFullYear(), asof.getMonth(), 0);
                days += tempDate.getDate();
            }
            if (months < 0) {
                years--;
                months += 12;
            }

            const diffTime = Math.abs(asof - dob);
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            const diffWeeks = Math.floor(diffDays / 7);

            // Next Birthday countdown
            let nextBday = new Date(asof.getFullYear(), dob.getMonth(), dob.getDate());
            if (nextBday < asof) {
                nextBday.setFullYear(asof.getFullYear() + 1);
            }
            const daysToBday = Math.ceil((nextBday - asof) / (1000 * 60 * 60 * 24));

            out.innerHTML = `
                <div>Age: <strong>${years} years, ${months} months, ${days} days</strong></div>
                <div>Total Days: <strong>${diffDays.toLocaleString()}</strong></div>
                <div>Total Weeks: <strong>${diffWeeks.toLocaleString()}</strong></div>
                <div style="margin-top:4px;color:var(--accent);">Next Birthday in: <strong>${daysToBday} days</strong></div>
            `;
        });
    }

    // ==========================================================================
    // 13. TIME INTERVAL
    // ==========================================================================
    const tiCalc = document.getElementById('ti-calc');
    if (tiCalc) {
        tiCalc.addEventListener('click', () => {
            const start = new Date(document.getElementById('ti-start').value);
            const end = new Date(document.getElementById('ti-end').value);
            const out = document.getElementById('ti-result');

            if (isNaN(start.getTime()) || isNaN(end.getTime())) return;

            let date1 = start;
            let date2 = end;
            let note = '';
            if (start > end) {
                date1 = end;
                date2 = start;
                note = '<div style="color:var(--text-muted);margin-bottom:6px;">Start date is after end date. Showing absolute duration.</div>';
            }

            let years = date2.getFullYear() - date1.getFullYear();
            let months = date2.getMonth() - date1.getMonth();
            let days = date2.getDate() - date1.getDate();

            if (days < 0) {
                months--;
                const tempDate = new Date(date2.getFullYear(), date2.getMonth(), 0);
                days += tempDate.getDate();
            }
            if (months < 0) {
                years--;
                months += 12;
            }

            const diffTime = date2.getTime() - date1.getTime();
            const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
            const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
            const diffMins = Math.floor(diffTime / (1000 * 60));

            out.innerHTML = `
                ${note}
                <div>Difference: <strong>${years} years, ${months} months, ${days} days</strong></div>
                <div>Total Days: <strong>${diffDays.toLocaleString()}</strong></div>
                <div>Total Hours: <strong>${diffHours.toLocaleString()}</strong></div>
                <div>Total Minutes: <strong>${diffMins.toLocaleString()}</strong></div>
            `;
        });
    }

    // ==========================================================================
    // 14. KEYBOARD SUPPORT
    // ==========================================================================
    document.addEventListener('keydown', e => {
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT') {
            if (e.key === 'Escape') {
                closeHistory();
            }
            return;
        }

        if (e.key === 'Escape') {
            closeHistory();
        }

        const isStdActive = document.getElementById('view-standard')?.classList.contains('active');
        const isSciActive = document.getElementById('view-scientific')?.classList.contains('active');

        if (!isStdActive && !isSciActive) return;

        const key = e.key;
        let action = null;
        let val = null;

        if (/[0-9]/.test(key)) val = key;
        else if (key === '.') val = '.';
        else if (key === '+' || key === '-' || key === '*' || key === '/') {
            const opMap = { '+': 'add', '-': 'subtract', '*': 'multiply', '/': 'divide' };
            action = isSciActive ? `sci-${opMap[key]}` : opMap[key];
        } else if (key === 'Enter' || key === '=') {
            e.preventDefault();
            action = isSciActive ? 'sci-equals' : 'equals';
        } else if (key === 'Escape') {
            action = isSciActive ? 'sci-clear' : 'clear';
        } else if (key === 'Backspace') {
            action = isSciActive ? 'sci-backspace' : 'backspace';
        } else if (key === '%') {
            action = isSciActive ? 'sci-percent' : 'percent';
        }

        if (isStdActive) {
            if (val) stdHandleNumber(val);
            if (action) stdHandleAction(action);
        } else if (isSciActive) {
            if (val) sciHandleNumber(val);
            if (action) sciHandleAction(action);
        }
    });

    // Expose for testing & external calls
    window.setActiveView = setActiveView;
    window.renderUnitGrid = renderUnitGrid;
    window.renderFinanceGrid = renderFinanceGrid;
});
