import requests
import sys
import json
from datetime import datetime, timezone
import uuid
import time
import threading
import concurrent.futures
from typing import List, Dict, Any

class ComprehensiveCrossPlatformAPITester:
    def __init__(self, base_url="https://shipment-dash-1.preview.emergentagent.com/api"):
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
        # Use timestamp to ensure unique phone (Turkish format: +905XXXXXXXXX - 10 digits after +90)
        import time
        timestamp = str(int(time.time()))[-9:]  # Last 9 digits after the "5"
        test_data = {
            "phone": f"+905{timestamp}",  # Turkish format: +905XXXXXXXXX (10 digits total)
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
    def __init__(self, base_url="https://shipment-dash-1.preview.emergentagent.com/api"):
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

def test_yatan_tutar_integration():
    """Comprehensive test suite for yatan_tutar field integration"""
    print("🚀 Starting Yatan Tutar Field Integration Tests...")
    
    nakliye_tester = NakliyeAPITester()
    print(f"Backend URL: {nakliye_tester.base_url}")
    
    all_tests_passed = True
    created_record_ids = []
    
    try:
        print("\n" + "="*70)
        print("💰 YATAN TUTAR FIELD INTEGRATION TESTS")
        print("="*70)
        
        # Test 1: CRUD Operations with Yatan Tutar Field
        print("\n📝 CRUD OPERATIONS WITH YATAN TUTAR FIELD")
        
        # Test 1a: POST /api/nakliye - Create new records with yatan_tutar field
        test_records = [
            {
                "tarih": "2024-01-15T10:30:00Z",
                "sira_no": "YT001",
                "kod": "TEST001",
                "musteri": "Ahmet Yılmaz Transport",
                "irsaliye_no": "IRS-2024-001",
                "ithalat": True,
                "ihracat": False,
                "bos": False,
                "bos_tasima": 150.0,
                "reefer": 200.0,
                "bekleme": 50.0,
                "geceleme": 100.0,
                "pazar": 75.0,
                "harcirah": 125.0,
                "toplam": 700.0,
                "sistem": 650.0,
                "yatan_tutar": 50.0  # New field with positive value
            },
            {
                "tarih": "2024-01-16T14:45:00Z",
                "sira_no": "YT002",
                "kod": "TEST002",
                "musteri": "Mehmet Kaya Lojistik",
                "irsaliye_no": "IRS-2024-002",
                "ithalat": False,
                "ihracat": True,
                "bos": False,
                "bos_tasima": 300.0,
                "reefer": 0.0,
                "bekleme": 25.0,
                "geceleme": 0.0,
                "pazar": 0.0,
                "harcirah": 200.0,
                "toplam": 525.0,
                "sistem": 500.0,
                "yatan_tutar": 25.5  # New field with decimal value
            },
            {
                "tarih": "2024-01-17T09:15:00Z",
                "sira_no": "YT003",
                "kod": "TEST003",
                "musteri": "Fatma Demir Nakliyat",
                "irsaliye_no": "IRS-2024-003",
                "ithalat": False,
                "ihracat": False,
                "bos": True,
                "bos_tasima": 100.0,
                "reefer": 0.0,
                "bekleme": 0.0,
                "geceleme": 0.0,
                "pazar": 0.0,
                "harcirah": 50.0,
                "toplam": 150.0,
                "sistem": 150.0,
                "yatan_tutar": 0.0  # New field with zero value
            }
        ]
        
        for i, record in enumerate(test_records):
            print(f"\n🔸 Creating test record {i+1} with yatan_tutar: {record['yatan_tutar']}")
            record_id = nakliye_tester.test_create_nakliye(record)
            if record_id:
                created_record_ids.append(record_id)
                print(f"   ✅ Created record with ID: {record_id}")
            else:
                print(f"   ❌ Failed to create record {i+1}")
                all_tests_passed = False
        
        # Test 1b: GET /api/nakliye - Verify yatan_tutar field returned in response
        print("\n📋 GET OPERATIONS - VERIFY YATAN TUTAR IN RESPONSES")
        nakliye_list = nakliye_tester.test_get_nakliye_list()
        if nakliye_list:
            print(f"   📊 Retrieved {len(nakliye_list)} records")
            yatan_tutar_found = 0
            for record in nakliye_list:
                if 'yatan_tutar' in record:
                    yatan_tutar_found += 1
                    print(f"   ✅ Record {record.get('sira_no', 'N/A')} has yatan_tutar: {record['yatan_tutar']}")
                else:
                    print(f"   ❌ Record {record.get('sira_no', 'N/A')} missing yatan_tutar field")
                    all_tests_passed = False
            print(f"   📈 Found yatan_tutar field in {yatan_tutar_found}/{len(nakliye_list)} records")
        else:
            print("   ❌ Failed to retrieve nakliye list")
            all_tests_passed = False
        
        # Test 1c: GET /api/nakliye/{id} - Individual record retrieval
        print("\n🔍 INDIVIDUAL RECORD RETRIEVAL")
        for record_id in created_record_ids[:2]:  # Test first 2 records
            success, record = nakliye_tester.test_get_nakliye_by_id(record_id)
            if success and record:
                if 'yatan_tutar' in record:
                    print(f"   ✅ Record {record_id} has yatan_tutar: {record['yatan_tutar']}")
                else:
                    print(f"   ❌ Record {record_id} missing yatan_tutar field")
                    all_tests_passed = False
            else:
                print(f"   ❌ Failed to retrieve record {record_id}")
                all_tests_passed = False
        
        # Test 1d: PUT /api/nakliye/{id} - Update records including yatan_tutar field
        print("\n✏️ UPDATE OPERATIONS WITH YATAN TUTAR")
        if created_record_ids:
            update_tests = [
                {"yatan_tutar": 75.25, "musteri": "Updated Ahmet Yılmaz Transport"},
                {"yatan_tutar": 0.0, "toplam": 600.0},
                {"yatan_tutar": 150.75, "sistem": 800.0, "harcirah": 175.0}
            ]
            
            for i, update_data in enumerate(update_tests):
                if i < len(created_record_ids):
                    record_id = created_record_ids[i]
                    print(f"   🔸 Updating record {record_id} with yatan_tutar: {update_data['yatan_tutar']}")
                    success, updated_record = nakliye_tester.test_update_nakliye(record_id, update_data)
                    if success and updated_record:
                        if updated_record.get('yatan_tutar') == update_data['yatan_tutar']:
                            print(f"   ✅ Successfully updated yatan_tutar to {update_data['yatan_tutar']}")
                        else:
                            print(f"   ❌ yatan_tutar not updated correctly. Expected: {update_data['yatan_tutar']}, Got: {updated_record.get('yatan_tutar')}")
                            all_tests_passed = False
                    else:
                        print(f"   ❌ Failed to update record {record_id}")
                        all_tests_passed = False
        
        # Test 2: Data Validation Tests
        print("\n🔍 DATA VALIDATION TESTS")
        
        # Test 2a: Valid yatan_tutar values
        print("\n   📊 Testing valid yatan_tutar values")
        valid_test_cases = [
            {"yatan_tutar": 0, "description": "zero value"},
            {"yatan_tutar": 100.50, "description": "positive decimal"},
            {"yatan_tutar": 1000, "description": "positive integer"},
            {"yatan_tutar": 0.01, "description": "small decimal"}
        ]
        
        for case in valid_test_cases:
            test_record = {
                "tarih": "2024-01-18T12:00:00Z",
                "sira_no": f"VAL{case['yatan_tutar']}",
                "musteri": f"Validation Test {case['description']}",
                "irsaliye_no": f"VAL-{case['yatan_tutar']}",
                "toplam": 500.0,
                "sistem": 450.0,
                "yatan_tutar": case['yatan_tutar']
            }
            print(f"   🔸 Testing {case['description']}: {case['yatan_tutar']}")
            record_id = nakliye_tester.test_create_nakliye(test_record)
            if record_id:
                created_record_ids.append(record_id)
                print(f"   ✅ Valid value accepted: {case['yatan_tutar']}")
            else:
                print(f"   ❌ Valid value rejected: {case['yatan_tutar']}")
                all_tests_passed = False
        
        # Test 2b: Missing yatan_tutar (should default to 0.0)
        print("\n   📊 Testing missing yatan_tutar field (should default to 0.0)")
        test_record_no_yatan = {
            "tarih": "2024-01-19T12:00:00Z",
            "sira_no": "NO_YATAN",
            "musteri": "Test Missing Yatan Tutar",
            "irsaliye_no": "NO-YATAN-001",
            "toplam": 300.0,
            "sistem": 300.0
            # yatan_tutar intentionally omitted
        }
        
        record_id = nakliye_tester.test_create_nakliye(test_record_no_yatan)
        if record_id:
            created_record_ids.append(record_id)
            # Verify the record has default yatan_tutar
            success, record = nakliye_tester.test_get_nakliye_by_id(record_id)
            if success and record:
                yatan_tutar_value = record.get('yatan_tutar', 'MISSING')
                if yatan_tutar_value == 0.0:
                    print(f"   ✅ Missing yatan_tutar defaulted to 0.0")
                else:
                    print(f"   ❌ Missing yatan_tutar not defaulted correctly. Got: {yatan_tutar_value}")
                    all_tests_passed = False
            else:
                print(f"   ❌ Failed to retrieve record to verify default")
                all_tests_passed = False
        else:
            print(f"   ❌ Failed to create record without yatan_tutar")
            all_tests_passed = False
        
        # Test 3: Search Functionality
        print("\n🔍 SEARCH FUNCTIONALITY WITH YATAN TUTAR")
        
        # Test 3a: Search by customer name (should still work with new field)
        search_queries = ["Ahmet", "Mehmet", "Transport", "Lojistik"]
        for query in search_queries:
            print(f"   🔸 Searching for: '{query}'")
            success, search_results = nakliye_tester.test_search_nakliye(query)
            if success:
                print(f"   ✅ Search returned {len(search_results)} results")
                # Verify yatan_tutar field is present in search results
                for result in search_results:
                    if 'yatan_tutar' not in result:
                        print(f"   ❌ Search result missing yatan_tutar field")
                        all_tests_passed = False
                        break
                else:
                    print(f"   ✅ All search results contain yatan_tutar field")
            else:
                print(f"   ❌ Search failed for query: '{query}'")
                all_tests_passed = False
        
        # Test 4: Backward Compatibility
        print("\n🔄 BACKWARD COMPATIBILITY TESTS")
        
        # Test 4a: Verify API responses include new field with appropriate defaults
        print("   📊 Verifying all API responses include yatan_tutar field")
        all_records = nakliye_tester.test_get_nakliye_list()
        if all_records:
            missing_yatan_tutar = 0
            for record in all_records:
                if 'yatan_tutar' not in record:
                    missing_yatan_tutar += 1
            
            if missing_yatan_tutar == 0:
                print(f"   ✅ All {len(all_records)} records have yatan_tutar field")
            else:
                print(f"   ❌ {missing_yatan_tutar}/{len(all_records)} records missing yatan_tutar field")
                all_tests_passed = False
        else:
            print("   ❌ Failed to retrieve records for compatibility check")
            all_tests_passed = False
        
        # Test 5: Model Validation
        print("\n🏗️ MODEL VALIDATION TESTS")
        
        # Test 5a: Verify MongoDB serialization/deserialization
        print("   📊 Testing MongoDB serialization/deserialization")
        if created_record_ids:
            test_record_id = created_record_ids[0]
            success, record = nakliye_tester.test_get_nakliye_by_id(test_record_id)
            if success and record:
                # Check that yatan_tutar is properly serialized as float
                yatan_tutar = record.get('yatan_tutar')
                if isinstance(yatan_tutar, (int, float)):
                    print(f"   ✅ yatan_tutar properly serialized as numeric: {yatan_tutar} ({type(yatan_tutar).__name__})")
                else:
                    print(f"   ❌ yatan_tutar not properly serialized. Type: {type(yatan_tutar)}, Value: {yatan_tutar}")
                    all_tests_passed = False
            else:
                print("   ❌ Failed to retrieve record for serialization test")
                all_tests_passed = False
        
        # Test 6: DELETE operations (ensure they still work)
        print("\n🗑️ DELETE OPERATIONS TEST")
        if created_record_ids:
            # Test deleting one record to ensure delete still works
            test_delete_id = created_record_ids[-1]  # Delete the last created record
            print(f"   🔸 Testing delete operation on record: {test_delete_id}")
            success = nakliye_tester.test_delete_nakliye(test_delete_id)
            if success:
                print(f"   ✅ Successfully deleted record with yatan_tutar field")
                created_record_ids.remove(test_delete_id)  # Remove from cleanup list
            else:
                print(f"   ❌ Failed to delete record with yatan_tutar field")
                all_tests_passed = False
        
        # Print test summary
        print(f"\n📊 Yatan Tutar Integration Test Results:")
        print(f"   Tests Run: {nakliye_tester.tests_run}")
        print(f"   Tests Passed: {nakliye_tester.tests_passed}")
        print(f"   Success Rate: {(nakliye_tester.tests_passed/nakliye_tester.tests_run)*100:.1f}%")
        
        if nakliye_tester.tests_passed == nakliye_tester.tests_run and all_tests_passed:
            print("🎉 All yatan_tutar integration tests passed!")
        else:
            print("❌ Some yatan_tutar integration tests failed!")
            all_tests_passed = False
        
    except Exception as e:
        print(f"❌ Yatan tutar test suite failed with error: {str(e)}")
        all_tests_passed = False
    
    finally:
        # Cleanup created records
        if created_record_ids:
            print(f"\n🧹 Cleaning up {len(created_record_ids)} test records...")
            for record_id in created_record_ids:
                try:
                    nakliye_tester.test_delete_nakliye(record_id)
                except:
                    pass
    
    return all_tests_passed

def main():
    """Main test runner focusing on yatan_tutar field integration"""
    print("🚀 Starting Arkas Lojistik Yatan Tutar Integration Tests...")
    
    # Run comprehensive yatan_tutar integration tests
    yatan_tutar_success = test_yatan_tutar_integration()
    
    # Final summary
    print("\n" + "="*70)
    print("📋 FINAL TEST SUMMARY")
    print("="*70)
    print(f"💰 Yatan Tutar Integration: {'✅ PASSED' if yatan_tutar_success else '❌ FAILED'}")
    
    if yatan_tutar_success:
        print("\n🎉 YATAN TUTAR INTEGRATION WORKING CORRECTLY!")
        print("✅ All CRUD operations support yatan_tutar field")
        print("✅ Data validation working properly")
        print("✅ Search functionality maintained")
        print("✅ Backward compatibility ensured")
        print("✅ Model serialization/deserialization working")
        return 0
    else:
        print("\n❌ YATAN TUTAR INTEGRATION TESTS FAILED - CHECK LOGS ABOVE")
        return 1

if __name__ == "__main__":
    sys.exit(main())