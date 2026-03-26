"""
AlumniHub — Bulk Student Welcome Email Sender
=============================================
Sends a welcome email to every student listed in the CSV file.

Setup:
    1. Copy .env.example → .env  in this same folder
    2. Fill in EMAIL_USER and EMAIL_PASS (.env must be present)
    3. python send_student_emails.py

Requirements: none beyond the standard library (no pip install needed)
"""

import csv
import smtplib
import os
import sys
import time
import re
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from pathlib import Path

# ─── Load .env manually ──────────────────────────────────────────────────────
def load_env(env_path: Path) -> dict:
    """Parse a .env file and return key→value pairs.
    Handles quoted values (single or double quotes) and inline comments.
    """
    env = {}
    if not env_path.exists():
        return env
    with open(env_path, 'r', encoding='utf-8') as f:
        for line in f:
            line = line.strip()
            if not line or line.startswith('#') or '=' not in line:
                continue
            key, _, val = line.partition('=')
            key = key.strip()
            val = val.strip()
            # Strip inline comments (only if val is not quoted)
            if val and val[0] not in ('"', "'"):
                val = re.sub(r'\s+#.*$', '', val).strip()
            # Strip surrounding quotes
            if len(val) >= 2 and val[0] == val[-1] and val[0] in ('"', "'"):
                val = val.removeprefix(val[0]).removesuffix(val[-1])
            env[key] = val
    return env


ENV_PATH  = Path(__file__).parent / '.env'
env       = load_env(ENV_PATH)

EMAIL_USER = env.get('EMAIL_USER', '').strip()
EMAIL_PASS = env.get('EMAIL_PASS', '').strip()
CSV_PATH   = Path(__file__).parent / 'sample-csv' / 'students_clean.csv'

# ─── HTML Email Template ─────────────────────────────────────────────────────
def build_email_html(name: str, department: str, batch: str, roll: str) -> str:
    return f"""\
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Welcome to AlumniHub</title>
</head>
<body style="margin:0; padding:0; background:#f0f4f8; font-family:'Segoe UI', Arial, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f0f4f8; padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px; width:100%;">

          <!-- Header Banner -->
          <tr>
            <td style="background:linear-gradient(135deg,#1e40af,#7c3aed);
                        border-radius:20px 20px 0 0; padding:40px 40px 30px; text-align:center;">
              <h1 style="margin:0; color:#ffffff; font-size:32px; font-weight:900; letter-spacing:-1px;">
                &#127891; AlumniHub
              </h1>
              <p style="margin:8px 0 0; color:rgba(255,255,255,0.80); font-size:14px; font-weight:500;">
                KGiSL Institute of Technology &mdash; Alumni Network
              </p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="background:#ffffff; padding:40px; border-radius:0 0 20px 20px;
                        box-shadow:0 8px 30px rgba(0,0,0,0.08);">

              <p style="font-size:22px; font-weight:800; color:#1e293b; margin:0 0 6px;">
                Welcome, {name}! &#128075;
              </p>
              <p style="font-size:14px; color:#64748b; margin:0 0 28px;">
                {department} &nbsp;&bull;&nbsp; Batch {batch} &nbsp;&bull;&nbsp; Roll No: {roll}
              </p>

              <p style="font-size:15px; color:#334155; line-height:1.8; margin:0 0 20px;">
                We're excited to welcome you to <strong>AlumniHub</strong> &mdash; the official alumni-student
                networking platform of KGiSL Institute of Technology!
              </p>

              <p style="font-size:15px; color:#334155; line-height:1.8; margin:0 0 28px;">
                Through this platform, you can:
              </p>

              <!-- Feature Cards -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td width="48%" style="background:#f0f9ff; border:1px solid #bae6fd;
                      border-radius:14px; padding:18px 20px; vertical-align:top;">
                    <p style="margin:0; font-size:22px;">&#129309;</p>
                    <p style="margin:6px 0 4px; font-size:14px; font-weight:800; color:#1e40af;">
                      Connect with Alumni
                    </p>
                    <p style="margin:0; font-size:12px; color:#64748b; line-height:1.6;">
                      Find mentors from your department and get career guidance
                    </p>
                  </td>
                  <td width="4%"></td>
                  <td width="48%" style="background:#f0fdf4; border:1px solid #bbf7d0;
                      border-radius:14px; padding:18px 20px; vertical-align:top;">
                    <p style="margin:0; font-size:22px;">&#128188;</p>
                    <p style="margin:6px 0 4px; font-size:14px; font-weight:800; color:#16a34a;">
                      AI Resume Screening
                    </p>
                    <p style="margin:0; font-size:12px; color:#64748b; line-height:1.6;">
                      Apply for jobs posted by alumni with AI-powered resume matching
                    </p>
                  </td>
                </tr>
                <tr><td colspan="3" style="height:16px;"></td></tr>
                <tr>
                  <td width="48%" style="background:#fdf4ff; border:1px solid #e9d5ff;
                      border-radius:14px; padding:18px 20px; vertical-align:top;">
                    <p style="margin:0; font-size:22px;">&#128197;</p>
                    <p style="margin:6px 0 4px; font-size:14px; font-weight:800; color:#7c3aed;">
                      Events &amp; Workshops
                    </p>
                    <p style="margin:0; font-size:12px; color:#64748b; line-height:1.6;">
                      Stay updated on campus events, webinars, and alumni meets
                    </p>
                  </td>
                  <td width="4%"></td>
                  <td width="48%" style="background:#fffbeb; border:1px solid #fde68a;
                      border-radius:14px; padding:18px 20px; vertical-align:top;">
                    <p style="margin:0; font-size:22px;">&#127760;</p>
                    <p style="margin:6px 0 4px; font-size:14px; font-weight:800; color:#d97706;">
                      Build Your Network
                    </p>
                    <p style="margin:0; font-size:12px; color:#64748b; line-height:1.6;">
                      Connect with peers, alumni, and industry professionals
                    </p>
                  </td>
                </tr>
              </table>

              <!-- CTA Button -->
              <div style="text-align:center; margin:36px 0 28px;">
                <a href="https://alumni-connect-hub.vercel.app/signin"
                   style="background:linear-gradient(135deg,#1e40af,#7c3aed);
                          color:#ffffff; text-decoration:none; padding:16px 48px;
                          border-radius:50px; font-size:15px; font-weight:800;
                          letter-spacing:0.5px; display:inline-block;
                          box-shadow:0 8px 24px rgba(124,58,237,0.35);">
                  &#128640; Login to AlumniHub
                </a>
              </div>

              <!-- Credentials hint -->
              <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:12px;
                          padding:18px 22px; margin-bottom:28px;">
                <p style="margin:0 0 6px; font-size:12px; font-weight:800; color:#475569;
                           text-transform:uppercase; letter-spacing:0.5px;">&#128272; Login Credentials</p>
                <p style="margin:0; font-size:14px; color:#1e293b;">
                  <strong>Email:</strong> your college email ID<br/>
                  <strong>Password:</strong> Use &ldquo;Sign Up&rdquo; to create your account using your college email
                </p>
              </div>

              <p style="font-size:13px; color:#94a3b8; border-top:1px solid #e2e8f0;
                         padding-top:20px; margin:0;">
                This email was sent by <strong>AlumniHub</strong>, the official alumni networking platform
                of KGiSL Institute of Technology. If you have any questions, contact your department coordinator.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
"""

# ─── Send single email ────────────────────────────────────────────────────────
def send_email(smtp: smtplib.SMTP_SSL, to_email: str, to_name: str,
               department: str, batch: str, roll: str) -> bool:
    try:
        msg = MIMEMultipart('alternative')
        msg['Subject'] = f"Welcome to AlumniHub, {to_name}! — KGiSL Alumni Network"
        msg['From']    = f"AlumniHub — KGKITE <{EMAIL_USER}>"
        msg['To']      = to_email

        html_body = build_email_html(to_name, department, batch, roll)
        msg.attach(MIMEText(html_body, 'html', 'utf-8'))

        smtp.sendmail(EMAIL_USER, to_email, msg.as_string())
        return True
    except Exception as e:
        print(f"  ❌ Failed to send to {to_email}: {e}")
        return False

# ─── Validate credentials ─────────────────────────────────────────────────────
def validate_credentials() -> bool:
    ok = True
    if not ENV_PATH.exists():
        print("\n❌ ERROR: .env file not found!")
        print(f"   Expected location: {ENV_PATH}")
        print("   Copy .env.example → .env and fill in your credentials.\n")
        return False

    if not EMAIL_USER or EMAIL_USER in ('your_gmail@gmail.com',):
        print("\n❌ ERROR: EMAIL_USER not set in .env file!")
        print("   Please update backend/.env with your Gmail address.\n")
        ok = False

    if not EMAIL_PASS or EMAIL_PASS in ('your_16_char_app_password_here', 'your_app_password_here'):
        print("\n❌ ERROR: EMAIL_PASS not set in .env file!")
        print("   Go to: https://myaccount.google.com/apppasswords")
        print("   Generate an App Password and paste it in .env\n")
        ok = False

    return ok

# ─── Connect SMTP ────────────────────────────────────────────────────────────
def _connect_smtp() -> 'smtplib.SMTP_SSL | None':
    """Connect and authenticate to Gmail SMTP. Returns None on failure."""
    try:
        print("\n🔌 Connecting to Gmail SMTP...")
        server = smtplib.SMTP_SSL('smtp.gmail.com', 465, timeout=15)
        server.login(EMAIL_USER, EMAIL_PASS)
        print("✅ Connected and authenticated!\n")
        return server
    except smtplib.SMTPAuthenticationError:
        print("\n❌ Authentication failed!")
        print("   → Use an App Password (NOT your normal Gmail password)")
        print("   → Enable 2FA first:       https://myaccount.google.com/security")
        print("   → Generate App Password:  https://myaccount.google.com/apppasswords\n")
        return None
    except Exception as exc:
        print(f"\n❌ SMTP Connection error: {exc}\n")
        return None

# ─── Main ─────────────────────────────────────────────────────────────────────
def main():
    print("=" * 60)
    print("  AlumniHub — Student Bulk Email Sender")
    print("=" * 60)

    if not validate_credentials():
        sys.exit(1)

    # Read CSV
    if not CSV_PATH.exists():
        print(f"\n❌ ERROR: CSV file not found at:\n   {CSV_PATH}\n")
        sys.exit(1)

    students = []
    with open(CSV_PATH, newline='', encoding='utf-8-sig') as f:  # utf-8-sig handles BOM
        reader = csv.DictReader(f)
        for row in reader:
            email = row.get('collegeEmail', '').strip()
            name  = row.get('name', '').strip()
            if email and name:
                students.append({
                    'name':       name,
                    'email':      email,
                    'department': row.get('department', 'N/A').strip(),
                    'batch':      row.get('batch', 'N/A').strip(),
                    'roll':       row.get('rollNumber', 'N/A').strip(),
                })

    if not students:
        print("\n⚠️  No valid students found in CSV (check column headers).\n")
        sys.exit(1)

    print(f"\n📋 Found {len(students)} students in CSV")
    print(f"📧 Sending from: {EMAIL_USER}")
    print("-" * 60)

    # Connect to Gmail SMTP
    smtp = _connect_smtp()
    if smtp is None:
        sys.exit(1)
    assert smtp is not None  # help Pyre2 narrow the type

    # Send emails
    sent:   int = 0
    failed: int = 0

    try:
        for i, student in enumerate(students, 1):
            print(f"  [{i:02d}/{len(students)}] {student['name']} <{student['email']}> ...", end=' ', flush=True)
            ok = send_email(
                smtp,
                student['email'],
                student['name'],
                student['department'],
                student['batch'],
                student['roll'],
            )
            if ok:
                print("✅ Sent")
                sent = sent.__add__(1)
            else:
                failed = failed.__add__(1)

            # Small delay to avoid Gmail rate limiting
            if i < len(students):
                time.sleep(0.5)
    finally:
        try:
            smtp.quit()
        except Exception:
            pass

    print("\n" + "=" * 60)
    print("  📊 RESULTS:")
    print(f"     ✅ Successfully sent : {sent}")
    print(f"     ❌ Failed            : {failed}")
    print(f"     📧 Total students   : {len(students)}")
    print("=" * 60 + "\n")


if __name__ == '__main__':
    main()
