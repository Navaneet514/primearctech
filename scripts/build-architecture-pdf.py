from pathlib import Path
from reportlab.lib.colors import HexColor
from reportlab.lib.pagesizes import letter
from reportlab.pdfbase.pdfmetrics import stringWidth
from reportlab.pdfgen import canvas

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "output" / "pdf" / "fieldrelay-architecture-brief.pdf"
OUT.parent.mkdir(parents=True, exist_ok=True)

INK = HexColor("#111315")
SURFACE = HexColor("#191C1F")
RAISED = HexColor("#23272B")
BONE = HexColor("#F1EFE9")
STEEL = HexColor("#A7ADB2")
LINE = HexColor("#373C41")
ORANGE = HexColor("#D8643E")

c = canvas.Canvas(str(OUT), pagesize=letter)
w, h = letter
c.setFillColor(INK)
c.rect(0, 0, w, h, fill=1, stroke=0)

def text(x, y, value, size, color=BONE, font="Helvetica", leading=None):
    c.setFillColor(color)
    c.setFont(font, size)
    if leading is None:
        c.drawString(x, y, value)
        return y
    cursor = c.beginText(x, y)
    cursor.setFont(font, size)
    cursor.setFillColor(color)
    cursor.setLeading(leading)
    for line in value.split("\n"):
        cursor.textLine(line)
    c.drawText(cursor)
    return y - leading * value.count("\n")

def wrap(value, width, size, font="Helvetica"):
    words = value.split()
    lines, current = [], ""
    for word in words:
        candidate = f"{current} {word}".strip()
        if stringWidth(candidate, font, size) <= width:
            current = candidate
        else:
            if current: lines.append(current)
            current = word
    if current: lines.append(current)
    return "\n".join(lines)

def label(x, y, value, color=ORANGE):
    c.setFillColor(color)
    c.setFont("Helvetica-Bold", 7.3)
    c.drawString(x, y, value.upper())

margin = 42
label(margin, h - 44, "PrimeArcTech / Security brief")
text(margin, h - 77, "FieldRelay", 31, BONE, "Helvetica-Bold")
text(margin + 188, h - 74, "by PrimeArcTech", 10, STEEL, "Helvetica")
text(margin, h - 102, "A constrained call-recovery layer for home-service operators.", 12, STEEL)
c.setStrokeColor(LINE); c.line(margin, h - 122, w - margin, h - 122)

# Architecture rail
label(margin, h - 150, "Call path")
boxes = [
    ("Caller", "Explicit click\nFictional data"),
    ("Voice provider", "Live audio\n3 minute limit"),
    ("Policy layer", "Qualify\nApply boundaries"),
    ("Webhook", "Authenticate\nNormalize artifact"),
    ("D1 session", "Transcript\nProvisional receipt"),
]
gap = 8
box_w = (w - 2 * margin - gap * 4) / 5
top = h - 169
for i, (title, body) in enumerate(boxes):
    x = margin + i * (box_w + gap)
    c.setFillColor(SURFACE if i != 2 else RAISED)
    c.roundRect(x, top - 76, box_w, 76, 7, fill=1, stroke=0)
    text(x + 10, top - 19, f"0{i+1}", 7, ORANGE, "Helvetica-Bold")
    text(x + 10, top - 37, title, 9, BONE, "Helvetica-Bold")
    text(x + 10, top - 52, body, 7.2, STEEL, "Helvetica", 10)
    if i < 4:
        c.setStrokeColor(ORANGE); c.setLineWidth(1.4)
        c.line(x + box_w + 1, top - 38, x + box_w + gap - 1, top - 38)

text(margin, h - 270, wrap("Every outcome is provisional, sandboxed, or illustrative. The public demo performs no real booking, dispatch, transfer, estimate, or CRM write.", w - 2 * margin, 8.5, "Helvetica-Bold"), 8.5, BONE, "Helvetica-Bold", 11)

# Two columns
col_gap = 24
col_w = (w - 2 * margin - col_gap) / 2
left = margin
right = margin + col_w + col_gap
y = h - 318

def section(x, y, title, items, width):
    label(x, y, title)
    y -= 19
    c.setStrokeColor(LINE); c.line(x, y + 6, x + width, y + 6)
    for item in items:
        c.setFillColor(ORANGE); c.circle(x + 3, y - 4, 2.2, fill=1, stroke=0)
        block = wrap(item, width - 16, 8.2)
        lines = block.count("\n") + 1
        text(x + 12, y, block, 8.2, STEEL, "Helvetica", 11)
        y -= lines * 11 + 7
    return y

y_left = section(left, y, "Immutable safeguards", [
    "Disclose the AI demonstration in the first turn.",
    "Never diagnose, provide repair steps, or give a firm estimate.",
    "Never promise service or confirm a real appointment.",
    "Danger stops routine intake and returns control to a person.",
    "System policy resists prompt-injection attempts.",
], col_w)

y_right = section(right, y, "Data handling", [
    "Public sessions expire after 2 hours; pitch sessions after 24 hours.",
    "Cleanup deletes expired sessions after a 1 day grace period.",
    "Rate limiting retains only a salted IP hash, never a raw IP.",
    "Transcripts, names, emails, and ZIPs are prohibited from analytics.",
    "Public demo recording remains disabled.",
], col_w)

y2 = min(y_left, y_right) - 16
label(margin, y2, "Provenance and failure behavior")
y2 -= 20
c.setFillColor(SURFACE); c.roundRect(margin, y2 - 66, w - 2 * margin, 66, 8, fill=1, stroke=0)
prov = [("Provider", "Authenticated end-of-call artifact"), ("Sandbox", "Stored fictional session"), ("Illustrative", "Audible scripted fallback")]
pw = (w - 2 * margin - 30) / 3
for i, (name, desc) in enumerate(prov):
    x = margin + 14 + i * pw
    text(x, y2 - 21, name, 9, BONE, "Helvetica-Bold")
    text(x, y2 - 38, wrap(desc, pw - 20, 7.4), 7.4, STEEL, "Helvetica", 9)

y3 = y2 - 94
label(margin, y3, "Production launch gates")
gates = ["Rotate exposed Vapi private key", "Connect and verify audit webhook", "Approve legal copy and call consent", "Supply founder and company details", "Configure hosted secrets and domain"]
y3 -= 17
for idx, gate in enumerate(gates):
    x = margin + (idx % 3) * ((w - 2 * margin) / 3)
    yy = y3 - (idx // 3) * 31
    c.setStrokeColor(LINE); c.roundRect(x, yy - 16, 12, 12, 2, fill=0, stroke=1)
    text(x + 19, yy - 13, wrap(gate, (w - 2 * margin) / 3 - 28, 7.6), 7.6, STEEL, "Helvetica", 9)

c.setStrokeColor(LINE); c.line(margin, 53, w - margin, 53)
text(margin, 35, "primearc.tech/security", 8, BONE, "Helvetica-Bold")
text(w - margin - 190, 35, "Pre-launch architecture brief / v1", 8, STEEL)
c.save()
print(OUT)
