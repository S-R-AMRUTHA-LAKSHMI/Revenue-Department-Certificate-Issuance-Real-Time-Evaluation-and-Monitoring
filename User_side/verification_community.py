import mysql.connector
from mysql.connector import Error
import pdfplumber
import re
import io
import magic
import sys

def is_pdf(data):
    """Check if the data is a PDF by MIME type."""
    mime = magic.Magic(mime=True)
    file_type = mime.from_buffer(data)
    return file_type == 'application/pdf'

def blob_to_pdf(blob_data):
    """Convert BLOB data to PDF format."""
    return io.BytesIO(blob_data)

def extract_text_from_pdf(pdf_data):
    """Extract text from PDF data."""
    try:
        if not pdf_data:
            print("No PDF data provided.")
            return None

        if not is_pdf(pdf_data):
            print("The provided data is not a PDF.")
            return None

        pdf_stream = blob_to_pdf(pdf_data)
        with pdfplumber.open(pdf_stream) as pdf:
            text = "".join(page.extract_text() for page in pdf.pages)
            if not text.strip():
                print("No text extracted from the PDF. The PDF might be empty or contain only images.")
            return text
    except Exception as e:
        print(f"Error extracting text from PDF: {e}")
        return None

def compare_pdfs(pdf1_data, pdf2_data):
    """Compare two PDF blobs."""
    return pdf1_data == pdf2_data

def extract_id_from_pdf(pdf_data, pattern, file_column):
    """Extract an ID based on a regex pattern from the PDF."""
    text = extract_text_from_pdf(pdf_data)
    if text:
        if file_column == "rationCardFile":
            # Special handling for rationCardFile
            match = re.search(r"Smart card\s*\n*id:\s*(\d+)", text, re.IGNORECASE | re.MULTILINE)
        else:
            match = re.search(pattern, text, re.IGNORECASE)
        
        if match:
            return match.group(1)
        else:
            print(f"No match found for pattern in {file_column}")
    else:
        print(f"No text extracted from {file_column}")
    return None

def extract_name_from_pdf(pdf_data, name_pattern, file_column):
    """Extract a name from the PDF using a regex pattern."""
    text = extract_text_from_pdf(pdf_data)
    if text:
        if file_column == "rationCardFile":
            # Special handling for rationCardFile
            match = re.search(r"Smart card\s*\n*id:.*\n*name:\s*(.+)", text, re.IGNORECASE | re.MULTILINE)
        else:
            match = re.search(name_pattern, text, re.IGNORECASE)
        
        if match:
            return match.group(1).strip().lower()  # Convert to lowercase
        else:
            print(f"No match found for name pattern in {file_column}")
    else:
        print(f"No text extracted from {file_column}")
    return None


def verify_aadhaar(connection, user_id):
    """Verify Aadhaar by comparing user and government Aadhaar PDF BLOBs."""
    try:
        cursor = connection.cursor(buffered=True)

        # Fetch the user Aadhaar PDF BLOB from the community table
        cursor.execute("SELECT applicantAadhar FROM community WHERE aadhar = %s", (user_id,))
        result = cursor.fetchone()
        if not result:
            print(f"No record found for user {user_id} in community table.")
            return False

        user_aadhaar_pdf_data = result[0]  # PDF BLOB data
        if not user_aadhaar_pdf_data or not is_pdf(user_aadhaar_pdf_data):
            print("Aadhaar PDF is empty or not a valid PDF in community table.")
            return False
        
        print("User Aadhaar PDF retrieved successfully and confirmed as PDF.")

        # Fetch government Aadhaar PDF BLOB from the government_aadhaar table
        cursor.execute("SELECT aadhaar_pdf FROM government_aadhaar WHERE aadhaar_id = %s", (user_id,))
        result = cursor.fetchone()
        if not result:
            print("Aadhaar PDF not found in government_aadhaar table.")
            return False

        gov_aadhaar_pdf_data = result[0]  # PDF BLOB data
        if not gov_aadhaar_pdf_data or not is_pdf(gov_aadhaar_pdf_data):
            print("Aadhaar PDF is empty or not a valid PDF in government_aadhaar table.")
            return False
        
        print("Government Aadhaar PDF retrieved successfully and confirmed as PDF.")

        # Compare Aadhaar PDFs (BLOB comparison)
        if compare_pdfs(user_aadhaar_pdf_data, gov_aadhaar_pdf_data):
            print("Aadhaar verification successful.")
            return True
        else:
            print("Aadhaar verification failed.")
            return False

    except Error as e:
        print(f"Error verifying Aadhaar: {e}")
        return False

def verify_certificate(connection, user_id, file_column, gov_table, gov_id_column, gov_pdf_column, id_pattern, name_pattern):
    """Verify certificate by comparing user and government PDF BLOBs."""
    try:
        cursor = connection.cursor(buffered=True)

        # Fetch the user PDF as BLOB from the community table
        cursor.execute(f"SELECT {file_column} FROM community WHERE aadhar = %s", (user_id,))
        result = cursor.fetchone()
        if not result:
            print(f"No record found for user {user_id} in community table.")
            return False
        
        user_pdf_data = result[0]  # PDF BLOB data
        if not user_pdf_data or not is_pdf(user_pdf_data):
            print(f"{file_column} is empty or not a valid PDF in community table.")
            return False
        
        print(f"User {file_column} retrieved successfully and confirmed as PDF.")

        # Extract ID and name from user PDF
        extracted_id = extract_id_from_pdf(user_pdf_data, id_pattern, file_column)
        extracted_name = extract_name_from_pdf(user_pdf_data, name_pattern, file_column)
        
        if not extracted_id:
            print(f"ID not found in user {file_column}.")
            return False
        print(f"Extracted ID from {file_column}: {extracted_id}")
        print(f"Extracted Name from {file_column}: {extracted_name}")

        # Fetch government PDF as BLOB from the government table
        cursor.execute(f"SELECT {gov_pdf_column} FROM {gov_table} WHERE {gov_id_column} = %s", (extracted_id,))
        result = cursor.fetchone()
        if not result:
            print(f"Certificate not found in {gov_table} for ID {extracted_id}.")
            return False

        gov_pdf_data = result[0]  # PDF BLOB data
        if not gov_pdf_data or not is_pdf(gov_pdf_data):
            print(f"{gov_pdf_column} is empty or not a valid PDF in {gov_table}.")
            return False
        
        print(f"Government {file_column} retrieved successfully and confirmed as PDF.")

        # Compare PDFs (BLOB comparison)
        if compare_pdfs(user_pdf_data, gov_pdf_data):
            print(f"{file_column} verification successful.")
            return True
        else:
            print(f"{file_column} verification failed.")
            return False

    except Error as e:
        print(f"Error verifying {file_column}: {e}")
        return False

def verify_name_similarity(connection, user_id):
    """Verify name similarity across various documents."""
    try:
        cursor = connection.cursor(buffered=True)
        
        # Fetch relevant PDFs and database names
        cursor.execute("""
            SELECT transferCertificateApplicant, applicantAadhar, rationCardFile,
                   communityCertificateParents, transferCertificateParents,
                   applicantName, fatherOrHusbandName
            FROM community WHERE aadhar = %s
        """, (user_id,))
        result = cursor.fetchone()
        
        if not result:
            print("Required documents not found in community table.")
            return False, False

        tc_applicant, aadhaar, ration_card, comm_parents, tc_parents, db_applicant_name, db_parent_name = result

        # Extract names from PDFs (all converted to lowercase)
        applicant_name_tc = extract_name_from_pdf(tc_applicant, r"name:\s*(.+)", "transferCertificateApplicant")
        applicant_name_aadhaar = extract_name_from_pdf(aadhaar, r"name:\s*(.+)", "applicantAadhar")
        applicant_name_ration = extract_name_from_pdf(ration_card, r"name:\s*(.+)", "rationCardFile")

        parent_name_comm = extract_name_from_pdf(comm_parents, r"name:\s*(.+)", "communityCertificateParents")
        parent_name_tc = extract_name_from_pdf(tc_parents, r"name:\s*(.+)", "transferCertificateParents")

        # Convert database names to lowercase
        db_applicant_name = db_applicant_name.lower() if db_applicant_name else None
        db_parent_name = db_parent_name.lower() if db_parent_name else None

        # Check applicant name similarity (including database name)
        applicant_names = [name for name in [applicant_name_tc, applicant_name_aadhaar, applicant_name_ration, db_applicant_name] if name]
        applicant_names_match = len(set(applicant_names)) == 1 if applicant_names else False

        # Check parent name similarity (including database name)
        parent_names = [name for name in [parent_name_comm, parent_name_tc, db_parent_name] if name]
        parent_names_match = len(set(parent_names)) == 1 if parent_names else False

        print("\nName Similarity Verification:")
        print(f"Applicant Names Match: {'Yes' if applicant_names_match else 'No'}")
        print(f"Parent Names Match: {'Yes' if parent_names_match else 'No'}")

        return applicant_names_match, parent_names_match

    except Error as e:
        print(f"Error verifying name similarity: {e}")
        return False, False

def update_community_table(connection, user_id, verification_status, application_status):
    """Update the community table with the verification and application status."""
    try:
        cursor = connection.cursor()
        update_query = """
        UPDATE community 
        SET verificationStatus = %s, applicationStatus = %s 
        WHERE aadhar = %s
        """
        cursor.execute(update_query, (verification_status, application_status, user_id))
        connection.commit()
        print(f"Community table updated for user {user_id}: Verification Status: {verification_status}, Application Status: {application_status}")
    except Error as e:
        print(f"Error updating community table: {e}")

def main(user_id):
    try:
        # Establish database connection
        connection = mysql.connector.connect(
            host="localhost",
            user="root",
            password="amrutha@2811",
            database="certificate",
            port=3308
        )

        print(f"Starting verification process for user with Aadhar number: {user_id}")
        
        # Verify Aadhaar
        aadhaar_verified = verify_aadhaar(connection, user_id)
        
        # Verify other certificates with updated patterns
        tc_verified = verify_certificate(connection, user_id, "transferCertificateApplicant", "government_tc", "tc_id", "tc_pdf", r"Transfer Certificate\s+Id:\s*(\d+)", r"name:\s*(.+)")
        ration_verified = verify_certificate(connection, user_id, "rationCardFile", "government_ration_card", "ration_id", "ration_pdf", r"Smart card\s*\n*id:\s*(\d+)", r"name:\s*(.+)")
        community_verified = verify_certificate(connection, user_id, "communityCertificateParents", "government_community", "community_id", "community_pdf", r"Parents Community:\s+Id:\s*(\d+)", r"name:\s*(.+)")
        tc_parents_verified = verify_certificate(connection, user_id, "transferCertificateParents", "government_tc", "tc_id", "tc_pdf", r"Transfer Certificate\s+Id:\s*(\d+)", r"name:\s*(.+)")
        
        # Verify name similarity
        applicant_name_match, parent_name_match = verify_name_similarity(connection, user_id)
        
        # Determine overall verification status
        all_verified = aadhaar_verified and tc_verified and ration_verified and community_verified and tc_parents_verified and applicant_name_match and parent_name_match
        verification_status = "Verified" if all_verified else "Not Verified"
        application_status = "pending" if all_verified else "Rejected"
        
        # Update community table
        update_community_table(connection, user_id, verification_status, application_status)
        
        print(f"\nFinal Verification Status: {verification_status}")
        print(f"Application Status: {application_status}")

    except Error as e:
        print(f"Error: {e}")
    finally:
        if connection.is_connected():
            connection.close()
            print("Database connection closed.")

if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("Usage: python script_name.py <aadhar_number>")
        sys.exit(1)
    
    aadhar_number = sys.argv[1]
    main(aadhar_number)