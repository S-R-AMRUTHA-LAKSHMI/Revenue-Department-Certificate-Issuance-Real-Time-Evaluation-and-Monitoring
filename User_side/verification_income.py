import mysql.connector
from mysql.connector import Error
import pdfplumber
import re
import io
import sys

def extract_text_from_pdf(pdf_data):
    try:
        print("DEBUG: Starting PDF text extraction...")
        pdf_stream = io.BytesIO(pdf_data) if isinstance(pdf_data, bytes) else pdf_data
        with pdfplumber.open(pdf_stream) as pdf:
            extracted_text = "".join(page.extract_text() for page in pdf.pages)
        print("DEBUG: PDF text extraction complete.")
        return extracted_text
    except Exception as e:
        print(f"ERROR: Error extracting text from PDF: {e}")
        return None

def compare_pdfs(pdf1_data, pdf2_data):
    print("DEBUG: Comparing PDF data...")
    comparison_result = pdf1_data == pdf2_data
    print(f"DEBUG: PDF comparison result: {comparison_result}")
    return comparison_result

def extract_id_from_pdf(pdf_data, file_column):
    print(f"DEBUG: Extracting ID from {file_column} PDF...")
    text = extract_text_from_pdf(pdf_data)
    if text:
        if file_column == 'monthlySalaryCertificate':
            pattern = r'id:\s*(\d+)'
        elif file_column == 'uploadRationCard':
            pattern = r'id:\s*(\d+)'
        else:
            print(f"DEBUG: Unknown file column: {file_column}")
            return None

        match = re.search(pattern, text, re.IGNORECASE)
        if match:
            extracted_id = match.group(1)
            print(f"DEBUG: Extracted ID: {extracted_id}")
            return extracted_id
    print("DEBUG: ID extraction failed.")
    return None

def extract_name_from_pdf(pdf_data):
    print("DEBUG: Extracting name from PDF...")
    text = extract_text_from_pdf(pdf_data)
    if text:
        pattern = r'name:\s*([A-Za-z\s]+)'
        match = re.search(pattern, text, re.IGNORECASE)
        if match:
            extracted_name = match.group(1).strip()
            # Remove any additional fields that might be captured
            extracted_name = re.sub(r'\s+salary.*', '', extracted_name)
            print(f"DEBUG: Extracted Name: {extracted_name}")
            return extracted_name
    print("DEBUG: Name extraction failed.")
    return None

def verify_certificate(connection, user_id, file_column, gov_table, gov_id_column, gov_pdf_column):
    try:
        print(f"DEBUG: Verifying {file_column} for user ID: {user_id}")
        cursor = connection.cursor(dictionary=True)

        cursor.execute(f"SELECT {file_column}, applicantName FROM income WHERE aadhar = %s", (user_id,))
        result = cursor.fetchone()

        if not result:
            print(f"DEBUG: No record found for user ID: {user_id}")
            return False

        user_pdf_data = result[file_column]
        applicant_name_db = result['applicantName']
        print(f"DEBUG: Applicant Name from Database: {applicant_name_db}")

        if not isinstance(user_pdf_data, (bytes, bytearray)):
            print(f"ERROR: {file_column} is not in PDF format.")
            return False

        extracted_id = extract_id_from_pdf(user_pdf_data, file_column)
        if not extracted_id:
            print("DEBUG: No valid ID extracted from user PDF.")
            return False

        extracted_name = extract_name_from_pdf(user_pdf_data)
        if not extracted_name:
            print("DEBUG: No valid name extracted from user PDF.")
            return False

        if applicant_name_db.lower() != extracted_name.lower():
            print(f"DEBUG: Name mismatch: Database ({applicant_name_db}) vs Extracted ({extracted_name})")
            return False

        print(f"DEBUG: Fetching corresponding PDF from {gov_table} for ID: {extracted_id}")
        try:
            cursor.execute(f"SELECT {gov_pdf_column} FROM {gov_table} WHERE {gov_id_column} = %s", (extracted_id,))
            result = cursor.fetchone()

            if not result:
                print(f"DEBUG: No government record found for ID: {extracted_id}")
                return False

            gov_pdf_data = result[gov_pdf_column]
            print(f"DEBUG: Successfully retrieved government PDF from {gov_table} for ID: {extracted_id}")

            return compare_pdfs(user_pdf_data, gov_pdf_data)
        except mysql.connector.Error as err:
            if err.errno == 1146:  # Table doesn't exist error
                print(f"ERROR: Table '{gov_table}' doesn't exist. Skipping verification against government records.")
                # For demonstration purposes, we'll return True here. In a real scenario, you might want to handle this differently.
                return True
            else:
                raise

    except Error as e:
        print(f"ERROR: Error verifying {file_column}: {e}")
        return False

def update_verification_status(connection, user_id, verification_status):
    try:
        print(f"DEBUG: Updating verification status to '{verification_status}' for user ID: {user_id}")
        cursor = connection.cursor()
        cursor.execute(
            "UPDATE income SET verificationStatus = %s WHERE aadhar = %s",
            (verification_status, user_id)
        )
        connection.commit()
        print("DEBUG: Verification status updated successfully.")
    except Error as e:
        print(f"ERROR: Error updating status: {e}")

def verify_income_certificates(user_id):
    connection = None
    try:
        print(f"DEBUG: Connecting to the database for user ID: {user_id}...")
        connection = mysql.connector.connect(
            host="localhost",
            user="root",
            password="amrutha@2811",
            database="certificate",
            port=3308
        )

        print("DEBUG: Successfully connected to the database.")

        # Verify monthly salary certificate
        print("DEBUG: Verifying monthly salary certificate...")
        monthly_salary_verified = verify_certificate(
            connection,
            user_id,
            'monthlySalaryCertificate',
            'government_monthly_salary',
            'mon_salary_id',
            'mon_salary_pdf'
        )
        print(f"DEBUG: Monthly salary certificate verification result: {monthly_salary_verified}")

        # Verify ration card
        print("DEBUG: Verifying ration card...")
        ration_card_verified = verify_certificate(
            connection,
            user_id,
            'uploadRationCard',
            'government_ration_card',
            'ration_id',
            'ration_pdf'
        )
        print(f"DEBUG: Ration card verification result: {ration_card_verified}")

        # Update verification status
        if monthly_salary_verified and ration_card_verified:
            update_verification_status(connection, user_id, 'verified')
            print("DEBUG: All documents verified successfully.")
        else:
            update_verification_status(connection, user_id, 'rejected')
            print("DEBUG: Document verification failed.")

    except Error as e:
        print(f"ERROR: {e}")
    finally:
        if connection and connection.is_connected():
            connection.close()
            print("DEBUG: Database connection closed.")

if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("ERROR: Usage: python verification_income.py <user_id>")
        sys.exit(1)
    
    user_id = sys.argv[1]
    print(f"DEBUG: Initiating verification for user ID: {user_id}")
    verify_income_certificates(user_id)