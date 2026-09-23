/**
 * CalcVerse Desmos-Style Graphing Calculator Engine
 * Self-contained, pure vanilla JavaScript with high-performance Canvas 2D rendering.
 */

const GraphingCalculator = (function() {
    'use strict';

    const COLORS = [
        '#2563eb', // electric cobalt
        '#ef4444', // coral red
        '#10b981', // emerald green
        '#f59e0b', // amber
        '#8b5cf6', // vivid violet
        '#06b6d4', // bright cyan
        '#ec4899', // hot pink
        '#f97316'  // deep orange
    ];

    let canvas, ctx, container;
    let exprContainer, addBtn, zoomInBtn, zoomOutBtn, resetBtn;
    let tooltipEl, tableContainer, tableBody, tableToggleBtn;
    let tblStartX, tblEndX, tblStepX, tblGenBtn, tblAddRowBtn;
    let tablePoints = [-5, -4, -3, -2, -1, 0, 1, 2, 3, 4, 5];

    let state = {
        centerX: 0,
        centerY: 0,
        scale: 45, // pixels per math unit
        expressions: [], // { expr: string, color: string, compiled: function, visible: boolean }
        isDirty: true,
        width: 0,
        height: 0,
        isDragging: false,
        dragStartX: 0,
        dragStartY: 0,
        dragStartCenterX: 0,
        dragStartCenterY: 0,
        hoverPoint: null, // { x, y, px, py, color }
        touches: []
    };

    let renderLoopId = null;
    let resizeObserver = null;

    // --- Parser & Evaluator (Shunting-Yard & RPN) ---

    function tokenize(expr) {
        let tokens = [];
        let i = 0;
        let clean = expr.replace(/\s+/g, '').replace(/^(y|f\(x\))?=/i, '');

        while (i < clean.length) {
            let char = clean[i];

            // Numbers (including decimals)
            if (/[0-9]/.test(char) || (char === '.' && i + 1 < clean.length && /[0-9]/.test(clean[i + 1]))) {
                let num = '';
                while (i < clean.length && (/[0-9\.]/.test(clean[i]))) {
                    num += clean[i];
                    i++;
                }
                tokens.push({ type: 'number', value: parseFloat(num) });
                continue;
            }

            // Word tokens (variables, functions, constants)
            if (/[a-zA-Z]/.test(char)) {
                let word = '';
                while (i < clean.length && /[a-zA-Z0-9]/.test(clean[i])) {
                    word += clean[i];
                    i++;
                }
                word = word.toLowerCase();
                if (word === 'x') {
                    tokens.push({ type: 'variable', value: 'x' });
                } else if (word === 'pi' || word === 'π') {
                    tokens.push({ type: 'constant', value: Math.PI });
                } else if (word === 'e') {
                    tokens.push({ type: 'constant', value: Math.E });
                } else {
                    tokens.push({ type: 'function', value: word });
                }
                continue;
            }

            // Operators & Parentheses
            if (['+', '-', '*', '/', '^', '(', ')'].includes(char)) {
                tokens.push({ type: 'operator', value: char });
                i++;
                continue;
            }

            i++; // skip unrecognized characters
        }

        // Handle unary minus and implicit multiplication
        let processed = [];
        for (let j = 0; j < tokens.length; j++) {
            let token = tokens[j];

            // Unary minus
            if (token.value === '-' && (j === 0 || ['+', '-', '*', '/', '^', '(', 'u-'].includes(tokens[j - 1].value))) {
                token = { type: 'unary_minus', value: 'u-' };
            }

            // Implicit multiplication: e.g. 2x, x(x+1), (x+1)(x-1), 3sin(x)
            if (j > 0) {
                let prev = processed[processed.length - 1];
                let implicit = false;

                if ((prev.type === 'number' || prev.type === 'variable' || prev.type === 'constant' || prev.value === ')') &&
                    (token.type === 'variable' || token.type === 'constant' || token.type === 'function' || token.value === '(')) {
                    implicit = true;
                }

                if (implicit) {
                    processed.push({ type: 'operator', value: '*' });
                }
            }
            processed.push(token);
        }
        return processed;
    }

    function shuntingYard(tokens) {
        let output = [];
        let stack = [];
        const precedence = { '+': 1, '-': 1, '*': 2, '/': 2, '^': 3, 'u-': 4 };
        const rightAssoc = { '^': true, 'u-': true };

        for (let token of tokens) {
            if (token.type === 'number' || token.type === 'variable' || token.type === 'constant') {
                output.push(token);
            } else if (token.type === 'function') {
                stack.push(token);
            } else if (token.type === 'operator' || token.type === 'unary_minus') {
                if (token.value === '(') {
                    stack.push(token);
                } else if (token.value === ')') {
                    while (stack.length > 0 && stack[stack.length - 1].value !== '(') {
                        output.push(stack.pop());
                    }
                    if (stack.length > 0) stack.pop(); // Pop '('
                    if (stack.length > 0 && stack[stack.length - 1].type === 'function') {
                        output.push(stack.pop());
                    }
                } else {
                    while (stack.length > 0 && stack[stack.length - 1].value !== '(') {
                        let top = stack[stack.length - 1];
                        if (top.type === 'operator' || top.type === 'unary_minus') {
                            if ((!rightAssoc[token.value] && precedence[token.value] <= precedence[top.value]) ||
                                (rightAssoc[token.value] && precedence[token.value] < precedence[top.value])) {
                                output.push(stack.pop());
                            } else {
                                break;
                            }
                        } else {
                            break;
                        }
                    }
                    stack.push(token);
                }
            }
        }
        while (stack.length > 0) {
            output.push(stack.pop());
        }
        return output;
    }

    function compileExpression(exprStr) {
        if (!exprStr || exprStr.trim() === '') return null;
        try {
            let tokens = tokenize(exprStr);
            let rpn = shuntingYard(tokens);

            return function(x) {
                let stack = [];
                for (let token of rpn) {
                    if (token.type === 'number' || token.type === 'constant') {
                        stack.push(token.value);
                    } else if (token.type === 'variable') {
                        stack.push(x);
                    } else if (token.type === 'unary_minus') {
                        let a = stack.pop();
                        stack.push(-a);
                    } else if (token.type === 'operator') {
                        let b = stack.pop();
                        let a = stack.pop();
                        if (token.value === '+') stack.push(a + b);
                        else if (token.value === '-') stack.push(a - b);
                        else if (token.value === '*') stack.push(a * b);
                        else if (token.value === '/') stack.push(b === 0 ? NaN : a / b);
                        else if (token.value === '^') stack.push(Math.pow(a, b));
                    } else if (token.type === 'function') {
                        let a = stack.pop();
                        let fnName = token.value;
                        let val = NaN;

                        switch (fnName) {
                            case 'sin': val = Math.sin(a); break;
                            case 'cos': val = Math.cos(a); break;
                            case 'tan': val = Math.tan(a); break;
                            case 'cot': val = 1 / Math.tan(a); break;
                            case 'sec': val = 1 / Math.cos(a); break;
                            case 'csc': val = 1 / Math.sin(a); break;
                            case 'asin': val = Math.asin(a); break;
                            case 'acos': val = Math.acos(a); break;
                            case 'atan': val = Math.atan(a); break;
                            case 'sinh': val = Math.sinh(a); break;
                            case 'cosh': val = Math.cosh(a); break;
                            case 'tanh': val = Math.tanh(a); break;
                            case 'sqrt': val = a >= 0 ? Math.sqrt(a) : NaN; break;
                            case 'cbrt': val = Math.cbrt(a); break;
                            case 'abs': val = Math.abs(a); break;
                            case 'ln': val = a > 0 ? Math.log(a) : NaN; break;
                            case 'log': val = a > 0 ? Math.log10(a) : NaN; break;
                            case 'log2': val = a > 0 ? Math.log2(a) : NaN; break;
                            case 'exp': val = Math.exp(a); break;
                            case 'floor': val = Math.floor(a); break;
                            case 'ceil': val = Math.ceil(a); break;
                            case 'round': val = Math.round(a); break;
                            default:
                                if (typeof Math[fnName] === 'function') val = Math[fnName](a);
                                break;
                        }
                        stack.push(val);
                    }
                }
                return stack.length > 0 ? stack[0] : NaN;
            };
        } catch (e) {
            return null;
        }
    }

    // --- Coordinate Transformations ---

    function mathToPixelX(x) {
        return (x - state.centerX) * state.scale + state.width / 2;
    }

    function mathToPixelY(y) {
        return -(y - state.centerY) * state.scale + state.height / 2;
    }

    function pixelToMathX(px) {
        return (px - state.width / 2) / state.scale + state.centerX;
    }

    function pixelToMathY(py) {
        return -(py - state.height / 2) / state.scale + state.centerY;
    }

    function getTickSpacing(pixelSize, mathSize, targetPixelGap = 80) {
        let unitsPerGap = (mathSize / pixelSize) * targetPixelGap;
        let magnitude = Math.pow(10, Math.floor(Math.log10(unitsPerGap)));
        let norm = unitsPerGap / magnitude;
        let step = 1;
        if (norm < 1.5) step = 1;
        else if (norm < 3.5) step = 2;
        else if (norm < 7.5) step = 5;
        else step = 10;
        return step * magnitude;
    }

    // --- Rendering Engine ---

    function render() {
        if (!state.isDirty || !ctx || state.width <= 0 || state.height <= 0) {
            renderLoopId = requestAnimationFrame(render);
            return;
        }

        // Clean obsidian background
        ctx.fillStyle = '#0a0b10';
        ctx.fillRect(0, 0, state.width, state.height);

        let mathWidth = state.width / state.scale;
        let mathHeight = state.height / state.scale;

        let minX = state.centerX - mathWidth / 2;
        let maxX = state.centerX + mathWidth / 2;
        let minY = state.centerY - mathHeight / 2;
        let maxY = state.centerY + mathHeight / 2;

        let xStep = getTickSpacing(state.width, mathWidth, 80);
        let yStep = getTickSpacing(state.height, mathHeight, 80);
        let minorXStep = xStep / 5;
        let minorYStep = yStep / 5;

        // 1. Draw Minor Grid Lines
        ctx.lineWidth = 0.5;
        ctx.strokeStyle = '#141724';
        ctx.beginPath();
        for (let x = Math.floor(minX / minorXStep) * minorXStep; x <= maxX; x += minorXStep) {
            let px = Math.round(mathToPixelX(x));
            ctx.moveTo(px, 0); ctx.lineTo(px, state.height);
        }
        for (let y = Math.floor(minY / minorYStep) * minorYStep; y <= maxY; y += minorYStep) {
            let py = Math.round(mathToPixelY(y));
            ctx.moveTo(0, py); ctx.lineTo(state.width, py);
        }
        ctx.stroke();

        // 2. Draw Major Grid Lines
        ctx.lineWidth = 1;
        ctx.strokeStyle = '#1e2235';
        ctx.beginPath();
        for (let x = Math.floor(minX / xStep) * xStep; x <= maxX; x += xStep) {
            let px = Math.round(mathToPixelX(x));
            ctx.moveTo(px, 0); ctx.lineTo(px, state.height);
        }
        for (let y = Math.floor(minY / yStep) * yStep; y <= maxY; y += yStep) {
            let py = Math.round(mathToPixelY(y));
            ctx.moveTo(0, py); ctx.lineTo(state.width, py);
        }
        ctx.stroke();

        // 3. Draw Main Axes (x=0, y=0)
        let originX = Math.round(mathToPixelX(0));
        let originY = Math.round(mathToPixelY(0));

        ctx.lineWidth = 1.5;
        ctx.strokeStyle = '#383e58';
        ctx.beginPath();
        if (originX >= 0 && originX <= state.width) {
            ctx.moveTo(originX, 0); ctx.lineTo(originX, state.height);
        }
        if (originY >= 0 && originY <= state.height) {
            ctx.moveTo(0, originY); ctx.lineTo(state.width, originY);
        }
        ctx.stroke();

        // 4. Draw Numeric Axis Labels
        ctx.fillStyle = '#7a829e';
        ctx.font = '11px "Bevellier", "SF Mono", monospace';
        ctx.textBaseline = 'top';

        let labelY = Math.max(6, Math.min(originY + 6, state.height - 18));
        for (let x = Math.floor(minX / xStep) * xStep; x <= maxX; x += xStep) {
            if (Math.abs(x) < 1e-9) continue;
            let text = parseFloat(x.toPrecision(8)).toString();
            let px = mathToPixelX(x);
            ctx.fillText(text, px + 4, labelY);
        }

        let labelX = Math.max(6, Math.min(originX + 6, state.width - 40));
        ctx.textBaseline = 'middle';
        for (let y = Math.floor(minY / yStep) * yStep; y <= maxY; y += yStep) {
            if (Math.abs(y) < 1e-9) continue;
            let text = parseFloat(y.toPrecision(8)).toString();
            let py = mathToPixelY(y);
            ctx.fillText(text, labelX, py);
        }

        if (originX >= 0 && originX <= state.width && originY >= 0 && originY <= state.height) {
            ctx.textBaseline = 'top';
            ctx.fillText('0', originX + 5, originY + 5);
        }

        // 5. Plot Curves with Asymptote Detection
        let samplePoints = Math.max(state.width * 2, 800);
        let dx = mathWidth / samplePoints;

        for (let exprObj of state.expressions) {
            if (!exprObj.compiled || !exprObj.visible) continue;

            ctx.lineWidth = 2.2;
            ctx.strokeStyle = exprObj.color;
            ctx.beginPath();

            let isDrawing = false;
            let prevY = NaN;

            for (let i = 0; i <= samplePoints; i++) {
                let x = minX + i * dx;
                let y = exprObj.compiled(x);

                if (isNaN(y) || !isFinite(y)) {
                    isDrawing = false;
                    prevY = NaN;
                    continue;
                }

                // Discontinuity / Asymptote filter (e.g. tan(x), 1/x jumping opposite infinities)
                let isAsymptote = false;
                if (!isNaN(prevY)) {
                    let dy = Math.abs(y - prevY);
                    if (dy > mathHeight * 0.75 && ((y > 0 && prevY < 0) || (y < 0 && prevY > 0))) {
                        isAsymptote = true;
                    }
                }

                let px = mathToPixelX(x);
                let py = mathToPixelY(y);

                if (!isDrawing || isAsymptote) {
                    ctx.moveTo(px, py);
                    isDrawing = true;
                } else {
                    ctx.lineTo(px, py);
                }
                prevY = y;
            }
            ctx.stroke();
        }

        // 6. Draw Interactive Trace Tooltip on Curve
        if (state.hoverPoint) {
            let hp = state.hoverPoint;
            ctx.save();
            ctx.fillStyle = hp.color;
            ctx.beginPath();
            ctx.arc(hp.px, hp.py, 5, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 1.5;
            ctx.stroke();
            ctx.restore();
        }

        state.isDirty = false;
        renderLoopId = requestAnimationFrame(render);
    }

    // --- User Interaction Listeners ---

    function setupCanvasListeners() {
        if (!canvas) return;

        // Hover inspection / trace
        canvas.addEventListener('mousemove', e => {
            if (state.isDragging) {
                let dx = e.clientX - state.dragStartX;
                let dy = e.clientY - state.dragStartY;
                state.centerX = state.dragStartCenterX - dx / state.scale;
                state.centerY = state.dragStartCenterY + dy / state.scale;
                state.isDirty = true;
                if (tooltipEl) tooltipEl.style.display = 'none';
                return;
            }

            // Curve tracing
            let rect = canvas.getBoundingClientRect();
            let mousePx = e.clientX - rect.left;
            let mousePy = e.clientY - rect.top;
            let mathX = pixelToMathX(mousePx);

            let closest = null;
            let minDistance = 25; // max pixel tolerance to snap

            for (let exprObj of state.expressions) {
                if (!exprObj.compiled || !exprObj.visible) continue;
                let mathY = exprObj.compiled(mathX);
                if (isNaN(mathY) || !isFinite(mathY)) continue;

                let curvePx = mathToPixelX(mathX);
                let curvePy = mathToPixelY(mathY);
                let dist = Math.hypot(curvePx - mousePx, curvePy - mousePy);

                if (dist < minDistance) {
                    minDistance = dist;
                    closest = {
                        x: mathX,
                        y: mathY,
                        px: curvePx,
                        py: curvePy,
                        color: exprObj.color
                    };
                }
            }

            if (closest) {
                state.hoverPoint = closest;
                if (tooltipEl) {
                    tooltipEl.style.display = 'block';
                    tooltipEl.style.left = `${closest.px}px`;
                    tooltipEl.style.top = `${closest.py}px`;
                    tooltipEl.textContent = `(${parseFloat(closest.x.toFixed(3))}, ${parseFloat(closest.y.toFixed(3))})`;
                }
                state.isDirty = true;
            } else if (state.hoverPoint) {
                state.hoverPoint = null;
                if (tooltipEl) tooltipEl.style.display = 'none';
                state.isDirty = true;
            }
        });

        canvas.addEventListener('mouseleave', () => {
            state.hoverPoint = null;
            if (tooltipEl) tooltipEl.style.display = 'none';
            state.isDirty = true;
        });

        // Mouse Drag Panning
        canvas.addEventListener('mousedown', e => {
            if (e.button !== 0) return;
            state.isDragging = true;
            state.dragStartX = e.clientX;
            state.dragStartY = e.clientY;
            state.dragStartCenterX = state.centerX;
            state.dragStartCenterY = state.centerY;
        });

        window.addEventListener('mouseup', () => {
            state.isDragging = false;
        });

        // Mouse Wheel Zooming (Centered at cursor)
        canvas.addEventListener('wheel', e => {
            e.preventDefault();
            let rect = canvas.getBoundingClientRect();
            let mousePx = e.clientX - rect.left;
            let mousePy = e.clientY - rect.top;

            let zoomFactor = e.deltaY < 0 ? 1.15 : 0.87;
            setScale(state.scale * zoomFactor, mousePx, mousePy);
        }, { passive: false });

        // Touch Interaction (Pan & Pinch)
        let initialPinchDist = 0;
        canvas.addEventListener('touchstart', e => {
            if (e.touches.length === 1) {
                state.isDragging = true;
                state.dragStartX = e.touches[0].clientX;
                state.dragStartY = e.touches[0].clientY;
                state.dragStartCenterX = state.centerX;
                state.dragStartCenterY = state.centerY;
            } else if (e.touches.length === 2) {
                state.isDragging = false;
                initialPinchDist = Math.hypot(
                    e.touches[0].clientX - e.touches[1].clientX,
                    e.touches[0].clientY - e.touches[1].clientY
                );
            }
        }, { passive: true });

        canvas.addEventListener('touchmove', e => {
            if (e.touches.length === 1 && state.isDragging) {
                let dx = e.touches[0].clientX - state.dragStartX;
                let dy = e.touches[0].clientY - state.dragStartY;
                state.centerX = state.dragStartCenterX - dx / state.scale;
                state.centerY = state.dragStartCenterY + dy / state.scale;
                state.isDirty = true;
            } else if (e.touches.length === 2 && initialPinchDist > 0) {
                let dist = Math.hypot(
                    e.touches[0].clientX - e.touches[1].clientX,
                    e.touches[0].clientY - e.touches[1].clientY
                );
                let factor = dist / initialPinchDist;
                initialPinchDist = dist;
                setScale(state.scale * factor, state.width / 2, state.height / 2);
            }
        }, { passive: true });

        canvas.addEventListener('touchend', () => {
            state.isDragging = false;
            initialPinchDist = 0;
        });
    }

    function setScale(newScale, centerPixelX, centerPixelY) {
        newScale = Math.max(2, Math.min(newScale, 15000));
        let mathX = pixelToMathX(centerPixelX);
        let mathY = pixelToMathY(centerPixelY);

        state.scale = newScale;
        state.centerX = mathX - (centerPixelX - state.width / 2) / state.scale;
        state.centerY = mathY + (centerPixelY - state.height / 2) / state.scale;
        state.isDirty = true;
    }

    // --- Expression UI & Desmos Virtual Keypad Management ---

    let activeInputIndex = 0;
    let debounceTimer = null;

    function formatToLatex(expr) {
        if (!expr || !expr.trim()) return 'y = 0';
        let s = expr.trim();
        // Convert math operators and functions to pretty math representation
        s = s.replace(/pi/gi, 'π');
        s = s.replace(/\*/g, ' · ');
        s = s.replace(/sqrt\(([^)]+)\)/g, '√($1)');
        s = s.replace(/abs\(([^)]+)\)/g, '|$1|');
        s = s.replace(/\^2/g, '²');
        s = s.replace(/\^3/g, '³');
        s = s.replace(/\^([0-9a-zA-Z]+)/g, '<sup>$1</sup>');
        s = s.replace(/<=/g, ' ≤ ');
        s = s.replace(/>=/g, ' ≥ ');
        return 'y = ' + s;
    }

    function updateLatexPreview(index, val) {
        let preview = document.getElementById(`latex-preview-${index}`);
        if (preview) {
            preview.innerHTML = formatToLatex(val);
        }
    }

    function getActiveInput() {
        if (!exprContainer) return null;
        let inputs = exprContainer.querySelectorAll('.graph-expr');
        if (!inputs.length) return null;
        if (activeInputIndex >= inputs.length) activeInputIndex = 0;
        return inputs[activeInputIndex];
    }

    function insertIntoActiveExpr(str) {
        let input = getActiveInput();
        if (!input) return;

        let start = input.selectionStart ?? input.value.length;
        let end = input.selectionEnd ?? input.value.length;
        let val = input.value;

        input.value = val.substring(0, start) + str + val.substring(end);
        let newPos = start + str.length;
        input.setSelectionRange(newPos, newPos);
        input.focus();

        updateExpression(activeInputIndex, input.value);
        updateLatexPreview(activeInputIndex, input.value);
    }

    function updateExpression(index, exprStr) {
        if (index >= 0 && index < state.expressions.length) {
            state.expressions[index].expr = exprStr;
            updateLatexPreview(index, exprStr);
            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(() => {
                state.expressions[index].compiled = compileExpression(exprStr);
                state.isDirty = true;
                updateValueTable();
            }, 80);
        }
    }

    function renderExpressionsDOM() {
        if (!exprContainer) return;
        exprContainer.innerHTML = '';

        state.expressions.forEach((exprObj, i) => {
            let row = document.createElement('div');
            row.className = 'graph-expr-row' + (i === activeInputIndex ? ' active-focus' : '');
            row.dataset.row = i;

            let colorIndicator = document.createElement('span');
            colorIndicator.className = 'graph-color' + (exprObj.visible ? '' : ' muted');
            colorIndicator.style.background = exprObj.color;
            colorIndicator.title = 'Click to toggle curve visibility';
            colorIndicator.addEventListener('click', () => {
                exprObj.visible = !exprObj.visible;
                colorIndicator.classList.toggle('muted', !exprObj.visible);
                state.isDirty = true;
                updateValueTable();
            });

            let inputGroup = document.createElement('div');
            inputGroup.className = 'expr-input-group';

            let latexPreview = document.createElement('div');
            latexPreview.className = 'expr-latex-preview';
            latexPreview.id = `latex-preview-${i}`;
            latexPreview.innerHTML = formatToLatex(exprObj.expr);

            let inputRow = document.createElement('div');
            inputRow.className = 'expr-input-row';

            let yLabel = document.createElement('span');
            yLabel.className = 'graph-y';
            yLabel.textContent = 'y =';

            let input = document.createElement('input');
            input.type = 'text';
            input.className = 'graph-expr';
            input.dataset.index = i;
            input.value = exprObj.expr;
            input.placeholder = 'e.g. sin(x)';

            input.addEventListener('focus', () => {
                activeInputIndex = i;
                document.querySelectorAll('.graph-expr-row').forEach(r => r.classList.remove('active-focus'));
                row.classList.add('active-focus');
            });

            input.addEventListener('input', e => {
                updateExpression(i, e.target.value);
            });

            inputRow.appendChild(yLabel);
            inputRow.appendChild(input);
            inputGroup.appendChild(latexPreview);
            inputGroup.appendChild(inputRow);

            let removeBtn = document.createElement('button');
            removeBtn.className = 'graph-remove-btn';
            removeBtn.innerHTML = '&times;';
            removeBtn.title = 'Remove function';
            removeBtn.addEventListener('click', () => {
                state.expressions.splice(i, 1);
                if (activeInputIndex >= state.expressions.length) {
                    activeInputIndex = Math.max(0, state.expressions.length - 1);
                }
                renderExpressionsDOM();
                state.isDirty = true;
                updateValueTable();
            });

            row.appendChild(colorIndicator);
            row.appendChild(inputGroup);
            row.appendChild(removeBtn);
            exprContainer.appendChild(row);
        });
        updateValueTable();
    }

    function addExpression(expr = '') {
        if (state.expressions.length >= 8) return;
        let color = COLORS[state.expressions.length % COLORS.length];
        state.expressions.push({
            expr: expr,
            color: color,
            compiled: compileExpression(expr),
            visible: true
        });
        activeInputIndex = state.expressions.length - 1;
        renderExpressionsDOM();
        state.isDirty = true;
    }

    function updateValueTable() {
        if (!tableBody) return;
        tableBody.innerHTML = '';
        let firstActive = state.expressions.find(e => e.compiled && e.visible);
        if (!firstActive) {
            tableBody.innerHTML = '<tr><td colspan="2" style="text-align:center;color:#666;">No active function</td></tr>';
            return;
        }

        tablePoints.forEach((x, idx) => {
            let y = firstActive.compiled(x);
            let yText = isNaN(y) || !isFinite(y) ? 'undefined' : parseFloat(y.toFixed(4)).toString();
            let tr = document.createElement('tr');
            tr.innerHTML = `<td><input type="number" class="table-x-val" data-idx="${idx}" value="${x}" step="any"></td><td class="table-y-cell">${yText}</td>`;
            tableBody.appendChild(tr);
        });

        tableBody.querySelectorAll('.table-x-val').forEach(input => {
            input.addEventListener('input', (e) => {
                let idx = parseInt(e.target.dataset.idx, 10);
                let val = parseFloat(e.target.value);
                if (!isNaN(val)) {
                    tablePoints[idx] = val;
                    let y = firstActive.compiled(val);
                    let yText = isNaN(y) || !isFinite(y) ? 'undefined' : parseFloat(y.toFixed(4)).toString();
                    let yCell = e.target.closest('tr')?.querySelector('.table-y-cell');
                    if (yCell) yCell.textContent = yText;
                }
            });
            input.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    let curIdx = parseInt(e.target.dataset.idx, 10);
                    let curVal = tablePoints[curIdx] !== undefined ? tablePoints[curIdx] : 0;
                    tablePoints.splice(curIdx + 1, 0, parseFloat((curVal + 1).toFixed(6)));
                    updateValueTable();
                    let allInputs = tableBody.querySelectorAll('.table-x-val');
                    if (allInputs[curIdx + 1]) {
                        allInputs[curIdx + 1].focus();
                        allInputs[curIdx + 1].select();
                    }
                }
            });
        });
    }

    function resizeGraph() {
        if (!canvas || !container) return;
        let rect = container.getBoundingClientRect();
        if (rect.width <= 0 || rect.height <= 0) return;

        let dpr = window.devicePixelRatio || 1;
        state.width = rect.width;
        state.height = rect.height;

        canvas.width = Math.round(state.width * dpr);
        canvas.height = Math.round(state.height * dpr);

        if (ctx) {
            ctx.setTransform(1, 0, 0, 1, 0, 0);
            ctx.scale(dpr, dpr);
        }
        state.isDirty = true;
    }

    // --- Setup Desmos On-Screen Keypad Listeners ---
    function setupDesmosKeypad() {
        let keypadToggle = document.getElementById('desmos-keypad-toggle');
        let keypad = document.getElementById('desmos-keypad');
        let keypadArrow = document.getElementById('keypad-arrow-icon');

        if (keypadToggle && keypad) {
            keypadToggle.addEventListener('click', () => {
                let isCollapsed = keypad.classList.toggle('collapsed');
                if (keypadArrow) {
                    keypadArrow.style.transform = isCollapsed ? 'rotate(180deg)' : 'rotate(0deg)';
                }
                setTimeout(() => resizeGraph(), 220);
            });
        }

        if (keypad) {
            keypad.querySelectorAll('.kbtn[data-k]').forEach(btn => {
                btn.addEventListener('mousedown', e => e.preventDefault());
                btn.addEventListener('click', e => {
                    e.preventDefault();
                    insertIntoActiveExpr(btn.dataset.k);
                });
            });

            let backspaceBtn = document.getElementById('kbtn-backspace');
            if (backspaceBtn) {
                backspaceBtn.addEventListener('mousedown', e => e.preventDefault());
                backspaceBtn.addEventListener('click', e => {
                    e.preventDefault();
                    let input = getActiveInput();
                    if (!input) return;
                    let start = input.selectionStart ?? input.value.length;
                    let end = input.selectionEnd ?? input.value.length;
                    if (start !== end) {
                        input.value = input.value.substring(0, start) + input.value.substring(end);
                        input.setSelectionRange(start, start);
                    } else if (start > 0) {
                        input.value = input.value.substring(0, start - 1) + input.value.substring(start);
                        input.setSelectionRange(start - 1, start - 1);
                    }
                    input.focus();
                    updateExpression(activeInputIndex, input.value);
                    updateLatexPreview(activeInputIndex, input.value);
                });
            }

            let leftBtn = document.getElementById('kbtn-left');
            if (leftBtn) {
                leftBtn.addEventListener('mousedown', e => e.preventDefault());
                leftBtn.addEventListener('click', e => {
                    e.preventDefault();
                    let input = getActiveInput();
                    if (input && input.selectionStart > 0) {
                        let p = input.selectionStart - 1;
                        input.setSelectionRange(p, p);
                        input.focus();
                    }
                });
            }

            let rightBtn = document.getElementById('kbtn-right');
            if (rightBtn) {
                rightBtn.addEventListener('mousedown', e => e.preventDefault());
                rightBtn.addEventListener('click', e => {
                    e.preventDefault();
                    let input = getActiveInput();
                    if (input && input.selectionEnd < input.value.length) {
                        let p = input.selectionEnd + 1;
                        input.setSelectionRange(p, p);
                        input.focus();
                    }
                });
            }

            let enterBtn = document.getElementById('kbtn-enter');
            if (enterBtn) {
                enterBtn.addEventListener('mousedown', e => e.preventDefault());
                enterBtn.addEventListener('click', e => {
                    e.preventDefault();
                    addExpression('');
                    let inputs = exprContainer.querySelectorAll('.graph-expr');
                    if (inputs.length) {
                        activeInputIndex = inputs.length - 1;
                        inputs[activeInputIndex].focus();
                    }
                });
            }

            // Extended drawer toggle
            let extraDrawer = document.getElementById('keypad-extra-fns');
            let fnMenuBtn = document.getElementById('kbtn-more-fn');
            let trigToggleBtn = document.getElementById('kbtn-trig-toggle');

            function toggleExtra() {
                if (!extraDrawer) return;
                let isShown = extraDrawer.style.display !== 'none';
                extraDrawer.style.display = isShown ? 'none' : 'grid';
                if (fnMenuBtn) fnMenuBtn.classList.toggle('active', !isShown);
                if (trigToggleBtn) trigToggleBtn.classList.toggle('active', !isShown);
            }

            if (fnMenuBtn) fnMenuBtn.addEventListener('click', toggleExtra);
            if (trigToggleBtn) trigToggleBtn.addEventListener('click', toggleExtra);
        }
    }

    // --- Public API ---

    return {
        initGraph: function() {
            canvas = document.getElementById('graph-canvas');
            if (!canvas) return;

            ctx = canvas.getContext('2d');
            container = canvas.parentElement;
            exprContainer = document.getElementById('graph-expressions');
            addBtn = document.getElementById('graph-add');
            zoomInBtn = document.getElementById('graph-zoom-in');
            zoomOutBtn = document.getElementById('graph-zoom-out');
            resetBtn = document.getElementById('graph-reset');
            tooltipEl = document.getElementById('graph-tooltip');
            tableContainer = document.getElementById('graph-table-container');
            tableBody = document.getElementById('graph-table-body');
            tableToggleBtn = document.getElementById('graph-table-toggle');

            resizeGraph();
            setupCanvasListeners();
            setupDesmosKeypad();

            if (resizeObserver) resizeObserver.disconnect();
            resizeObserver = new ResizeObserver(() => resizeGraph());
            resizeObserver.observe(container);

            if (addBtn) {
                addBtn.addEventListener('click', () => addExpression());
            }

            if (zoomInBtn) {
                zoomInBtn.addEventListener('click', () => {
                    setScale(state.scale * 1.4, state.width / 2, state.height / 2);
                });
            }

            if (zoomOutBtn) {
                zoomOutBtn.addEventListener('click', () => {
                    setScale(state.scale / 1.4, state.width / 2, state.height / 2);
                });
            }

            if (resetBtn) {
                resetBtn.addEventListener('click', () => {
                    state.centerX = 0;
                    state.centerY = 0;
                    state.scale = Math.min(state.width, state.height) / 20 || 45;
                    state.isDirty = true;
                });
            }

            if (tableToggleBtn && tableContainer) {
                tableToggleBtn.addEventListener('click', () => {
                    let isHidden = tableContainer.style.display === 'none';
                    tableContainer.style.display = isHidden ? 'block' : 'none';
                    tableToggleBtn.classList.toggle('active', isHidden);
                    if (isHidden) updateValueTable();
                });
            }

            tblStartX = document.getElementById('tbl-start-x');
            tblEndX = document.getElementById('tbl-end-x');
            tblStepX = document.getElementById('tbl-step-x');
            tblGenBtn = document.getElementById('tbl-gen-btn');
            tblAddRowBtn = document.getElementById('tbl-add-row-btn');

            if (tblGenBtn) {
                tblGenBtn.addEventListener('click', () => {
                    let start = parseFloat(tblStartX?.value);
                    let end = parseFloat(tblEndX?.value);
                    let step = parseFloat(tblStepX?.value);
                    if (isNaN(start)) start = -5;
                    if (isNaN(end)) end = 5;
                    if (isNaN(step) || step <= 0) step = 1;
                    if (start > end) { let t = start; start = end; end = t; }
                    tablePoints = [];
                    for (let x = start; x <= end + (step * 0.0001) && tablePoints.length < 100; x += step) {
                        tablePoints.push(parseFloat(x.toFixed(6)));
                    }
                    updateValueTable();
                });
            }

            if (tblAddRowBtn) {
                tblAddRowBtn.addEventListener('click', () => {
                    let last = tablePoints.length > 0 ? tablePoints[tablePoints.length - 1] : 0;
                    let step = parseFloat(tblStepX?.value) || 1;
                    if (step <= 0) step = 1;
                    tablePoints.push(parseFloat((last + step).toFixed(6)));
                    updateValueTable();
                    let inputs = tableBody?.querySelectorAll('.table-x-val');
                    if (inputs && inputs.length > 0) {
                        inputs[inputs.length - 1].focus();
                        inputs[inputs.length - 1].select();
                    }
                });
            }

            // Preset Chips
            document.querySelectorAll('.graph-preset-chip').forEach(chip => {
                chip.addEventListener('click', () => {
                    let expr = chip.dataset.expr;
                    if (state.expressions.length > 0 && state.expressions[0].expr === '') {
                        state.expressions[0].expr = expr;
                        state.expressions[0].compiled = compileExpression(expr);
                        renderExpressionsDOM();
                    } else {
                        addExpression(expr);
                    }
                    state.isDirty = true;
                });
            });

            // Initial view scale
            state.scale = Math.min(state.width, state.height) / 20 || 45;

            // Add default expression if none exists
            if (state.expressions.length === 0) {
                addExpression('sin(x)');
            } else {
                renderExpressionsDOM();
            }

            if (!renderLoopId) {
                renderLoopId = requestAnimationFrame(render);
            }
        },
        resizeGraph: resizeGraph,
        addExpression: addExpression,
        insertIntoActiveExpr: insertIntoActiveExpr
    };
})();

// Expose globally
window.initGraph = GraphingCalculator.initGraph;
window.resizeGraph = GraphingCalculator.resizeGraph;
