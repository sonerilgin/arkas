import requests
import sys
import json
from datetime import datetime, timezone
import uuid

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