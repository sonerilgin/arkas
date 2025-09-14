#!/usr/bin/env python3
"""
QR Code Endpoints Test Script for Arkas Lojistik
Tests the QR code endpoints for Android download solution
"""

import requests
import json
import os
import time
from datetime import datetime

class QRCodeEndpointTester:
    def __init__(self, base_url="https://shipmate-40.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.download_url = base_url  # For download-temp endpoint
        
    def test_pdf_qr_generation(self):
        """Test PDF QR code generation endpoint"""
        print("\n🔍 Testing PDF QR Code Generation...")
        
        test_data = {
            "data": [
                {
                    "sira_no": "QR001",
                    "musteri": "QR Test Müşteri",
                    "tarih": "2024-01-01",
                    "toplam": 1000.50,
                    "sistem": 950.25,
                    "irsaliye_no": "QR-TEST-001"
                },
                {
                    "sira_no": "QR002", 
                    "musteri": "QR Test Müşteri 2",
                    "tarih": "2024-01-02",
                    "toplam": 2500.75,
                    "sistem": 2400.00,
                    "irsaliye_no": "QR-TEST-002"
                }
            ],
            "period": "QR_Test_2024"
        }
        
        try:
            response = requests.post(f"{self.api_url}/generate-pdf-qr", json=test_data, timeout=30)
            print(f"   Status Code: {response.status_code}")
            
            if response.status_code == 200:
                result = response.json()
                print(f"✅ PDF QR generation successful!")
                print(f"   Success: {result.get('success')}")
                print(f"   File ID: {result.get('file_id')}")
                print(f"   Download URL: {result.get('download_url')}")
                print(f"   Filename: {result.get('filename')}")
                return result.get('file_id')
            else:
                print(f"❌ PDF QR generation failed")
                try:
                    error = response.json()
                    print(f"   Error: {error}")
                except:
                    print(f"   Error: {response.text}")
                return None
                
        except Exception as e:
            print(f"❌ PDF QR generation error: {str(e)}")
            return None
    
    def test_backup_qr_generation(self):
        """Test Backup QR code generation endpoint"""
        print("\n🔍 Testing Backup QR Code Generation...")
        
        try:
            response = requests.post(f"{self.api_url}/generate-backup-qr", json={}, timeout=30)
            print(f"   Status Code: {response.status_code}")
            
            if response.status_code == 200:
                result = response.json()
                print(f"✅ Backup QR generation successful!")
                print(f"   Success: {result.get('success')}")
                print(f"   File ID: {result.get('file_id')}")
                print(f"   Download URL: {result.get('download_url')}")
                print(f"   Filename: {result.get('filename')}")
                return result.get('file_id')
            else:
                print(f"❌ Backup QR generation failed")
                try:
                    error = response.json()
                    print(f"   Error: {error}")
                except:
                    print(f"   Error: {response.text}")
                return None
                
        except Exception as e:
            print(f"❌ Backup QR generation error: {str(e)}")
            return None
    
    def test_temp_file_download(self, file_id):
        """Test temporary file download endpoint"""
        if not file_id:
            print(f"⚠️ Skipping download test - no file ID provided")
            return False
            
        print(f"\n🔍 Testing Temporary File Download for: {file_id}")
        
        try:
            download_url = f"{self.base_url}/download-temp/{file_id}"
            print(f"   Download URL: {download_url}")
            
            response = requests.get(download_url, timeout=30)
            print(f"   Status Code: {response.status_code}")
            print(f"   Content-Type: {response.headers.get('Content-Type', 'Not set')}")
            print(f"   Content-Disposition: {response.headers.get('Content-Disposition', 'Not set')}")
            print(f"   Content-Length: {response.headers.get('Content-Length', 'Not set')}")
            
            if response.status_code == 200:
                content_length = len(response.content)
                print(f"✅ File download successful - {content_length} bytes")
                
                # Verify content type
                content_type = response.headers.get('Content-Type', '')
                if file_id.endswith('.pdf') and 'application/pdf' in content_type:
                    print(f"✅ Correct PDF content type")
                    return True
                elif file_id.endswith('.json') and 'application/json' in content_type:
                    print(f"✅ Correct JSON content type")
                    return True
                else:
                    print(f"⚠️ Unexpected content type: {content_type}")
                    return True  # Still successful download
            else:
                print(f"❌ File download failed")
                try:
                    error = response.json()
                    print(f"   Error: {error}")
                except:
                    print(f"   Error: {response.text}")
                return False
                
        except Exception as e:
            print(f"❌ File download error: {str(e)}")
            return False
    
    def test_error_cases(self):
        """Test error handling scenarios"""
        print("\n🔍 Testing Error Cases...")
        
        # Test PDF generation with empty data
        print("\n   Testing PDF QR with empty data...")
        try:
            response = requests.post(f"{self.api_url}/generate-pdf-qr", 
                                   json={"data": [], "period": "Empty_Test"}, 
                                   timeout=10)
            if response.status_code == 400:
                print(f"✅ Empty data properly rejected with 400")
            else:
                print(f"⚠️ Expected 400, got {response.status_code}")
        except Exception as e:
            print(f"❌ Error testing empty data: {str(e)}")
        
        # Test invalid file ID download
        print("\n   Testing invalid file ID download...")
        try:
            fake_file_id = "nonexistent_file.pdf"
            response = requests.get(f"{self.api_url}/download-temp/{fake_file_id}", timeout=10)
            if response.status_code == 404:
                print(f"✅ Invalid file ID properly rejected with 404")
            else:
                print(f"⚠️ Expected 404, got {response.status_code}")
        except Exception as e:
            print(f"❌ Error testing invalid file ID: {str(e)}")
    
    def test_system_requirements(self):
        """Test system requirements for QR code functionality"""
        print("\n🔍 Testing System Requirements...")
        
        # Test wkhtmltopdf availability
        print("\n   Testing wkhtmltopdf availability...")
        try:
            import subprocess
            result = subprocess.run(['which', 'wkhtmltopdf'], capture_output=True, text=True, timeout=5)
            if result.returncode == 0:
                print(f"✅ wkhtmltopdf found at: {result.stdout.strip()}")
                
                # Test wkhtmltopdf version
                version_result = subprocess.run(['wkhtmltopdf', '--version'], capture_output=True, text=True, timeout=5)
                if version_result.returncode == 0:
                    print(f"✅ wkhtmltopdf version: {version_result.stdout.strip()}")
                else:
                    print(f"⚠️ Could not get wkhtmltopdf version")
            else:
                print(f"❌ wkhtmltopdf not found in PATH")
        except Exception as e:
            print(f"❌ wkhtmltopdf check error: {str(e)}")
        
        # Test /tmp directory write permissions
        print("\n   Testing /tmp directory write permissions...")
        try:
            import tempfile
            with tempfile.NamedTemporaryFile(mode='w', dir='/tmp', delete=False) as temp_file:
                temp_file.write("test")
                temp_path = temp_file.name
            
            if os.path.exists(temp_path):
                os.unlink(temp_path)
                print(f"✅ /tmp directory writable")
            else:
                print(f"❌ /tmp directory write test failed")
        except Exception as e:
            print(f"❌ /tmp directory write error: {str(e)}")
        
        # Test BACKEND_URL environment variable
        print("\n   Testing BACKEND_URL configuration...")
        try:
            # Make a simple request to check if backend is responding
            response = requests.get(f"{self.api_url}/", timeout=10)
            if response.status_code == 200:
                print(f"✅ Backend API accessible at: {self.api_url}")
            else:
                print(f"⚠️ Backend API returned: {response.status_code}")
        except Exception as e:
            print(f"❌ Backend API check error: {str(e)}")
    
    def run_comprehensive_test(self):
        """Run all QR code endpoint tests"""
        print("🚀 Starting QR Code Endpoints Comprehensive Test")
        print(f"Backend URL: {self.base_url}")
        print(f"API URL: {self.api_url}")
        print("="*70)
        
        # Test system requirements first
        self.test_system_requirements()
        
        # Test QR code generation endpoints
        pdf_file_id = self.test_pdf_qr_generation()
        backup_file_id = self.test_backup_qr_generation()
        
        # Test file downloads
        if pdf_file_id:
            self.test_temp_file_download(pdf_file_id)
        if backup_file_id:
            self.test_temp_file_download(backup_file_id)
        
        # Test error cases
        self.test_error_cases()
        
        print("\n" + "="*70)
        print("🏁 QR Code Endpoints Test Complete")

def main():
    tester = QRCodeEndpointTester()
    tester.run_comprehensive_test()

if __name__ == "__main__":
    main()