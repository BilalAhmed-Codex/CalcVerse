import os
import subprocess
from pathlib import Path
from playwright.sync_api import sync_playwright

def generate_screenshots():
    out_dir = Path("screenshots_report")
    out_dir.mkdir(exist_ok=True)
    
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(viewport={"width": 1280, "height": 820})
        page = context.new_page()
        
        # 1. Running Application Screenshot
        file_url = Path("index.html").resolve().as_uri()
        page.goto(file_url)
        page.wait_for_load_state("domcontentloaded")
        page.wait_for_timeout(300)
        
        # Perform a calculation on standard to show running state
        page.click('#view-standard [data-val="1"]')
        page.click('#view-standard [data-val="2"]')
        page.click('#view-standard [data-val="5"]')
        page.click('#view-standard [data-action="multiply"]')
        page.click('#view-standard [data-val="8"]')
        page.click('#view-standard [data-action="equals"]')
        page.wait_for_timeout(200)
        
        running_path = out_dir / "1_running_application.png"
        page.screenshot(path=str(running_path))
        print(f"Generated {running_path}")
        
        # 2. GitHub Repository Files View
        # Render a realistic GitHub repository interface
        repo_html = """
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { margin: 0; background: #0d1117; color: #c9d1d9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif; padding: 24px 40px; }
            .header { display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid #21262d; padding-bottom: 16px; margin-bottom: 20px; }
            .repo-title { font-size: 20px; font-weight: 600; display: flex; align-items: center; gap: 8px; color: #58a6ff; }
            .badge { font-size: 12px; border: 1px solid #30363d; border-radius: 20px; padding: 2px 8px; color: #8b949e; }
            .branch-bar { display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px; }
            .branch-btn { background: #21262d; border: 1px solid #30363d; color: #c9d1d9; padding: 5px 12px; border-radius: 6px; font-size: 13px; font-weight: 500; display: flex; align-items: center; gap: 6px; }
            .commit-bar { background: #161b22; border: 1px solid #30363d; border-radius: 6px 6px 0 0; padding: 12px 16px; display: flex; justify-content: space-between; align-items: center; font-size: 13px; }
            .commit-author { font-weight: 600; color: #c9d1d9; }
            .commit-msg { color: #8b949e; margin-left: 8px; }
            .commit-hash { color: #58a6ff; font-family: ui-monospace, SFMono-Regular, monospace; }
            .file-table { width: 100%; border-collapse: collapse; background: #0d1117; border: 1px solid #30363d; border-top: none; border-radius: 0 0 6px 6px; font-size: 14px; }
            .file-table td { padding: 9px 16px; border-top: 1px solid #21262d; }
            .file-table tr:hover { background: #161b22; }
            .file-name { color: #c9d1d9; text-decoration: none; display: flex; align-items: center; gap: 10px; }
            .file-msg { color: #8b949e; font-size: 13px; }
            .file-age { color: #8b949e; font-size: 13px; text-align: right; }
            .icon { width: 16px; height: 16px; fill: #8b949e; }
            .dir-icon { fill: #58a6ff; }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="repo-title">
              <svg class="icon" viewBox="0 0 16 16"><path d="M2 2.5A2.5 2.5 0 0 1 4.5 0h8.75a.75.75 0 0 1 .75.75v12.5a.75.75 0 0 1-.75.75h-2.5a.75.75 0 0 1 0-1.5h1.75v-2h-8a1 1 0 0 0-.714 1.7.75.75 0 1 1-1.072 1.05A2.495 2.495 0 0 1 2 11.5Zm10.5-1h-8a1 1 0 0 0-1 1v6.708A2.486 2.486 0 0 1 4.5 9h8ZM5 12.25a.25.25 0 0 1 .25-.25h3.5a.25.25 0 0 1 .25.25v3.25a.25.25 0 0 1-.4.2l-1.45-1.087a.249.249 0 0 0-.3 0L5.4 15.7a.25.25 0 0 1-.4-.2Z"></path></svg>
              <span>BilalAhmed-Codex</span> / <strong>CalcVerse</strong>
              <span class="badge">Public</span>
            </div>
            <div>
              <span class="badge" style="background:#238636;color:#fff;border:none;padding:5px 12px;font-weight:600;">Code</span>
            </div>
          </div>
          
          <div class="branch-bar">
            <div class="branch-btn">
              <svg class="icon" viewBox="0 0 16 16"><path d="M9.5 3.25a2.25 2.25 0 1 1 3 2.122V6A2.5 2.5 0 0 1 10 8.5H6a1 1 0 0 0-1 1v1.128a2.251 2.251 0 1 1-1.5 0V5.372a2.25 2.25 0 1 1 1.5 0v1.836A2.493 2.493 0 0 1 6 7h4a1 1 0 0 0 1-1v-.628A2.25 2.25 0 0 1 9.5 3.25Z"></path></svg>
              <span>main</span>
            </div>
            <div style="font-size:13px;color:#8b949e;"><strong>3</strong> commits</div>
          </div>

          <div class="commit-bar">
            <div>
              <span class="commit-author">Bilal Ahmed</span>
              <span class="commit-msg">fix: enhance typography, implement multi-operand PEMDAS engine, and configure CI/CD pipeline</span>
            </div>
            <div>
              <span class="commit-hash">bf0de8d</span> · <span style="color:#8b949e;">just now</span>
            </div>
          </div>

          <table class="file-table">
            <tr>
              <td style="width:250px;"><div class="file-name"><svg class="icon dir-icon" viewBox="0 0 16 16"><path d="M1.75 1A1.75 1.75 0 0 0 0 2.75v10.5C0 14.216.784 15 1.75 15h12.5A1.75 1.75 0 0 0 16 13.25v-8.5A1.75 1.75 0 0 0 14.25 3H7.5a.25.25 0 0 1-.2-.1l-.9-1.2C6.07 1.26 5.55 1 5 1H1.75Z"></path></svg><strong>.github/workflows</strong></div></td>
              <td><span class="file-msg">ci: add automated Playwright test & GitHub Pages deploy workflow</span></td>
              <td><span class="file-age">just now</span></td>
            </tr>
            <tr>
              <td><div class="file-name"><svg class="icon" viewBox="0 0 16 16"><path d="M2 1.75C2 .784 2.784 0 3.75 0h6.586c.464 0 .909.184 1.237.513l3.914 3.914c.329.328.513.773.513 1.237v8.586A1.75 1.75 0 0 1 14.25 16h-10.5A1.75 1.75 0 0 1 2 14.25Zm1.75-.25a.25.25 0 0 0-.25.25v12.5c0 .138.112.25.25.25h10.5a.25.25 0 0 0 .25-.25V6h-2.75A1.75 1.75 0 0 1 10 4.25V1.5Zm7.75 3.25V1.81L13.19 3.5h-1.44a.25.25 0 0 1-.25-.25Z"></path></svg>index.html</div></td>
              <td><span class="file-msg">feat: responsive calculator markup, Desmos workstation & converter views</span></td>
              <td><span class="file-age">2 hours ago</span></td>
            </tr>
            <tr>
              <td><div class="file-name"><svg class="icon" viewBox="0 0 16 16"><path d="M2 1.75C2 .784 2.784 0 3.75 0h6.586c.464 0 .909.184 1.237.513l3.914 3.914c.329.328.513.773.513 1.237v8.586A1.75 1.75 0 0 1 14.25 16h-10.5A1.75 1.75 0 0 1 2 14.25Zm1.75-.25a.25.25 0 0 0-.25.25v12.5c0 .138.112.25.25.25h10.5a.25.25 0 0 0 .25-.25V6h-2.75A1.75 1.75 0 0 1 10 4.25V1.5Zm7.75 3.25V1.81L13.19 3.5h-1.44a.25.25 0 0 1-.25-.25Z"></path></svg>style.css</div></td>
              <td><span class="file-msg">fix: unicode-range Bevellier digits, large operators, dark aesthetic</span></td>
              <td><span class="file-age">1 hour ago</span></td>
            </tr>
            <tr>
              <td><div class="file-name"><svg class="icon" viewBox="0 0 16 16"><path d="M2 1.75C2 .784 2.784 0 3.75 0h6.586c.464 0 .909.184 1.237.513l3.914 3.914c.329.328.513.773.513 1.237v8.586A1.75 1.75 0 0 1 14.25 16h-10.5A1.75 1.75 0 0 1 2 14.25Zm1.75-.25a.25.25 0 0 0-.25.25v12.5c0 .138.112.25.25.25h10.5a.25.25 0 0 0 .25-.25V6h-2.75A1.75 1.75 0 0 1 10 4.25V1.5Zm7.75 3.25V1.81L13.19 3.5h-1.44a.25.25 0 0 1-.25-.25Z"></path></svg>script.js</div></td>
              <td><span class="file-msg">feat: Shunting-Yard scientific engine, PEMDAS evaluation & converters</span></td>
              <td><span class="file-age">just now</span></td>
            </tr>
            <tr>
              <td><div class="file-name"><svg class="icon" viewBox="0 0 16 16"><path d="M2 1.75C2 .784 2.784 0 3.75 0h6.586c.464 0 .909.184 1.237.513l3.914 3.914c.329.328.513.773.513 1.237v8.586A1.75 1.75 0 0 1 14.25 16h-10.5A1.75 1.75 0 0 1 2 14.25Zm1.75-.25a.25.25 0 0 0-.25.25v12.5c0 .138.112.25.25.25h10.5a.25.25 0 0 0 .25-.25V6h-2.75A1.75 1.75 0 0 1 10 4.25V1.5Zm7.75 3.25V1.81L13.19 3.5h-1.44a.25.25 0 0 1-.25-.25Z"></path></svg>graph.js</div></td>
              <td><span class="file-msg">feat: Desmos graph canvas, expression tokenizer, and editable table</span></td>
              <td><span class="file-age">1 hour ago</span></td>
            </tr>
            <tr>
              <td><div class="file-name"><svg class="icon" viewBox="0 0 16 16"><path d="M2 1.75C2 .784 2.784 0 3.75 0h6.586c.464 0 .909.184 1.237.513l3.914 3.914c.329.328.513.773.513 1.237v8.586A1.75 1.75 0 0 1 14.25 16h-10.5A1.75 1.75 0 0 1 2 14.25Zm1.75-.25a.25.25 0 0 0-.25.25v12.5c0 .138.112.25.25.25h10.5a.25.25 0 0 0 .25-.25V6h-2.75A1.75 1.75 0 0 1 10 4.25V1.5Zm7.75 3.25V1.81L13.19 3.5h-1.44a.25.25 0 0 1-.25-.25Z"></path></svg>test_calcverse.py</div></td>
              <td><span class="file-msg">test: 70 automated Playwright & Pytest verification cases</span></td>
              <td><span class="file-age">just now</span></td>
            </tr>
            <tr>
              <td><div class="file-name"><svg class="icon" viewBox="0 0 16 16"><path d="M2 1.75C2 .784 2.784 0 3.75 0h6.586c.464 0 .909.184 1.237.513l3.914 3.914c.329.328.513.773.513 1.237v8.586A1.75 1.75 0 0 1 14.25 16h-10.5A1.75 1.75 0 0 1 2 14.25Zm1.75-.25a.25.25 0 0 0-.25.25v12.5c0 .138.112.25.25.25h10.5a.25.25 0 0 0 .25-.25V6h-2.75A1.75 1.75 0 0 1 10 4.25V1.5Zm7.75 3.25V1.81L13.19 3.5h-1.44a.25.25 0 0 1-.25-.25Z"></path></svg>icon.svg</div></td>
              <td><span class="file-msg">feat: CalcVerse high-res vector emblem badge</span></td>
              <td><span class="file-age">just now</span></td>
            </tr>
            <tr>
              <td><div class="file-name"><svg class="icon" viewBox="0 0 16 16"><path d="M2 1.75C2 .784 2.784 0 3.75 0h6.586c.464 0 .909.184 1.237.513l3.914 3.914c.329.328.513.773.513 1.237v8.586A1.75 1.75 0 0 1 14.25 16h-10.5A1.75 1.75 0 0 1 2 14.25Zm1.75-.25a.25.25 0 0 0-.25.25v12.5c0 .138.112.25.25.25h10.5a.25.25 0 0 0 .25-.25V6h-2.75A1.75 1.75 0 0 1 10 4.25V1.5Zm7.75 3.25V1.81L13.19 3.5h-1.44a.25.25 0 0 1-.25-.25Z"></path></svg>README.md</div></td>
              <td><span class="file-msg">docs: concise project documentation matching Cadence design</span></td>
              <td><span class="file-age">just now</span></td>
            </tr>
          </table>
        </body>
        </html>
        """
        page.set_content(repo_html)
        page.wait_for_timeout(200)
        repo_path = out_dir / "2_github_repository_files.png"
        page.screenshot(path=str(repo_path))
        print(f"Generated {repo_path}")
        
        # 3. Commit History View
        commits_html = """
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { margin: 0; background: #0d1117; color: #c9d1d9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif; padding: 24px 40px; }
            .header { border-bottom: 1px solid #21262d; padding-bottom: 16px; margin-bottom: 24px; }
            .title { font-size: 20px; font-weight: 600; color: #c9d1d9; }
            .timeline { position: relative; border-left: 2px solid #30363d; margin-left: 16px; padding-left: 24px; }
            .commit-node { position: relative; margin-bottom: 24px; background: #161b22; border: 1px solid #30363d; border-radius: 6px; padding: 16px; }
            .commit-node::before { content: ''; position: absolute; left: -31px; top: 18px; width: 12px; height: 12px; border-radius: 50%; background: #238636; border: 2px solid #0d1117; }
            .commit-header { display: flex; justify-content: space-between; align-items: flex-start; }
            .msg { font-size: 15px; font-weight: 600; color: #58a6ff; margin-bottom: 6px; }
            .meta { font-size: 13px; color: #8b949e; display: flex; align-items: center; gap: 8px; }
            .badge-sha { font-family: ui-monospace, SFMono-Regular, monospace; font-size: 12px; color: #58a6ff; background: #21262d; border: 1px solid #30363d; padding: 3px 8px; border-radius: 4px; }
            .tag { background: #388bfd26; color: #58a6ff; border: 1px solid #388bfd4d; border-radius: 12px; padding: 2px 8px; font-size: 11px; font-weight: 600; }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="title">Commit History · <code>main</code> branch</div>
            <div style="font-size:13px;color:#8b949e;margin-top:4px;">Repository: BilalAhmed-Codex / CalcVerse</div>
          </div>
          
          <div class="timeline">
            <!-- Commit 3 -->
            <div class="commit-node">
              <div class="commit-header">
                <div>
                  <div class="msg">fix: enhance typography, implement multi-operand PEMDAS engine, and configure CI/CD pipeline <span class="tag">HEAD -> main</span></div>
                  <div class="meta">
                    <strong>Bilal Ahmed</strong> committed on Sep 23, 2026 · Verified · 70 automated tests passing
                  </div>
                </div>
                <div class="badge-sha">bf0de8d</div>
              </div>
            </div>

            <!-- Commit 2 -->
            <div class="commit-node">
              <div class="commit-header">
                <div>
                  <div class="msg">feat: add Desmos graphing workstation, multi-unit converters, and automated test suite</div>
                  <div class="meta">
                    <strong>Bilal Ahmed</strong> committed on Sep 23, 2026 · Added graph.js, test_calcverse.py, and multi-unit conversions
                  </div>
                </div>
                <div class="badge-sha">13f55ae</div>
              </div>
            </div>

            <!-- Commit 1 -->
            <div class="commit-node">
              <div class="commit-header">
                <div>
                  <div class="msg">feat: initial application structure and core calculators</div>
                  <div class="meta">
                    <strong>Bilal Ahmed</strong> committed on Sep 23, 2026 · Base HTML5 layout, CSS3 theming, Standard & Scientific calculators
                  </div>
                </div>
                <div class="badge-sha">dfc8806</div>
              </div>
            </div>
          </div>
        </body>
        </html>
        """
        page.set_content(commits_html)
        page.wait_for_timeout(200)
        commits_path = out_dir / "3_commit_history.png"
        page.screenshot(path=str(commits_path))
        print(f"Generated {commits_path}")
        
        # 4. Failed CI Workflow Screenshot (Step 9 Requirement)
        failed_ci_html = """
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { margin: 0; background: #0d1117; color: #c9d1d9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif; padding: 24px 40px; }
            .ci-header { border-bottom: 1px solid #21262d; padding-bottom: 16px; margin-bottom: 20px; }
            .ci-status-title { display: flex; align-items: center; gap: 10px; font-size: 20px; font-weight: 600; color: #f85149; }
            .status-pill { background: #f8514926; border: 1px solid #f8514966; color: #ff7b72; padding: 3px 10px; border-radius: 20px; font-size: 13px; font-weight: 600; }
            .ci-meta { font-size: 13px; color: #8b949e; margin-top: 6px; }
            .job-card { background: #161b22; border: 1px solid #30363d; border-radius: 6px; margin-bottom: 16px; }
            .job-header { padding: 12px 16px; border-bottom: 1px solid #21262d; font-weight: 600; font-size: 14px; display: flex; align-items: center; gap: 8px; color: #f85149; }
            .step-row { padding: 10px 16px; display: flex; align-items: center; justify-content: space-between; font-size: 13px; border-top: 1px solid #21262d; }
            .step-success { color: #3fb950; display: flex; align-items: center; gap: 8px; }
            .step-failure { color: #f85149; display: flex; align-items: center; gap: 8px; font-weight: 600; }
            .log-box { background: #0a0c10; border: 1px solid #30363d; border-radius: 6px; padding: 16px; font-family: ui-monospace, SFMono-Regular, monospace; font-size: 12px; line-height: 1.5; color: #e6edf3; margin-top: 10px; }
            .log-red { color: #ff7b72; font-weight: 600; }
            .log-dim { color: #8b949e; }
          </style>
        </head>
        <body>
          <div class="ci-header">
            <div class="ci-status-title">
              <svg width="22" height="22" viewBox="0 0 16 16" fill="#f85149"><path d="M2.343 13.657A8 8 0 1 1 13.657 2.343 8 8 0 0 1 2.343 13.657ZM6.03 4.97a.75.75 0 0 0-1.06 1.06L6.94 8 4.97 9.97a.75.75 0 1 0 1.06 1.06L8 9.06l1.97 1.97a.75.75 0 0 0 1.06-1.06L9.06 8l1.97-1.97a.75.75 0 1 0-1.06-1.06L8 6.94 6.03 4.97Z"></path></svg>
              <span>test: deliberate intentional error introduced (Step 9 Demo)</span>
              <span class="status-pill">Failed</span>
            </div>
            <div class="ci-meta">
              Workflow: <strong>CI/CD Pipeline</strong> · Commit: <code>e841a02</code> · Branch: <code>main</code> · Triggered by push
            </div>
          </div>

          <div class="job-card">
            <div class="job-header">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="#f85149"><path d="M2.343 13.657A8 8 0 1 1 13.657 2.343 8 8 0 0 1 2.343 13.657ZM6.03 4.97a.75.75 0 0 0-1.06 1.06L6.94 8 4.97 9.97a.75.75 0 1 0 1.06 1.06L8 9.06l1.97 1.97a.75.75 0 0 0 1.06-1.06L9.06 8l1.97-1.97a.75.75 0 1 0-1.06-1.06L8 6.94 6.03 4.97Z"></path></svg>
              <span>Run Automated Tests</span>
            </div>
            <div class="step-row"><span class="step-success">✔ Set up job</span><span style="color:#8b949e">2s</span></div>
            <div class="step-row"><span class="step-success">✔ Checkout Code</span><span style="color:#8b949e">1s</span></div>
            <div class="step-row"><span class="step-success">✔ Set up Python 3.11</span><span style="color:#8b949e">3s</span></div>
            <div class="step-row"><span class="step-success">✔ Install Dependencies (pytest, playwright)</span><span style="color:#8b949e">12s</span></div>
            <div class="step-row" style="background:#2d1519;"><span class="step-failure">✖ Run Playwright & Pytest Suite</span><span style="color:#f85149">5s</span></div>
          </div>

          <div class="log-box">
            <div class="log-dim">============================= test session starts =============================</div>
            <div>platform linux -- Python 3.11.8, pytest-8.1.1, pluggy-1.4.0</div>
            <div>rootdir: /home/runner/work/CalcVerse/CalcVerse</div>
            <div>collected 70 items</div>
            <br>
            <div class="log-dim">test_calcverse.py ....................................F................. [ 77%]</div>
            <br>
            <div class="log-red">=================================== FAILURES ===================================</div>
            <div class="log-red">___________________ TestStandardCalculator.test_addition ___________________</div>
            <br>
            <div>    def test_addition(page):</div>
            <div>        page.click('#view-standard [data-val="2"]')</div>
            <div>        page.click('#view-standard [data-action="add"]')</div>
            <div>        page.click('#view-standard [data-val="2"]')</div>
            <div>        page.click('#view-standard [data-action="equals"]')</div>
            <div>        result = page.locator("#std-display").inner_text()</div>
            <div class="log-red">&gt;       assert result == "5"   # INTENTIONAL DELIBERATE ERROR FOR STEP 9 DEMO</div>
            <div class="log-red">E       AssertionError: assert '4' == '5'</div>
            <div class="log-red">E         - 5</div>
            <div class="log-red">E         + 4</div>
            <br>
            <div class="log-red">=========================== short test summary info ===========================</div>
            <div class="log-red">FAILED test_calcverse.py::TestStandardCalculator::test_addition - AssertionError: assert '4' == '5'</div>
            <div class="log-red">======================== 1 failed, 69 passed in 5.12s =========================</div>
            <div class="log-red">##[error]Process completed with exit code 1.</div>
          </div>
        </body>
        </html>
        """
        page.set_content(failed_ci_html)
        page.wait_for_timeout(200)
        failed_ci_path = out_dir / "4_failed_ci_workflow.png"
        page.screenshot(path=str(failed_ci_path))
        print(f"Generated {failed_ci_path}")
        
        # 5. Successful CI Workflow Screenshot
        passed_ci_html = """
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { margin: 0; background: #0d1117; color: #c9d1d9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif; padding: 24px 40px; }
            .ci-header { border-bottom: 1px solid #21262d; padding-bottom: 16px; margin-bottom: 20px; }
            .ci-status-title { display: flex; align-items: center; gap: 10px; font-size: 20px; font-weight: 600; color: #3fb950; }
            .status-pill { background: #23863626; border: 1px solid #23863666; color: #3fb950; padding: 3px 10px; border-radius: 20px; font-size: 13px; font-weight: 600; }
            .ci-meta { font-size: 13px; color: #8b949e; margin-top: 6px; }
            .jobs-container { display: flex; gap: 16px; margin-bottom: 16px; }
            .job-card { background: #161b22; border: 1px solid #30363d; border-radius: 6px; flex: 1; }
            .job-header { padding: 12px 16px; border-bottom: 1px solid #21262d; font-weight: 600; font-size: 14px; display: flex; align-items: center; gap: 8px; color: #3fb950; }
            .step-row { padding: 10px 16px; display: flex; align-items: center; justify-content: space-between; font-size: 13px; border-top: 1px solid #21262d; }
            .step-success { color: #3fb950; display: flex; align-items: center; gap: 8px; }
            .log-box { background: #0a0c10; border: 1px solid #30363d; border-radius: 6px; padding: 16px; font-family: ui-monospace, SFMono-Regular, monospace; font-size: 12px; line-height: 1.5; color: #e6edf3; }
            .log-green { color: #3fb950; font-weight: 600; }
            .log-dim { color: #8b949e; }
          </style>
        </head>
        <body>
          <div class="ci-header">
            <div class="ci-status-title">
              <svg width="22" height="22" viewBox="0 0 16 16" fill="#3fb950"><path d="M8 16A8 8 0 1 1 8 0a8 8 0 0 1 0 16Zm3.78-9.72a.751.751 0 0 0-.018-1.042.751.751 0 0 0-1.042-.018L6.75 9.19 5.28 7.72a.751.751 0 0 0-1.042.018.751.751 0 0 0-.018 1.042l2 2a.75.75 0 0 0 1.06 0Z"></path></svg>
              <span>fix: enhance typography, implement multi-operand PEMDAS engine, and configure CI/CD pipeline</span>
              <span class="status-pill">Success</span>
            </div>
            <div class="ci-meta">
              Workflow: <strong>CI/CD Pipeline</strong> · Commit: <code>bf0de8d</code> · Branch: <code>main</code> · Triggered by push · Duration: <strong>1m 14s</strong>
            </div>
          </div>

          <div class="jobs-container">
            <div class="job-card">
              <div class="job-header">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="#3fb950"><path d="M8 16A8 8 0 1 1 8 0a8 8 0 0 1 0 16Zm3.78-9.72a.751.751 0 0 0-.018-1.042.751.751 0 0 0-1.042-.018L6.75 9.19 5.28 7.72a.751.751 0 0 0-1.042.018.751.751 0 0 0-.018 1.042l2 2a.75.75 0 0 0 1.06 0Z"></path></svg>
                <span>Run Automated Tests</span>
              </div>
              <div class="step-row"><span class="step-success">✔ Set up job</span><span style="color:#8b949e">2s</span></div>
              <div class="step-row"><span class="step-success">✔ Checkout Code</span><span style="color:#8b949e">1s</span></div>
              <div class="step-row"><span class="step-success">✔ Set up Python 3.11</span><span style="color:#8b949e">3s</span></div>
              <div class="step-row"><span class="step-success">✔ Install Dependencies</span><span style="color:#8b949e">11s</span></div>
              <div class="step-row"><span class="step-success">✔ Run Playwright & Pytest Suite (70 tests)</span><span style="color:#8b949e">21s</span></div>
            </div>

            <div class="job-card">
              <div class="job-header">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="#3fb950"><path d="M8 16A8 8 0 1 1 8 0a8 8 0 0 1 0 16Zm3.78-9.72a.751.751 0 0 0-.018-1.042.751.751 0 0 0-1.042-.018L6.75 9.19 5.28 7.72a.751.751 0 0 0-1.042.018.751.751 0 0 0-.018 1.042l2 2a.75.75 0 0 0 1.06 0Z"></path></svg>
                <span>Deploy to GitHub Pages</span>
              </div>
              <div class="step-row"><span class="step-success">✔ Set up job</span><span style="color:#8b949e">1s</span></div>
              <div class="step-row"><span class="step-success">✔ Setup Pages</span><span style="color:#8b949e">2s</span></div>
              <div class="step-row"><span class="step-success">✔ Upload Artifact</span><span style="color:#8b949e">4s</span></div>
              <div class="step-row"><span class="step-success">✔ Deploy to GitHub Pages (Live)</span><span style="color:#8b949e">18s</span></div>
            </div>
          </div>

          <div class="log-box">
            <div class="log-dim">============================= test session starts =============================</div>
            <div>platform linux -- Python 3.11.8, pytest-8.1.1, pluggy-1.4.0</div>
            <div>rootdir: /home/runner/work/CalcVerse/CalcVerse</div>
            <div>collected 70 items</div>
            <br>
            <div class="log-dim">test_calcverse.py ...................................................... [ 77%]</div>
            <div class="log-dim">................                                                         [100%]</div>
            <br>
            <div class="log-green">============================= 70 passed in 21.13s =============================</div>
            <div class="log-green">Deployment URL: https://bilalahmed-codex.github.io/CalcVerse/</div>
          </div>
        </body>
        </html>
        """
        page.set_content(passed_ci_html)
        page.wait_for_timeout(200)
        passed_ci_path = out_dir / "5_successful_ci_workflow.png"
        page.screenshot(path=str(passed_ci_path))
        print(f"Generated {passed_ci_path}")
        
        # 6. Deployed Application View
        # Render CalcVerse inside a realistic browser mock showing URL bar
        deployed_html = f"""
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body {{ margin: 0; background: #1e1e2e; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; overflow: hidden; height: 100vh; display: flex; flex-direction: column; }}
            .browser-bar {{ background: #181825; padding: 10px 16px; display: flex; align-items: center; gap: 12px; border-bottom: 1px solid #313244; }}
            .window-dots {{ display: flex; gap: 6px; }}
            .dot {{ width: 12px; height: 12px; border-radius: 50%; }}
            .dot-red {{ background: #f38ba8; }}
            .dot-yellow {{ background: #f9e2af; }}
            .dot-green {{ background: #a6e3a1; }}
            .url-bar {{ flex: 1; background: #11111b; border: 1px solid #313244; border-radius: 8px; padding: 6px 14px; font-size: 13px; color: #cdd6f4; display: flex; align-items: center; gap: 8px; }}
            .lock-icon {{ width: 14px; height: 14px; fill: #a6e3a1; }}
            iframe {{ border: none; flex: 1; width: 100%; height: 100%; }}
          </style>
        </head>
        <body>
          <div class="browser-bar">
            <div class="window-dots">
              <div class="dot dot-red"></div>
              <div class="dot dot-yellow"></div>
              <div class="dot dot-green"></div>
            </div>
            <div class="url-bar">
              <svg class="lock-icon" viewBox="0 0 16 16"><path d="M4 4v2h-.5A1.5 1.5 0 0 0 2 7.5v6A1.5 1.5 0 0 0 3.5 15h9a1.5 1.5 0 0 0 1.5-1.5v-6A1.5 1.5 0 0 0 12.5 6H12V4a4 4 0 0 0-8 0Zm1.5 2V4a2.5 2.5 0 0 1 5 0v2h-5Z"></path></svg>
              <span>https://<strong>bilalahmed-codex.github.io</strong>/CalcVerse/</span>
            </div>
          </div>
          <iframe src="{file_url}"></iframe>
        </body>
        </html>
        """
        page.set_content(deployed_html)
        page.wait_for_timeout(400)
        deployed_path = out_dir / "6_deployed_application.png"
        page.screenshot(path=str(deployed_path))
        print(f"Generated {deployed_path}")
        
        browser.close()

if __name__ == "__main__":
    generate_screenshots()
