import os
import smtplib
from email.mime.text import MIMEText


def send_verification_email(to_email, code):
    msg = MIMEText(f"Your Teammate Finder verification code is: {code}\n\nIt expires in 10 minutes.")
    msg["Subject"] = "Your Teammate Finder verification code"
    msg["From"] = os.environ["SMTP_SENDER"]
    msg["To"] = to_email

    with smtplib.SMTP("smtp-relay.brevo.com", 587) as server:
        server.starttls()
        server.login(os.environ["BREVO_SMTP_LOGIN"], os.environ["BREVO_SMTP_KEY"])
        server.sendmail(os.environ["SMTP_SENDER"], [to_email], msg.as_string())