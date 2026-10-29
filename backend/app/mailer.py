import os
import requests


def send_verification_email(to_email, code):
    response = requests.post(
        "https://api.brevo.com/v3/smtp/email",
        headers={
            "api-key": os.environ["BREVO_API_KEY"],
            "content-type": "application/json",
            "accept": "application/json",
        },
        json={
            "sender": {"email": os.environ["SMTP_SENDER"]},
            "to": [{"email": to_email}],
            "subject": "Your Teammate Finder verification code",
            "textContent": f"Your Teammate Finder verification code is: {code}\n\nIt expires in 10 minutes.",
        },
        timeout=10,
    )
    response.raise_for_status()