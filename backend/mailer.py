import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from email.mime.image import MIMEImage
import os
from dotenv import load_dotenv

load_dotenv()

MAIL_SERVER = os.getenv("MAIL_SERVER", "smtp.gmail.com")
MAIL_PORT = 465
MAIL_USERNAME = os.getenv("MAIL_USERNAME")
MAIL_PASSWORD = os.getenv("MAIL_PASSWORD")

FINANCE_EMAIL = "ogesasset049@gmail.com"

def send_notification(expense):
    receipt_url = f"http://localhost:8000/{str(expense.receipt_path).replace(chr(92), '/')}" if expense.receipt_path else "#"
    
    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <style>
            .email-wrapper {{ width: 100%; font-family: Arial, sans-serif; background-color: #f4f6f8; padding: 20px 0; }}
            .container {{ border: 2px solid black; max-width: 900px; margin: 0 auto; background-color: #ffffff; overflow: hidden; border-radius: 8px; }}
            .header-bar {{ padding: 25px 30px; text-align: center; border-bottom: 2px solid #00AEEF; background-color: #e6f7ff; }}
            
            .table-container {{ padding: 0 30px 30px 30px; text-align: center; overflow-x: auto; }}
            .expense-table {{ width: 100%; border-collapse: collapse; border: 2px solid black; font-size: 13px; text-align: left; }}
            .expense-table th {{ border: 1px solid black; padding: 12px; background-color: #FDBA74; color: #1e293b; text-align: center; }}
            .expense-table td {{ border: 1px solid black; padding: 12px; color: #0f172a; word-wrap: break-word; text-align: center; }}
            .footer-section {{ background-color: #0f172a; color: #ffffff; text-align: center; padding: 20px; font-size: 12px; }}
            
            .info-card {{ margin: 0 30px 20px 30px; padding: 20px; text-align: left; background-color: #f8fafc; border-left: 4px solid #FF7F00; border-radius: 4px; }}
            .info-card p {{ margin: 8px 0; font-size: 15px; color: #334155; line-height: 1.5; }}
            .info-card strong {{ color: #0f172a; }}
        </style>
    </head>
    <body style="margin:0; padding:0;">
        <div class="email-wrapper">
            <div class="container">
                <!-- Header Flags -->
                <div class="header-bar">
                    <img src="cid:oges" height="60" alt="Oges">
                </div>
                
                <div style="text-align: center; padding: 30px 30px 15px 30px; color: #0f172a;">
                    <p style="font-weight: bold; font-size: 18px; margin: 5px 0;">New reimbursement request submitted.</p>
                </div>
                
                <!-- Request Info Section -->
                <div class="info-card">
                    <p><strong>Request Title:</strong> {expense.title}</p>
                    <p><strong>Description:</strong> {expense.description}</p>
                </div>
                
                <!-- Table Details -->
                <div class="table-container">
                    <h3 style="margin: 15px 0 15px 0; color: #0f172a; font-size: 18px;">Expense Details</h3>
                    <table class="expense-table" width="100%" cellpadding="0" cellspacing="0">
                        <thead>
                            <tr>
                                <th>Employee Name</th>
                                <th>Email</th>
                                <th>Category</th>
                                <th>Date</th>
                                <th>Amount (INR)</th>
                                <th>Payment Mode</th>
                                <th>Receipt</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td>{expense.employee_name}</td>
                                <td>{expense.employee_email}</td>
                                <td>{expense.category}</td>
                                <td>{expense.date}</td>
                                <td style="color: #00AEEF; font-weight: bold; white-space: nowrap;">₹ {expense.amount:,.2f}</td>
                                <td>{expense.payment_mode}</td>
                                <td><a href="{receipt_url}" style="color: #2563eb; font-weight: bold; text-decoration: underline;">View Receipt</a></td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    </body>
    </html>
    """

    text_content = f"New Expense Submission: {expense.employee_name} - {expense.title}"

    if MAIL_SERVER and MAIL_PORT and MAIL_USERNAME and MAIL_PASSWORD:
        try:
            msg_root = MIMEMultipart('related')
            msg_root['From'] = f"Oges Finance Portal <{MAIL_USERNAME}>"
            msg_root['To'] = FINANCE_EMAIL
            msg_root['Reply-To'] = MAIL_USERNAME
            msg_root['Subject'] = f"Reimbursement Request: {expense.employee_name} ({expense.date})"
            
            msg_alt = MIMEMultipart('alternative')
            msg_root.attach(msg_alt)
            
            msg_alt.attach(MIMEText(text_content, 'plain'))
            msg_alt.attach(MIMEText(html_content, 'html'))
            
            base_dir = os.path.dirname(__file__)
            logo_path = os.path.join(base_dir, 'uploads', 'oges_real.png')
            try:
                with open(logo_path, 'rb') as img_file:
                    from email.mime.image import MIMEImage
                    img = MIMEImage(img_file.read())
                img.add_header('Content-ID', '<oges>')
                img.add_header('Content-Disposition', 'inline')
                msg_root.attach(img)
            except Exception as img_err:
                print(f"Failed to load inline image: {img_err}")
            
            server = smtplib.SMTP_SSL(MAIL_SERVER, 465)
            server.login(MAIL_USERNAME, MAIL_PASSWORD)
            server.send_message(msg_root)
            server.quit()
            print(f"Successfully dispatched HTML email to {FINANCE_EMAIL}")
        except Exception as e:
            print(f"Failed to send email: {e}")
    else:
        print("====== EMAIL NOTIFICATION (MOCK) ======")
        print(text_content)
        print("=======================================")

def send_notification_from_dict(expense_dict):
    class MockExpense:
        def __init__(self, data):
            # All fields are accessed as attributes in send_notification
            self.title = data.get('title')
            self.description = data.get('description')
            self.employee_name = data.get('employee_name')
            self.employee_email = data.get('employee_email')
            self.category = data.get('category')
            self.date = data.get('date')
            self.amount = data.get('amount', 0)
            self.payment_mode = data.get('payment_mode')
            self.receipt_path = data.get('receipt_path')
            self.status = data.get('status', 'pending')
            
    mock_obj = MockExpense(expense_dict)
    return send_notification(mock_obj)
