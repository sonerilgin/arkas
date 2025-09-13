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
    """Comprehensive Cross-Platform Backend API Tester for Arkas Lojistik System"""
    
    def __init__(self, base_url="https://logistics-tracker-9.preview.emergentagent.com/api"):
        self.base_url = base_url
        self.tests_run = 0
        self.tests_passed = 0
        self.access_token = None
        self.created_nakliye_records = []
        self.created_yatan_tutar_records = []
        self.created_users = []
        self.test_results = {
            'api_consistency': [],
            'authentication': [],
            'data_validation': [],
            'error_handling': [],
            'performance': [],
            'mongodb_integration': [],
            'turkish_locale': [],
            'file_operations': []
        }

    def log_result(self, category: str, test_name: str, success: bool, details: str = ""):
        """Log test result to appropriate category"""
        self.test_results[category].append({
            'test': test_name,
            'success': success,
            'details': details,
            'timestamp': datetime.now().isoformat()
        })

    def run_test(self, name, method, endpoint, expected_status, data=None, params=None, headers=None, timeout=30):
        """Run a single API test with enhanced error handling"""
        url = f"{self.base_url}/{endpoint}" if endpoint else self.base_url
        default_headers = {'Content-Type': 'application/json'}
        if headers:
            default_headers.update(headers)

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        print(f"   URL: {url}")
        if data:
            print(f"   Data: {json.dumps(data, indent=2, default=str)}")
        
        try:
            start_time = time.time()
            
            if method == 'GET':
                response = requests.get(url, headers=default_headers, params=params, timeout=timeout)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=default_headers, timeout=timeout)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=default_headers, timeout=timeout)
            elif method == 'DELETE':
                response = requests.delete(url, headers=default_headers, timeout=timeout)

            response_time = time.time() - start_time
            print(f"   Status Code: {response.status_code}")
            print(f"   Response Time: {response_time:.3f}s")
            
            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Expected {expected_status}, got {response.status_code}")
                try:
                    response_data = response.json()
                    print(f"   Response: {json.dumps(response_data, indent=2, default=str)}")
                    return True, response_data, response_time
                except:
                    return True, {}, response_time
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                try:
                    error_detail = response.json()
                    print(f"   Error: {json.dumps(error_detail, indent=2)}")
                    return False, error_detail, response_time
                except:
                    print(f"   Error: {response.text}")
                    return False, {'error': response.text}, response_time

        except requests.exceptions.Timeout:
            print(f"❌ Failed - Request timeout after {timeout}s")
            return False, {'error': 'timeout'}, timeout
        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            return False, {'error': str(e)}, 0

    # ========== API ENDPOINT CONSISTENCY TESTS ==========
    
    def test_root_endpoint(self):
        """Test root API endpoint"""
        success, response, time_taken = self.run_test("Root API Endpoint", "GET", "", 200)
        self.log_result('api_consistency', 'Root Endpoint', success, f"Response time: {time_taken:.3f}s")
        return success, response

    def test_nakliye_crud_operations(self):
        """Test all nakliye CRUD operations comprehensively"""
        print("\n" + "="*70)
        print("🚛 NAKLIYE CRUD OPERATIONS TESTING")
        print("="*70)
        
        all_success = True
        
        # Test data with Turkish characters and various scenarios
        test_records = [
            {
                "tarih": "2024-01-15T10:30:00Z",
                "sira_no": "ARK001",
                "kod": "İST-ANK",
                "musteri": "Ahmet Yılmaz Nakliyat Ltd. Şti.",
                "irsaliye_no": "İRS-2024-001",
                "ithalat": True,
                "ihracat": False,
                "bos": False,
                "bos_tasima": 1500.75,
                "reefer": 2000.50,
                "bekleme": 500.25,
                "geceleme": 1000.00,
                "pazar": 750.30,
                "harcirah": 1250.80,
                "toplam": 7000.60,
                "sistem": 6500.55
            },
            {
                "tarih": "2024-01-16T14:45:00Z",
                "sira_no": "ARK002",
                "kod": "İZM-BUR",
                "musteri": "Mehmet Öztürk Lojistik A.Ş.",
                "irsaliye_no": "İRS-2024-002",
                "ithalat": False,
                "ihracat": True,
                "bos": False,
                "bos_tasima": 3000.00,
                "reefer": 0.0,
                "bekleme": 250.75,
                "geceleme": 0.0,
                "pazar": 0.0,
                "harcirah": 2000.25,
                "toplam": 5250.00,
                "sistem": 5000.00
            }
        ]
        
        # CREATE operations
        print("\n📝 CREATE Operations")
        for i, record in enumerate(test_records):
            success, response, _ = self.run_test(
                f"Create Nakliye Record {i+1}",
                "POST",
                "nakliye",
                200,
                data=record
            )
            if success and 'id' in response:
                self.created_nakliye_records.append(response['id'])
                self.log_result('api_consistency', f'Create Nakliye {i+1}', True, f"ID: {response['id']}")
            else:
                all_success = False
                self.log_result('api_consistency', f'Create Nakliye {i+1}', False, "Failed to create")
        
        # READ operations
        print("\n📋 READ Operations")
        
        # Get all records
        success, response, time_taken = self.run_test("Get All Nakliye Records", "GET", "nakliye", 200)
        self.log_result('api_consistency', 'Get All Nakliye', success, f"Count: {len(response) if success else 0}, Time: {time_taken:.3f}s")
        if not success:
            all_success = False
        
        # Get individual records
        for record_id in self.created_nakliye_records[:2]:
            success, response, _ = self.run_test(
                f"Get Nakliye by ID",
                "GET",
                f"nakliye/{record_id}",
                200
            )
            self.log_result('api_consistency', f'Get Nakliye by ID', success, f"ID: {record_id}")
            if not success:
                all_success = False
        
        # UPDATE operations
        print("\n✏️ UPDATE Operations")
        if self.created_nakliye_records:
            update_data = {
                "musteri": "Güncellenen Müşteri Adı - Çağlar Transport",
                "toplam": 8500.75,
                "sistem": 8000.50
            }
            success, response, _ = self.run_test(
                "Update Nakliye Record",
                "PUT",
                f"nakliye/{self.created_nakliye_records[0]}",
                200,
                data=update_data
            )
            self.log_result('api_consistency', 'Update Nakliye', success, f"Updated fields: {list(update_data.keys())}")
            if not success:
                all_success = False
        
        # SEARCH operations
        print("\n🔍 SEARCH Operations")
        search_queries = ["Ahmet", "Yılmaz", "İST", "ARK001", "İRS-2024"]
        for query in search_queries:
            success, response, time_taken = self.run_test(
                f"Search Nakliye: '{query}'",
                "GET",
                f"nakliye/search/{query}",
                200
            )
            result_count = len(response) if success and isinstance(response, list) else 0
            self.log_result('api_consistency', f'Search: {query}', success, f"Results: {result_count}, Time: {time_taken:.3f}s")
            if not success:
                all_success = False
        
        return all_success

    def test_yatan_tutar_crud_operations(self):
        """Test all yatan-tutar CRUD operations"""
        print("\n" + "="*70)
        print("💰 YATAN TUTAR CRUD OPERATIONS TESTING")
        print("="*70)
        
        all_success = True
        
        # Test data with Turkish date formats and various scenarios
        test_records = [
            {
                "tutar": 15000.75,
                "yatan_tarih": "2024-01-15",
                "baslangic_tarih": "2024-01-10",
                "bitis_tarih": "2024-01-20",
                "aciklama": "İstanbul-Ankara güzergahı ödeme - Ocak ayı"
            },
            {
                "tutar": 25500.50,
                "yatan_tarih": "2024-01-16",
                "baslangic_tarih": "2024-01-12",
                "bitis_tarih": "2024-01-22",
                "aciklama": "İzmir-Bursa nakliye ödemesi - Şubat dönemi"
            },
            {
                "tutar": 8750.25,
                "yatan_tarih": "2024-01-17",
                "baslangic_tarih": "2024-01-15",
                "bitis_tarih": "2024-01-25",
                "aciklama": "Ek ödeme - geceleme ve bekleme ücretleri"
            }
        ]
        
        # CREATE operations
        print("\n📝 CREATE Operations")
        for i, record in enumerate(test_records):
            success, response, _ = self.run_test(
                f"Create Yatan Tutar Record {i+1}",
                "POST",
                "yatan-tutar",
                200,
                data=record
            )
            if success and 'id' in response:
                self.created_yatan_tutar_records.append(response['id'])
                self.log_result('api_consistency', f'Create Yatan Tutar {i+1}', True, f"ID: {response['id']}, Amount: {record['tutar']}")
            else:
                all_success = False
                self.log_result('api_consistency', f'Create Yatan Tutar {i+1}', False, "Failed to create")
        
        # READ operations
        print("\n📋 READ Operations")
        
        # Get all records
        success, response, time_taken = self.run_test("Get All Yatan Tutar Records", "GET", "yatan-tutar", 200)
        self.log_result('api_consistency', 'Get All Yatan Tutar', success, f"Count: {len(response) if success else 0}, Time: {time_taken:.3f}s")
        if not success:
            all_success = False
        
        # Get individual records
        for record_id in self.created_yatan_tutar_records[:2]:
            success, response, _ = self.run_test(
                f"Get Yatan Tutar by ID",
                "GET",
                f"yatan-tutar/{record_id}",
                200
            )
            self.log_result('api_consistency', f'Get Yatan Tutar by ID', success, f"ID: {record_id}")
            if not success:
                all_success = False
        
        # UPDATE operations
        print("\n✏️ UPDATE Operations")
        if self.created_yatan_tutar_records:
            update_data = {
                "tutar": 18750.90,
                "aciklama": "Güncellenen ödeme - ek masraflar dahil"
            }
            success, response, _ = self.run_test(
                "Update Yatan Tutar Record",
                "PUT",
                f"yatan-tutar/{self.created_yatan_tutar_records[0]}",
                200,
                data=update_data
            )
            self.log_result('api_consistency', 'Update Yatan Tutar', success, f"Updated amount: {update_data['tutar']}")
            if not success:
                all_success = False
        
        return all_success

    # ========== AUTHENTICATION SYSTEM TESTS ==========
    
    def test_authentication_system(self):
        """Test authentication system (Note: Simple login not available, testing full auth system)"""
        print("\n" + "="*70)
        print("🔐 AUTHENTICATION SYSTEM TESTING")
        print("="*70)
        
        all_success = True
        
        # Note: The review request mentions username: "Arkas", password: "1234"
        # But the backend has a full registration/login system, not simple auth
        print("⚠️  Note: Backend uses full registration/login system, not simple Arkas/1234 auth")
        
        # Test user registration
        timestamp = str(int(time.time()))
        test_user = {
            "email": f"test{timestamp}@arkastest.com",
            "password": "TestPass123!",
            "full_name": "Arkas Test Kullanıcısı"
        }
        
        success, response, _ = self.run_test(
            "User Registration",
            "POST",
            "auth/register",
            200,
            data=test_user
        )
        self.log_result('authentication', 'User Registration', success, f"Email: {test_user['email']}")
        if not success:
            all_success = False
        else:
            self.created_users.append(test_user['email'])
        
        # Test user login
        login_data = {
            "identifier": test_user['email'],
            "password": test_user['password']
        }
        success, response, _ = self.run_test(
            "User Login",
            "POST",
            "auth/login",
            200,
            data=login_data
        )
        if success and 'access_token' in response:
            self.access_token = response['access_token']
            self.log_result('authentication', 'User Login', True, "Token obtained")
        else:
            all_success = False
            self.log_result('authentication', 'User Login', False, "Failed to get token")
        
        # Test protected endpoint
        if self.access_token:
            headers = {"Authorization": f"Bearer {self.access_token}"}
            success, response, _ = self.run_test(
                "Get User Info (Protected)",
                "GET",
                "auth/me",
                200,
                headers=headers
            )
            self.log_result('authentication', 'Protected Endpoint', success, "User info retrieved")
            if not success:
                all_success = False
        
        # Test invalid token
        headers = {"Authorization": "Bearer invalid_token_here"}
        success, response, _ = self.run_test(
            "Invalid Token Test",
            "GET",
            "auth/me",
            401,
            headers=headers
        )
        self.log_result('authentication', 'Invalid Token Rejection', success, "Properly rejected invalid token")
        if not success:
            all_success = False
        
        return all_success

    # ========== DATA VALIDATION & SERIALIZATION TESTS ==========
    
    def test_data_validation_serialization(self):
        """Test MongoDB integration, UUID handling, and datetime serialization"""
        print("\n" + "="*70)
        print("🗄️ DATA VALIDATION & SERIALIZATION TESTING")
        print("="*70)
        
        all_success = True
        
        # Test UUID handling
        print("\n🆔 UUID Handling Tests")
        test_record = {
            "tarih": "2024-01-20T15:30:00Z",
            "sira_no": "UUID_TEST",
            "musteri": "UUID Test Müşteri",
            "irsaliye_no": "UUID-TEST-001",
            "toplam": 1000.0,
            "sistem": 950.0
        }
        
        success, response, _ = self.run_test(
            "Create Record (UUID Generation)",
            "POST",
            "nakliye",
            200,
            data=test_record
        )
        
        if success and 'id' in response:
            record_id = response['id']
            # Verify UUID format
            try:
                uuid.UUID(record_id)
                print(f"✅ Valid UUID generated: {record_id}")
                self.log_result('mongodb_integration', 'UUID Generation', True, f"Valid UUID: {record_id}")
                self.created_nakliye_records.append(record_id)
            except ValueError:
                print(f"❌ Invalid UUID format: {record_id}")
                self.log_result('mongodb_integration', 'UUID Generation', False, f"Invalid UUID: {record_id}")
                all_success = False
        else:
            all_success = False
            self.log_result('mongodb_integration', 'UUID Generation', False, "Failed to create record")
        
        # Test datetime serialization/deserialization
        print("\n📅 Datetime Serialization Tests")
        if self.created_nakliye_records:
            success, response, _ = self.run_test(
                "Get Record (Datetime Deserialization)",
                "GET",
                f"nakliye/{self.created_nakliye_records[-1]}",
                200
            )
            
            if success and 'tarih' in response:
                tarih_value = response['tarih']
                try:
                    # Try to parse the datetime
                    if isinstance(tarih_value, str):
                        datetime.fromisoformat(tarih_value.replace('Z', '+00:00'))
                    print(f"✅ Datetime properly serialized: {tarih_value}")
                    self.log_result('mongodb_integration', 'Datetime Serialization', True, f"Format: {type(tarih_value)}")
                except:
                    print(f"❌ Invalid datetime format: {tarih_value}")
                    self.log_result('mongodb_integration', 'Datetime Serialization', False, f"Invalid format: {tarih_value}")
                    all_success = False
            else:
                all_success = False
                self.log_result('mongodb_integration', 'Datetime Serialization', False, "No datetime field found")
        
        # Test data type validation
        print("\n🔢 Data Type Validation Tests")
        
        # Test float values
        float_test_record = {
            "tarih": "2024-01-21T10:00:00Z",
            "sira_no": "FLOAT_TEST",
            "musteri": "Float Test Müşteri",
            "irsaliye_no": "FLOAT-001",
            "toplam": 1234.56,
            "sistem": 1200.75,
            "bos_tasima": 500.25,
            "reefer": 750.50
        }
        
        success, response, _ = self.run_test(
            "Float Values Test",
            "POST",
            "nakliye",
            200,
            data=float_test_record
        )
        
        if success:
            self.log_result('data_validation', 'Float Values', True, "Float values accepted")
            if 'id' in response:
                self.created_nakliye_records.append(response['id'])
        else:
            all_success = False
            self.log_result('data_validation', 'Float Values', False, "Float values rejected")
        
        return all_success

    # ========== TURKISH LOCALE HANDLING TESTS ==========
    
    def test_turkish_locale_handling(self):
        """Test Turkish locale handling (dates, currency, characters)"""
        print("\n" + "="*70)
        print("🇹🇷 TURKISH LOCALE HANDLING TESTING")
        print("="*70)
        
        all_success = True
        
        # Test Turkish characters
        print("\n🔤 Turkish Character Tests")
        turkish_test_record = {
            "tarih": "2024-01-22T12:00:00Z",
            "sira_no": "TR_ÇĞİÖŞÜ",
            "kod": "İSTANBUL-ÇANAKKALE",
            "musteri": "Çağlar Öztürk Nakliyat Ltd. Şti. - Ğüneş Lojistik",
            "irsaliye_no": "İRSALİYE-2024-ÇĞİÖŞÜ",
            "toplam": 5000.0,
            "sistem": 4750.0
        }
        
        success, response, _ = self.run_test(
            "Turkish Characters Test",
            "POST",
            "nakliye",
            200,
            data=turkish_test_record
        )
        
        if success:
            self.log_result('turkish_locale', 'Turkish Characters', True, "Turkish characters accepted")
            if 'id' in response:
                self.created_nakliye_records.append(response['id'])
                
                # Verify Turkish characters are preserved
                success2, response2, _ = self.run_test(
                    "Turkish Characters Retrieval",
                    "GET",
                    f"nakliye/{response['id']}",
                    200
                )
                
                if success2 and response2.get('musteri') == turkish_test_record['musteri']:
                    print("✅ Turkish characters preserved in database")
                    self.log_result('turkish_locale', 'Turkish Characters Preservation', True, "Characters preserved")
                else:
                    print("❌ Turkish characters not preserved")
                    self.log_result('turkish_locale', 'Turkish Characters Preservation', False, "Characters corrupted")
                    all_success = False
        else:
            all_success = False
            self.log_result('turkish_locale', 'Turkish Characters', False, "Turkish characters rejected")
        
        # Test Turkish currency format (using Turkish Lira amounts)
        print("\n💰 Turkish Currency Tests")
        currency_test_record = {
            "tutar": 15750.25,  # 15,750.25 TL
            "yatan_tarih": "2024-01-22",
            "baslangic_tarih": "2024-01-20",
            "bitis_tarih": "2024-01-30",
            "aciklama": "Türk Lirası ödeme - 15.750,25 TL"
        }
        
        success, response, _ = self.run_test(
            "Turkish Currency Test",
            "POST",
            "yatan-tutar",
            200,
            data=currency_test_record
        )
        
        if success:
            self.log_result('turkish_locale', 'Turkish Currency', True, f"Amount: {currency_test_record['tutar']} TL")
            if 'id' in response:
                self.created_yatan_tutar_records.append(response['id'])
        else:
            all_success = False
            self.log_result('turkish_locale', 'Turkish Currency', False, "Currency format rejected")
        
        # Test search with Turkish characters
        print("\n🔍 Turkish Search Tests")
        search_queries = ["Çağlar", "Öztürk", "İSTANBUL", "ÇĞİÖŞÜ"]
        for query in search_queries:
            success, response, _ = self.run_test(
                f"Turkish Search: '{query}'",
                "GET",
                f"nakliye/search/{query}",
                200
            )
            result_count = len(response) if success and isinstance(response, list) else 0
            self.log_result('turkish_locale', f'Turkish Search: {query}', success, f"Results: {result_count}")
            if not success:
                all_success = False
        
        return all_success

    # ========== ERROR HANDLING TESTS ==========
    
    def test_error_handling(self):
        """Test error handling and edge cases"""
        print("\n" + "="*70)
        print("⚠️ ERROR HANDLING & EDGE CASES TESTING")
        print("="*70)
        
        all_success = True
        
        # Test invalid requests
        print("\n❌ Invalid Request Tests")
        
        # Test invalid nakliye creation (missing required fields)
        invalid_record = {
            "sira_no": "INVALID_TEST"
            # Missing required fields like tarih, musteri, irsaliye_no
        }
        
        success, response, _ = self.run_test(
            "Invalid Nakliye Creation (Missing Fields)",
            "POST",
            "nakliye",
            422,  # Expecting validation error
            data=invalid_record
        )
        self.log_result('error_handling', 'Missing Required Fields', success, "Properly rejected invalid data")
        if not success:
            all_success = False
        
        # Test invalid ID format
        success, response, _ = self.run_test(
            "Invalid ID Format",
            "GET",
            "nakliye/invalid-id-format",
            404
        )
        self.log_result('error_handling', 'Invalid ID Format', success, "Properly handled invalid ID")
        if not success:
            all_success = False
        
        # Test non-existent record
        fake_uuid = str(uuid.uuid4())
        success, response, _ = self.run_test(
            "Non-existent Record",
            "GET",
            f"nakliye/{fake_uuid}",
            404
        )
        self.log_result('error_handling', 'Non-existent Record', success, "Properly returned 404")
        if not success:
            all_success = False
        
        # Test invalid data types
        print("\n🔢 Invalid Data Type Tests")
        invalid_type_record = {
            "tarih": "invalid-date-format",
            "sira_no": "TYPE_TEST",
            "musteri": "Type Test",
            "irsaliye_no": "TYPE-001",
            "toplam": "not-a-number",  # Should be float
            "sistem": "also-not-a-number"
        }
        
        success, response, _ = self.run_test(
            "Invalid Data Types",
            "POST",
            "nakliye",
            422,  # Expecting validation error
            data=invalid_type_record
        )
        self.log_result('error_handling', 'Invalid Data Types', success, "Properly rejected invalid types")
        if not success:
            all_success = False
        
        # Test empty data
        success, response, _ = self.run_test(
            "Empty Data",
            "POST",
            "nakliye",
            422,
            data={}
        )
        self.log_result('error_handling', 'Empty Data', success, "Properly rejected empty data")
        if not success:
            all_success = False
        
        return all_success

    # ========== PERFORMANCE & STABILITY TESTS ==========
    
    def test_performance_stability(self):
        """Test performance and stability with concurrent requests"""
        print("\n" + "="*70)
        print("⚡ PERFORMANCE & STABILITY TESTING")
        print("="*70)
        
        all_success = True
        
        # Test response times
        print("\n⏱️ Response Time Tests")
        start_time = time.time()
        success, response, response_time = self.run_test(
            "Response Time Test",
            "GET",
            "nakliye",
            200
        )
        
        if success:
            if response_time < 5.0:  # Should respond within 5 seconds
                print(f"✅ Good response time: {response_time:.3f}s")
                self.log_result('performance', 'Response Time', True, f"{response_time:.3f}s")
            else:
                print(f"⚠️ Slow response time: {response_time:.3f}s")
                self.log_result('performance', 'Response Time', False, f"Slow: {response_time:.3f}s")
                all_success = False
        else:
            all_success = False
            self.log_result('performance', 'Response Time', False, "Request failed")
        
        # Test concurrent requests
        print("\n🔄 Concurrent Request Tests")
        def make_concurrent_request():
            try:
                response = requests.get(f"{self.base_url}/nakliye", timeout=10)
                return response.status_code == 200
            except:
                return False
        
        # Run 5 concurrent requests
        with concurrent.futures.ThreadPoolExecutor(max_workers=5) as executor:
            futures = [executor.submit(make_concurrent_request) for _ in range(5)]
            results = [future.result() for future in concurrent.futures.as_completed(futures)]
        
        successful_requests = sum(results)
        if successful_requests >= 4:  # At least 4 out of 5 should succeed
            print(f"✅ Concurrent requests: {successful_requests}/5 successful")
            self.log_result('performance', 'Concurrent Requests', True, f"{successful_requests}/5 successful")
        else:
            print(f"❌ Concurrent requests: {successful_requests}/5 successful")
            self.log_result('performance', 'Concurrent Requests', False, f"Only {successful_requests}/5 successful")
            all_success = False
        
        return all_success

    # ========== FILE OPERATIONS SUPPORT TESTS ==========
    
    def test_file_operations_support(self):
        """Test endpoints that support PDF generation and backup/restore data"""
        print("\n" + "="*70)
        print("📄 FILE OPERATIONS SUPPORT TESTING")
        print("="*70)
        
        all_success = True
        
        # Test large data handling (simulate PDF generation data)
        print("\n📊 Large Data Handling Tests")
        
        # Create multiple records to simulate large dataset
        large_dataset = []
        for i in range(10):
            record = {
                "tarih": f"2024-01-{20+i:02d}T10:00:00Z",
                "sira_no": f"LARGE_{i:03d}",
                "kod": f"TEST-{i}",
                "musteri": f"Büyük Veri Test Müşteri {i} - PDF Export",
                "irsaliye_no": f"LARGE-{i:03d}",
                "toplam": 1000.0 + i * 100,
                "sistem": 950.0 + i * 95
            }
            large_dataset.append(record)
        
        # Create records
        created_large_records = []
        for i, record in enumerate(large_dataset):
            success, response, _ = self.run_test(
                f"Create Large Dataset Record {i+1}",
                "POST",
                "nakliye",
                200,
                data=record
            )
            if success and 'id' in response:
                created_large_records.append(response['id'])
                self.created_nakliye_records.append(response['id'])
        
        # Test retrieving large dataset (simulates backup/export)
        success, response, response_time = self.run_test(
            "Retrieve Large Dataset",
            "GET",
            "nakliye?limit=100",
            200
        )
        
        if success:
            record_count = len(response) if isinstance(response, list) else 0
            if record_count >= 10 and response_time < 10.0:  # Should handle at least 10 records in under 10s
                print(f"✅ Large data handling: {record_count} records in {response_time:.3f}s")
                self.log_result('file_operations', 'Large Data Handling', True, f"{record_count} records, {response_time:.3f}s")
            else:
                print(f"⚠️ Large data handling issues: {record_count} records in {response_time:.3f}s")
                self.log_result('file_operations', 'Large Data Handling', False, f"Performance issues")
                all_success = False
        else:
            all_success = False
            self.log_result('file_operations', 'Large Data Handling', False, "Failed to retrieve large dataset")
        
        # Test data consistency for backup/restore scenarios
        print("\n🔄 Data Consistency Tests")
        if created_large_records:
            # Verify all created records can be retrieved individually
            consistency_success = 0
            for record_id in created_large_records[:5]:  # Test first 5
                success, response, _ = self.run_test(
                    f"Data Consistency Check",
                    "GET",
                    f"nakliye/{record_id}",
                    200
                )
                if success:
                    consistency_success += 1
            
            if consistency_success >= 4:  # At least 4 out of 5 should be consistent
                print(f"✅ Data consistency: {consistency_success}/5 records consistent")
                self.log_result('file_operations', 'Data Consistency', True, f"{consistency_success}/5 consistent")
            else:
                print(f"❌ Data consistency issues: {consistency_success}/5 records consistent")
                self.log_result('file_operations', 'Data Consistency', False, f"Only {consistency_success}/5 consistent")
                all_success = False
        
        return all_success

    # ========== CORS AND SECURITY HEADERS TESTS ==========
    
    def test_cors_security_headers(self):
        """Test CORS and security headers"""
        print("\n" + "="*70)
        print("🔒 CORS & SECURITY HEADERS TESTING")
        print("="*70)
        
        all_success = True
        
        # Test CORS headers
        print("\n🌐 CORS Headers Test")
        try:
            response = requests.options(f"{self.base_url}/nakliye", timeout=10)
            cors_headers = {
                'Access-Control-Allow-Origin': response.headers.get('Access-Control-Allow-Origin'),
                'Access-Control-Allow-Methods': response.headers.get('Access-Control-Allow-Methods'),
                'Access-Control-Allow-Headers': response.headers.get('Access-Control-Allow-Headers')
            }
            
            print(f"   CORS Headers: {cors_headers}")
            
            # Check if CORS is properly configured
            if cors_headers['Access-Control-Allow-Origin']:
                print("✅ CORS headers present")
                self.log_result('authentication', 'CORS Headers', True, "CORS configured")
            else:
                print("⚠️ CORS headers missing")
                self.log_result('authentication', 'CORS Headers', False, "CORS not configured")
                all_success = False
                
        except Exception as e:
            print(f"❌ CORS test failed: {str(e)}")
            self.log_result('authentication', 'CORS Headers', False, f"Error: {str(e)}")
            all_success = False
        
        return all_success

    # ========== CLEANUP METHODS ==========
    
    def cleanup_test_data(self):
        """Clean up all test data created during testing"""
        print(f"\n🧹 Cleaning up test data...")
        
        # Clean up nakliye records
        for record_id in self.created_nakliye_records:
            try:
                self.run_test(
                    f"Cleanup Nakliye {record_id}",
                    "DELETE",
                    f"nakliye/{record_id}",
                    200
                )
            except:
                pass
        
        # Clean up yatan tutar records
        for record_id in self.created_yatan_tutar_records:
            try:
                self.run_test(
                    f"Cleanup Yatan Tutar {record_id}",
                    "DELETE",
                    f"yatan-tutar/{record_id}",
                    200
                )
            except:
                pass
        
        print(f"   Cleaned up {len(self.created_nakliye_records)} nakliye records")
        print(f"   Cleaned up {len(self.created_yatan_tutar_records)} yatan tutar records")

    # ========== MAIN TEST RUNNER ==========
    
    def run_comprehensive_tests(self):
        """Run all comprehensive cross-platform API tests"""
        print("🚀 Starting Comprehensive Cross-Platform Backend API Tests...")
        print(f"Backend URL: {self.base_url}")
        
        test_results = {}
        
        try:
            # 1. API Endpoint Consistency Tests
            print("\n" + "="*80)
            print("🔗 API ENDPOINT CONSISTENCY TESTS")
            print("="*80)
            
            test_results['root_endpoint'] = self.test_root_endpoint()[0]
            test_results['nakliye_crud'] = self.test_nakliye_crud_operations()
            test_results['yatan_tutar_crud'] = self.test_yatan_tutar_crud_operations()
            
            # 2. Authentication System Tests
            test_results['authentication'] = self.test_authentication_system()
            
            # 3. Data Validation & Serialization Tests
            test_results['data_validation'] = self.test_data_validation_serialization()
            
            # 4. Turkish Locale Handling Tests
            test_results['turkish_locale'] = self.test_turkish_locale_handling()
            
            # 5. Error Handling Tests
            test_results['error_handling'] = self.test_error_handling()
            
            # 6. Performance & Stability Tests
            test_results['performance'] = self.test_performance_stability()
            
            # 7. File Operations Support Tests
            test_results['file_operations'] = self.test_file_operations_support()
            
            # 8. CORS & Security Tests
            test_results['cors_security'] = self.test_cors_security_headers()
            
        except Exception as e:
            print(f"❌ Test suite failed with error: {str(e)}")
            test_results['suite_error'] = False
        
        finally:
            # Cleanup
            self.cleanup_test_data()
        
        return test_results

    def print_comprehensive_summary(self, test_results):
        """Print comprehensive test summary"""
        print("\n" + "="*80)
        print("📋 COMPREHENSIVE CROSS-PLATFORM API TEST RESULTS")
        print("="*80)
        
        print(f"\n📊 Overall Statistics:")
        print(f"   Total Tests Run: {self.tests_run}")
        print(f"   Total Tests Passed: {self.tests_passed}")
        print(f"   Overall Success Rate: {(self.tests_passed/self.tests_run)*100:.1f}%")
        
        print(f"\n🎯 Test Category Results:")
        for category, success in test_results.items():
            status = "✅ PASSED" if success else "❌ FAILED"
            print(f"   {category.replace('_', ' ').title()}: {status}")
        
        # Detailed results by category
        for category, results in self.test_results.items():
            if results:
                print(f"\n📋 {category.replace('_', ' ').title()} Details:")
                for result in results:
                    status = "✅" if result['success'] else "❌"
                    print(f"   {status} {result['test']}: {result['details']}")
        
        # Overall assessment
        passed_categories = sum(1 for success in test_results.values() if success)
        total_categories = len(test_results)
        
        print(f"\n🏆 FINAL ASSESSMENT:")
        print(f"   Categories Passed: {passed_categories}/{total_categories}")
        print(f"   Category Success Rate: {(passed_categories/total_categories)*100:.1f}%")
        
        if passed_categories == total_categories and self.tests_passed == self.tests_run:
            print("\n🎉 ALL CROSS-PLATFORM API TESTS PASSED!")
            print("✅ Backend is ready for cross-platform deployment")
            return True
        else:
            print("\n❌ SOME CROSS-PLATFORM API TESTS FAILED")
            print("⚠️ Review failed tests before cross-platform deployment")
            return False


def main():
    """Main test runner for comprehensive cross-platform API testing"""
    print("🚀 Arkas Lojistik - Comprehensive Cross-Platform Backend API Testing")
    print("="*80)
    
    tester = ComprehensiveCrossPlatformAPITester()
    
    # Run comprehensive tests
    test_results = tester.run_comprehensive_tests()
    
    # Print summary
    overall_success = tester.print_comprehensive_summary(test_results)
    
    return 0 if overall_success else 1


if __name__ == "__main__":
    sys.exit(main())