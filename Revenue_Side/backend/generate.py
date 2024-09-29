import mysql.connector
import PyPDF2
from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER
import io
import random
import sys
import traceback
from datetime import datetime, timedelta

def create_connection():
    try:
        db = mysql.connector.connect(
            host="localhost",
            user="root",
            password="*Evan2033",
            database="revenue_department",
            charset='utf8mb4',
            collation='utf8mb4_unicode_ci'
        )
        print("Database connection established.")
        return db
    except mysql.connector.Error as err:
        print(f"Error: {err}")
        return None

def generate_unique_id(aadhaar_id, max_length=20):
    base = aadhaar_id[-8:]
    random_part = ''.join([str(random.randint(0, 9)) for _ in range(4)])
    unique_id = f"{base}{random_part}"
    return unique_id[:max_length]

def save_pdf_to_database(cursor, table_name, id_column, pdf_column, id_value, pdf_data):
    query = f"INSERT INTO {table_name} ({id_column}, {pdf_column}) VALUES (%s, %s)"
    cursor.execute(query, (id_value, pdf_data))

def fetch_data(cursor, table, application_id):
    query = f"SELECT * FROM {table} WHERE aadhar = %s"
    cursor.execute(query, (application_id,))
    result = cursor.fetchone()
    if not result:
        raise ValueError(f"No data found for application ID {application_id} in {table} table")
    return result

def extract_text_from_pdf(pdf_data):
    reader = PyPDF2.PdfReader(io.BytesIO(pdf_data))
    text = ""
    for page in reader.pages:
        text += page.extract_text() or ""
    return text

def extract_community_details(parent_community_text):
    community, caste = None, None
    for line in parent_community_text.splitlines():
        if "community :" in line.lower():
            community = line.split(":")[1].strip() if ":" in line else None
        if "caste:" in line.lower():
            caste = line.split(":")[1].strip() if ":" in line else None
    return community, caste

def extract_salary_from_pdf(pdf_text):
    for line in pdf_text.splitlines():
        if "salary" in line.lower():
            salary = ''.join(filter(str.isdigit, line))
            if salary:
                return int(salary)
    raise ValueError("Salary not found in the PDF.")

def format_indian_currency(amount):
    s = str(amount)
    if len(s) <= 3:
        return s
    elif len(s) <= 5:
        return s[:-3] + ',' + s[-3:]
    else:
        return s[:-5] + ',' + s[-5:-3] + ',' + s[-3:]

def generate_certificate(name, details, certificate_type, certificate_id):
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=letter)
    story = []
    styles = getSampleStyleSheet()
    styles.add(ParagraphStyle(name='Center', alignment=TA_CENTER))
    current_date = datetime.now()
    expiry_date = current_date + timedelta(days=365)
    story.append(Paragraph(f"{certificate_type.capitalize()} Certificate", styles['Title']))
    story.append(Spacer(1, 12))
    story.append(Paragraph(f"Certificate ID: {certificate_id}", styles['Normal']))
    story.append(Spacer(1, 12))
    story.append(Paragraph(f"Name: {name}", styles['Normal']))
    story.append(Spacer(1, 12))
    for key, value in details.items():
        story.append(Paragraph(f"{key}: {value}", styles['Normal']))
        story.append(Spacer(1, 12))
    story.append(Paragraph(f"Date of Issue: {current_date.strftime('%d-%m-%Y')}", styles['Normal']))
    story.append(Spacer(1, 12))
    story.append(Paragraph(f"Valid Until: {expiry_date.strftime('%d-%m-%Y')}", styles['Normal']))
    story.append(Spacer(1, 24))
    story.append(Paragraph("This certificate is computer-generated and does not require a physical signature.", styles['Italic']))
    doc.build(story)
    return buffer.getvalue()

def process_certificate(application_id, certificate_type):
    print(f"Processing {certificate_type} certificate for Application ID: {application_id}")
    try:
        db = create_connection()
        if db is None:
            raise Exception("Failed to establish database connection")
        cursor = db.cursor(dictionary=True)
        user_data = fetch_data(cursor, certificate_type, application_id)
        aadhaar_id = user_data['aadhar']
        if certificate_type == 'community':
            parent_community_pdf_data = user_data['communityCertificateParents']
            parent_community_text = extract_text_from_pdf(parent_community_pdf_data)
            community, caste = extract_community_details(parent_community_text)
            details = {'Community': community, 'Caste': caste}
            table_name = "government_community"
            id_column = "community_id"
            pdf_column = "community_pdf"
        elif certificate_type == 'income':
            salary_pdf_data = user_data['monthlySalaryCertificate']
            salary_text = extract_text_from_pdf(salary_pdf_data)
            annual_income = extract_salary_from_pdf(salary_text) * 12
            formatted_income = format_indian_currency(annual_income)
            details = {'Annual Income': f"Rs. {formatted_income}"}
            table_name = "government_salary"
            id_column = "salary_id"
            pdf_column = "salary_pdf"
        else:
            raise ValueError(f"Unsupported certificate type: {certificate_type}")
        certificate_id = generate_unique_id(aadhaar_id)
        pdf_data = generate_certificate(user_data['applicantName'], details, certificate_type, certificate_id)
        save_pdf_to_database(cursor, table_name, id_column, pdf_column, certificate_id, pdf_data)
        db.commit()
        print(f"{certificate_type.capitalize()} certificate saved to database with ID: {certificate_id}")
        return certificate_id

    except mysql.connector.Error as err:
        print(f"Database Error: {err}")
        return None
    except Exception as e:
        print(f"Error: {str(e)}")
        traceback.print_exc()
        return None
    finally:
        if 'cursor' in locals():
            cursor.close()
        if 'db' in locals() and db.is_connected():
            db.close()

if __name__ == "__main__":
    if len(sys.argv) != 3:
        print("Usage: python generate.py <application_id> <certificate_type>")
        sys.exit(1)
    application_id = sys.argv[1]
    certificate_type = sys.argv[2].lower()
    result = process_certificate(application_id, certificate_type)
    if result:
        print(result)  
    else:
        print(f"Failed to generate {certificate_type} certificate", file=sys.stderr)
        sys.exit(1)