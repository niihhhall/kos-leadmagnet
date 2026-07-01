"""
KineticOS Diagnostic Funnel — Modal.com PDF Service
────────────────────────────────────────────────────
Serverless PDF generation using Playwright/Chromium on Modal.

Endpoint: POST /pdf
Body:     { "html": "<full HTML string>" }
Returns:  { "pdf_base64": "<base64 encoded PDF bytes>" }

Deploy:
  modal deploy pdf_service.py

Test locally:
  modal run pdf_service.py

Cost: ~$0.0013 per PDF from your $30 Modal credits (~23,000 PDFs)
"""

import modal
import base64

# ─── Image Definition ─────────────────────────────────────────────────────────
# Build a Debian image with Playwright + Chromium installed
image = (
    modal.Image.debian_slim(python_version="3.11")
    .pip_install("playwright==1.44.0", "fastapi[standard]")
    .run_commands(
        "playwright install chromium",
        "playwright install-deps chromium",
    )
)

app = modal.App("kos-pdf-service", image=image)

# ─── PDF Generation Function ─────────────────────────────────────────────────
@app.function(
    image=image,
    timeout=60,       # 60s max — PDF gen should take 5-10s
    memory=512,       # 512MB RAM for Chromium
    cpu=1.0,
)
def generate_pdf(html_content: str) -> bytes:
    """
    Accepts an HTML string, renders it via headless Chromium,
    and returns raw PDF bytes (A4 format, background graphics enabled).
    """
    from playwright.sync_api import sync_playwright

    with sync_playwright() as p:
        browser = p.chromium.launch(
            args=[
                "--no-sandbox",
                "--disable-setuid-sandbox",
                "--disable-dev-shm-usage",
                "--disable-gpu",
            ]
        )

        page = browser.new_page(
            viewport={"width": 794, "height": 1123}  # A4 @ 96dpi
        )

        # Set content and wait for all assets to load
        page.set_content(html_content, wait_until="networkidle")

        # Generate PDF
        pdf_bytes = page.pdf(
            format="A4",
            print_background=True,
            margin={
                "top": "0mm",
                "right": "0mm",
                "bottom": "0mm",
                "left": "0mm",
            },
        )

        browser.close()

    return pdf_bytes


# ─── Web Endpoint (called by n8n) ────────────────────────────────────────────
@app.function(image=image)
@modal.fastapi_endpoint(method="POST", label="kos-pdf-endpoint")
def pdf_endpoint(body: dict) -> dict:
    """
    HTTP endpoint called by n8n workflow.

    Request:  POST /pdf
              { "html": "<html>...</html>" }

    Response: { "pdf_base64": "JVBERi0x...", "size_bytes": 12345 }
    """
    html = body.get("html", "")

    if not html or len(html) < 100:
        return {"error": "Invalid or empty HTML content"}, 400

    try:
        pdf_bytes = generate_pdf.remote(html)
        pdf_base64 = base64.b64encode(pdf_bytes).decode("utf-8")

        return {
            "pdf_base64": pdf_base64,
            "size_bytes": len(pdf_bytes),
            "success": True,
        }

    except Exception as e:
        return {
            "error": str(e),
            "success": False,
        }


# ─── Local Test ──────────────────────────────────────────────────────────────
@app.local_entrypoint()
def test():
    """Run locally with: modal run pdf_service.py"""
    sample_html = """
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <style>
            body {
                font-family: Arial, sans-serif;
                padding: 40px;
                background: #0a0a0a;
                color: #ffffff;
            }
            h1 { color: #ff751f; }
            .score { font-size: 48px; font-weight: bold; }
        </style>
    </head>
    <body>
        <h1>KineticOS Diagnostic Report</h1>
        <p>Test User — Designer</p>
        <div class="score">31/60</div>
        <p>Emerging Architecture</p>
        <p>Your business is running on memory, not systems.</p>
    </body>
    </html>
    """

    pdf_bytes = generate_pdf.remote(sample_html)
    with open("test_report.pdf", "wb") as f:
        f.write(pdf_bytes)
    print(f"SUCCESS: PDF generated: {len(pdf_bytes):,} bytes -> test_report.pdf")
