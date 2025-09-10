import requests
import sys
import json
from datetime import datetime, timezone
import uuid
import time

class AuthAPITester:
    def __init__(self, base_url="https://arkas-logistics.preview.emergentagent.com/api"):
        self.base_url = base_url
        self.tests_run = 0
        self.tests_passed = 0
        self.access_token = None
        self.created_users = []
        self.verification_codes = {}  # Store codes from console output

    def run_test(self, name, method, endpoint, expected_status, data=None, params=None, headers=None):
        """Run a single API test"""
        url = f"{self.base_url}/{endpoint}"
        default_headers = {'Content-Type': 'application/json'}
        if headers:
            default_headers.update(headers)

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        print(f"   URL: {url}")
        if data:
            print(f"   Data: {json.dumps(data, indent=2)}")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=default_headers, params=params)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=default_headers)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=default_headers)
            elif method == 'DELETE':
                response = requests.delete(url, headers=default_headers)

            print(f"   Status Code: {response.status_code}")
            
            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Expected {expected_status}, got {response.status_code}")
                try:
                    response_data = response.json()
                    print(f"   Response: {json.dumps(response_data, indent=2)}")
                    return True, response_data
                except:
                    return True, {}
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                try:
                    error_detail = response.json()
                    print(f"   Error: {json.dumps(error_detail, indent=2)}")
                except:
                    print(f"   Error: {response.text}")
                return False, {}

        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            return False, {}

    def test_register_email(self):
        """Test user registration with email"""
        # Use timestamp to ensure unique email
        import time
        timestamp = str(int(time.time()))
        test_data = {
            "email": f"test{timestamp}@example.com",
            "password": "test123",
            "full_name": "Test User"
        }
        success, response = self.run_test(
            "Register User with Email",
            "POST",
            "auth/register",
            200,
            data=test_data
        )
        if success:
            self.created_users.append(test_data["email"])
        return success, response, test_data["email"]

    def test_register_phone(self):
        """Test user registration with phone"""
        # Use timestamp to ensure unique phone
        import time
        timestamp = str(int(time.time()))[-4:]  # Last 4 digits
        test_data = {
            "phone": f"+9055512{timestamp}",
            "password": "test123",
            "full_name": "Test User Phone"
        }
        success, response = self.run_test(
            "Register User with Phone",
            "POST",
            "auth/register",
            200,
            data=test_data
        )
        if success:
            self.created_users.append(test_data["phone"])
        return success, response, test_data["phone"]

    def test_register_duplicate(self):
        """Test duplicate registration (should fail)"""
        test_data = {
            "email": "test@example.com",
            "password": "test123",
            "full_name": "Test User Duplicate"
        }
        success, response = self.run_test(
            "Register Duplicate User (should fail)",
            "POST",
            "auth/register",
            400,
            data=test_data
        )
        return success, response

    def test_register_invalid_email(self):
        """Test registration with invalid email"""
        test_data = {
            "email": "invalid-email",
            "password": "test123",
            "full_name": "Test User Invalid"
        }
        success, response = self.run_test(
            "Register with Invalid Email (should fail)",
            "POST",
            "auth/register",
            400,
            data=test_data
        )
        return success, response

    def test_verify_user(self, identifier, code):
        """Test user verification"""
        test_data = {
            "identifier": identifier,
            "code": code
        }
        success, response = self.run_test(
            f"Verify User ({identifier})",
            "POST",
            "auth/verify",
            200,
            data=test_data
        )
        return success, response

    def test_verify_invalid_code(self, identifier):
        """Test verification with invalid code"""
        test_data = {
            "identifier": identifier,
            "code": "000000"
        }
        success, response = self.run_test(
            f"Verify with Invalid Code (should fail)",
            "POST",
            "auth/verify",
            400,
            data=test_data
        )
        return success, response

    def test_login_email(self, email):
        """Test login with email"""
        test_data = {
            "identifier": email,
            "password": "test123"
        }
        success, response = self.run_test(
            "Login with Email",
            "POST",
            "auth/login",
            200,
            data=test_data
        )
        if success and 'access_token' in response:
            self.access_token = response['access_token']
            print(f"   🔑 Access token obtained: {self.access_token[:20]}...")
        return success, response

    def test_login_phone(self, phone):
        """Test login with phone"""
        test_data = {
            "identifier": phone,
            "password": "test123"
        }
        success, response = self.run_test(
            "Login with Phone",
            "POST",
            "auth/login",
            200,
            data=test_data
        )
        return success, response

    def test_login_invalid_credentials(self):
        """Test login with invalid credentials"""
        test_data = {
            "identifier": "test@example.com",
            "password": "wrongpassword"
        }
        success, response = self.run_test(
            "Login with Invalid Password (should fail)",
            "POST",
            "auth/login",
            401,
            data=test_data
        )
        return success, response

    def test_login_unverified_user(self):
        """Test login with unverified user"""
        # First register a new user
        register_data = {
            "email": "unverified@example.com",
            "password": "test123",
            "full_name": "Unverified User"
        }
        self.run_test("Register Unverified User", "POST", "auth/register", 200, data=register_data)
        
        # Try to login without verification
        login_data = {
            "identifier": "unverified@example.com",
            "password": "test123"
        }
        success, response = self.run_test(
            "Login Unverified User (should fail)",
            "POST",
            "auth/login",
            401,
            data=login_data
        )
        return success, response

    def test_get_user_info(self):
        """Test getting current user info with token"""
        if not self.access_token:
            print("❌ No access token available for user info test")
            return False, {}
        
        headers = {"Authorization": f"Bearer {self.access_token}"}
        success, response = self.run_test(
            "Get Current User Info",
            "GET",
            "auth/me",
            200,
            headers=headers
        )
        return success, response

    def test_get_user_info_invalid_token(self):
        """Test getting user info with invalid token"""
        headers = {"Authorization": "Bearer invalid_token_here"}
        success, response = self.run_test(
            "Get User Info with Invalid Token (should fail)",
            "GET",
            "auth/me",
            401,
            headers=headers
        )
        return success, response

    def test_forgot_password(self, identifier):
        """Test forgot password"""
        test_data = {
            "identifier": identifier
        }
        success, response = self.run_test(
            f"Forgot Password ({identifier})",
            "POST",
            "auth/forgot-password",
            200,
            data=test_data
        )
        return success, response

    def test_reset_password(self, identifier, code):
        """Test password reset"""
        test_data = {
            "identifier": identifier,
            "code": code,
            "new_password": "newpass123"
        }
        success, response = self.run_test(
            f"Reset Password ({identifier})",
            "POST",
            "auth/reset-password",
            200,
            data=test_data
        )
        return success, response

    def test_reset_password_invalid_code(self, identifier):
        """Test password reset with invalid code"""
        test_data = {
            "identifier": identifier,
            "code": "000000",
            "new_password": "newpass123"
        }
        success, response = self.run_test(
            f"Reset Password with Invalid Code (should fail)",
            "POST",
            "auth/reset-password",
            400,
            data=test_data
        )
        return success, response

    def print_summary(self):
        """Print test summary"""
        print(f"\n📊 Authentication Test Results:")
        print(f"   Tests Run: {self.tests_run}")
        print(f"   Tests Passed: {self.tests_passed}")
        print(f"   Success Rate: {(self.tests_passed/self.tests_run)*100:.1f}%")
        
        if self.tests_passed == self.tests_run:
            print("🎉 All authentication tests passed!")
            return True
        else:
            print("❌ Some authentication tests failed!")
            return False

class NakliyeAPITester:
    def __init__(self, base_url="https://arkas-logistics.preview.emergentagent.com/api"):
        self.base_url = base_url
        self.tests_run = 0
        self.tests_passed = 0
        self.created_records = []

    def run_test(self, name, method, endpoint, expected_status, data=None, params=None):
        """Run a single API test"""
        url = f"{self.base_url}/{endpoint}"
        headers = {'Content-Type': 'application/json'}

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        print(f"   URL: {url}")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, params=params)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=headers)
            elif method == 'DELETE':
                response = requests.delete(url, headers=headers)

            print(f"   Status Code: {response.status_code}")
            
            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Expected {expected_status}, got {response.status_code}")
                try:
                    response_data = response.json()
                    if method == 'POST' and 'id' in response_data:
                        self.created_records.append(response_data['id'])
                    return True, response_data
                except:
                    return True, {}
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                try:
                    error_detail = response.json()
                    print(f"   Error: {error_detail}")
                except:
                    print(f"   Error: {response.text}")
                return False, {}

        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            return False, {}

    def test_root_endpoint(self):
        """Test root API endpoint"""
        return self.run_test("Root API Endpoint", "GET", "", 200)

    def test_create_nakliye(self, test_data):
        """Test creating a new nakliye record"""
        success, response = self.run_test(
            "Create Nakliye Record",
            "POST",
            "nakliye",
            200,
            data=test_data
        )
        return response.get('id') if success else None

    def test_get_nakliye_list(self):
        """Test getting nakliye list"""
        success, response = self.run_test(
            "Get Nakliye List",
            "GET",
            "nakliye",
            200
        )
        return response if success else []

    def test_get_nakliye_by_id(self, nakliye_id):
        """Test getting a specific nakliye record"""
        success, response = self.run_test(
            f"Get Nakliye by ID ({nakliye_id})",
            "GET",
            f"nakliye/{nakliye_id}",
            200
        )
        return success, response

    def test_update_nakliye(self, nakliye_id, update_data):
        """Test updating a nakliye record"""
        success, response = self.run_test(
            f"Update Nakliye ({nakliye_id})",
            "PUT",
            f"nakliye/{nakliye_id}",
            200,
            data=update_data
        )
        return success, response

    def test_search_nakliye(self, query):
        """Test searching nakliye records"""
        success, response = self.run_test(
            f"Search Nakliye ('{query}')",
            "GET",
            f"nakliye/search/{query}",
            200
        )
        return success, response

    def test_delete_nakliye(self, nakliye_id):
        """Test deleting a nakliye record"""
        success, response = self.run_test(
            f"Delete Nakliye ({nakliye_id})",
            "DELETE",
            f"nakliye/{nakliye_id}",
            200
        )
        return success

    def cleanup_created_records(self):
        """Clean up any records created during testing"""
        print(f"\n🧹 Cleaning up {len(self.created_records)} created records...")
        for record_id in self.created_records:
            try:
                self.test_delete_nakliye(record_id)
            except:
                pass

def main():
    print("🚀 Starting Arkas Lojistik Authentication API Tests...")
    
    # Setup authentication tester
    auth_tester = AuthAPITester()
    print(f"Backend URL: {auth_tester.base_url}")
    
    all_tests_passed = True
    
    try:
        print("\n" + "="*60)
        print("🔐 AUTHENTICATION SYSTEM TESTS")
        print("="*60)
        
        # Test 1: Register user with email
        print("\n📝 REGISTRATION TESTS")
        success, response, email = auth_tester.test_register_email()
        if not success:
            print("❌ Email registration failed - cannot continue with email tests")
            email = None
        
        # Test 2: Register user with phone
        success_phone, response_phone, phone = auth_tester.test_register_phone()
        if not success_phone:
            print("❌ Phone registration failed - cannot continue with phone tests")
            phone = None
        
        # Test 3: Test duplicate registration (use existing email)
        if email:
            test_data = {
                "email": email,
                "password": "test123",
                "full_name": "Test User Duplicate"
            }
            auth_tester.run_test(
                "Register Duplicate User (should fail)",
                "POST",
                "auth/register",
                400,
                data=test_data
            )
        
        # Test 4: Test invalid email registration (expect 422 from pydantic)
        auth_tester.run_test(
            "Register with Invalid Email (should fail)",
            "POST",
            "auth/register",
            422,  # Changed from 400 to 422 as pydantic returns 422
            data={
                "email": "invalid-email",
                "password": "test123",
                "full_name": "Test User Invalid"
            }
        )
        
        # Test 5: Test unverified user login (should fail)
        print("\n🔒 LOGIN TESTS (Unverified Users)")
        auth_tester.test_login_unverified_user()
        
        # IMPORTANT: Get verification codes from backend logs
        print("\n" + "⚠️ "*20)
        print("🔍 CHECKING BACKEND LOGS FOR VERIFICATION CODES")
        print("⚠️ "*20)
        
        # Get verification codes from backend logs
        import subprocess
        try:
            result = subprocess.run(['tail', '-n', '100', '/var/log/supervisor/backend.out.log'], 
                                  capture_output=True, text=True)
            log_output = result.stdout
            
            # Extract codes from logs
            email_code = None
            phone_code = None
            
            for line in log_output.split('\n'):
                if 'VERIFICATION EMAIL to test@example.com: Code =' in line:
                    email_code = line.split('Code = ')[-1].strip()
                elif 'VERIFICATION SMS to +905551234567: Code =' in line:
                    phone_code = line.split('Code = ')[-1].strip()
            
            if email_code:
                print(f"📧 Found EMAIL verification code: {email_code}")
            else:
                email_code = "123456"  # Fallback
                print(f"📧 Using fallback EMAIL code: {email_code}")
                
            if phone_code:
                print(f"📱 Found PHONE verification code: {phone_code}")
            else:
                phone_code = "654321"  # Fallback
                print(f"📱 Using fallback PHONE code: {phone_code}")
                
        except Exception as e:
            print(f"❌ Error reading logs: {e}")
            email_code = "123456"
            phone_code = "654321"
            print(f"Using fallback codes: email={email_code}, phone={phone_code}")
        
        # Test 6: Verify users
        print("\n✅ VERIFICATION TESTS")
        if success:
            auth_tester.test_verify_user("test@example.com", email_code)
            # Test invalid verification code
            auth_tester.test_verify_invalid_code("test@example.com")
        
        if success_phone:
            auth_tester.test_verify_user("+905551234567", phone_code)
        
        # Test 7: Login tests
        print("\n🔑 LOGIN TESTS (Verified Users)")
        login_success, _ = auth_tester.test_login_email()
        auth_tester.test_login_phone()
        auth_tester.test_login_invalid_credentials()
        
        # Test 8: Protected endpoint tests
        print("\n🛡️ PROTECTED ENDPOINT TESTS")
        if login_success:
            auth_tester.test_get_user_info()
        auth_tester.test_get_user_info_invalid_token()
        
        # Test 9: Password reset tests
        print("\n🔄 PASSWORD RESET TESTS")
        auth_tester.test_forgot_password("test@example.com")
        
        # Get reset code from logs
        try:
            result = subprocess.run(['tail', '-n', '50', '/var/log/supervisor/backend.out.log'], 
                                  capture_output=True, text=True)
            log_output = result.stdout
            
            reset_code = None
            for line in log_output.split('\n'):
                if 'PASSWORD RESET EMAIL to test@example.com: Code =' in line:
                    reset_code = line.split('Code = ')[-1].strip()
                    break
            
            if reset_code:
                print(f"🔄 Found PASSWORD RESET code: {reset_code}")
            else:
                reset_code = "789012"  # Fallback
                print(f"🔄 Using fallback RESET code: {reset_code}")
                
        except Exception as e:
            print(f"❌ Error reading reset code from logs: {e}")
            reset_code = "789012"
            print(f"Using fallback reset code: {reset_code}")
        
        auth_tester.test_reset_password("test@example.com", reset_code)
        auth_tester.test_reset_password_invalid_code("test@example.com")
        
        # Test 10: Login with new password
        print("\n🔐 LOGIN WITH NEW PASSWORD TEST")
        new_login_data = {
            "identifier": "test@example.com",
            "password": "newpass123"
        }
        auth_tester.run_test(
            "Login with New Password",
            "POST",
            "auth/login",
            200,
            data=new_login_data
        )
        
        # Print authentication test summary
        all_tests_passed = auth_tester.print_summary()
        
    except Exception as e:
        print(f"❌ Authentication test suite failed with error: {str(e)}")
        all_tests_passed = False
    
    # Also run basic nakliye tests to ensure system integration
    print("\n" + "="*60)
    print("📦 BASIC NAKLIYE SYSTEM INTEGRATION TEST")
    print("="*60)
    
    nakliye_tester = NakliyeAPITester()
    try:
        # Just test root endpoint to ensure nakliye system is working
        nakliye_tester.test_root_endpoint()
        nakliye_success = nakliye_tester.tests_passed == nakliye_tester.tests_run
    except Exception as e:
        print(f"❌ Nakliye integration test failed: {str(e)}")
        nakliye_success = False
    
    # Final summary
    print("\n" + "="*60)
    print("📋 FINAL TEST SUMMARY")
    print("="*60)
    print(f"🔐 Authentication Tests: {'✅ PASSED' if all_tests_passed else '❌ FAILED'}")
    print(f"📦 Nakliye Integration: {'✅ PASSED' if nakliye_success else '❌ FAILED'}")
    
    if all_tests_passed and nakliye_success:
        print("\n🎉 ALL SYSTEMS WORKING CORRECTLY!")
        return 0
    else:
        print("\n❌ SOME TESTS FAILED - CHECK LOGS ABOVE")
        return 1

if __name__ == "__main__":
    sys.exit(main())