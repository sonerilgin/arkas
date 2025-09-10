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
        test_data = {
            "email": "test@example.com",
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
        return success, response

    def test_register_phone(self):
        """Test user registration with phone"""
        test_data = {
            "phone": "+905551234567",
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
        return success, response

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

    def test_login_email(self):
        """Test login with email"""
        test_data = {
            "identifier": "test@example.com",
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

    def test_login_phone(self):
        """Test login with phone"""
        test_data = {
            "identifier": "+905551234567",
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
    # Setup
    tester = NakliyeAPITester()
    
    # Test data as specified in the requirements
    test_data = {
        "tarih": "2025-09-08T00:00:00Z",
        "sira_no": "24560",
        "musteri": "Test Müşteri A.Ş.",
        "irsaliye_no": "326800",
        "ithalat": True,
        "ihracat": False,
        "bos_tasima": 0.0,
        "reefer": 0.0,
        "bekleme": 200.0,
        "geceleme": 0.0,
        "pazar": 0.0,
        "harcirah": 750.5,
        "toplam": 950.5,
        "sistem": 950.5
    }

    print("🚀 Starting Nakliye API Tests...")
    print(f"Backend URL: {tester.base_url}")

    try:
        # Test 1: Root endpoint
        tester.test_root_endpoint()

        # Test 2: Create nakliye record
        created_id = tester.test_create_nakliye(test_data)
        if not created_id:
            print("❌ Cannot continue tests - record creation failed")
            return 1

        # Test 3: Get nakliye list
        nakliye_list = tester.test_get_nakliye_list()
        
        # Test 4: Get specific nakliye record
        success, retrieved_record = tester.test_get_nakliye_by_id(created_id)
        if success:
            print(f"   Retrieved record: {retrieved_record.get('musteri', 'N/A')}")

        # Test 5: Update nakliye record
        update_data = {
            "musteri": "Updated Test Müşteri A.Ş.",
            "bekleme": 300.0,
            "toplam": 1050.5
        }
        success, updated_record = tester.test_update_nakliye(created_id, update_data)
        if success:
            print(f"   Updated customer: {updated_record.get('musteri', 'N/A')}")

        # Test 6: Search functionality
        # Search by customer name
        tester.test_search_nakliye("Test Müşteri")
        
        # Search by sira_no
        tester.test_search_nakliye("24560")
        
        # Search by irsaliye_no
        tester.test_search_nakliye("326800")

        # Test 7: Delete nakliye record
        tester.test_delete_nakliye(created_id)

        # Test 8: Verify deletion (should return 404)
        success, _ = tester.run_test(
            "Verify Deletion (should fail)",
            "GET",
            f"nakliye/{created_id}",
            404
        )

    except Exception as e:
        print(f"❌ Test suite failed with error: {str(e)}")
        return 1

    finally:
        # Cleanup any remaining records
        tester.cleanup_created_records()

    # Print results
    print(f"\n📊 Test Results:")
    print(f"   Tests Run: {tester.tests_run}")
    print(f"   Tests Passed: {tester.tests_passed}")
    print(f"   Success Rate: {(tester.tests_passed/tester.tests_run)*100:.1f}%")
    
    if tester.tests_passed == tester.tests_run:
        print("🎉 All tests passed!")
        return 0
    else:
        print("❌ Some tests failed!")
        return 1

if __name__ == "__main__":
    sys.exit(main())