#!/usr/bin/env python3

import requests
import sys
import json
from datetime import datetime

class DeezLinkAPITester:
    def __init__(self, base_url="http://localhost:8001"):
        self.base_url = base_url
        self.token = None
        self.tests_run = 0
        self.tests_passed = 0
        self.session = requests.Session()
        
        # Admin credentials from review request
        self.admin_email = "admin@deezlink.com"
        self.admin_password = "DeezLink2024!"

    def run_test(self, name, method, endpoint, expected_status, data=None, headers=None):
        """Run a single API test"""
        url = f"{self.base_url}/{endpoint.lstrip('/')}"
        test_headers = {'Content-Type': 'application/json'}
        if headers:
            test_headers.update(headers)
        if self.token:
            test_headers['Authorization'] = f'Bearer {self.token}'

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        print(f"   URL: {url}")
        
        try:
            if method == 'GET':
                response = self.session.get(url, headers=test_headers)
            elif method == 'POST':
                response = self.session.post(url, json=data, headers=test_headers)
            elif method == 'DELETE':
                response = self.session.delete(url, headers=test_headers)

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                try:
                    response_data = response.json()
                    print(f"   Response: {json.dumps(response_data, indent=2)[:200]}...")
                except:
                    print(f"   Response: {response.text[:200]}...")
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                print(f"   Response: {response.text[:300]}")

            return success, response.json() if response.text and response.text.strip() else {}

        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            return False, {}

    def test_packs_endpoint(self):
        """Test GET /packs - should return packs without /api prefix"""
        success, response = self.run_test(
            "Get Packs (no /api prefix)",
            "GET", 
            "packs",
            200
        )
        if success and 'packs' in response:
            print(f"   Found {len(response['packs'])} packs")
        return success

    def test_geo_endpoint(self):
        """Test GET /geo - should return geo location data"""
        success, response = self.run_test(
            "Get Geo Location",
            "GET",
            "geo", 
            200
        )
        if success:
            expected_fields = ['country', 'language', 'currency', 'symbol', 'rate', 'ip']
            missing_fields = [field for field in expected_fields if field not in response]
            if missing_fields:
                print(f"   ⚠️  Missing fields: {missing_fields}")
            else:
                print(f"   Country: {response.get('country')}, Currency: {response.get('currency')}")
        return success

    def test_loyalty_tiers_endpoint(self):
        """Test GET /loyalty/tiers - should return loyalty tier info"""
        success, response = self.run_test(
            "Get Loyalty Tiers",
            "GET",
            "loyalty/tiers",
            200
        )
        if success and 'tiers' in response:
            tiers = response['tiers']
            print(f"   Found tiers: {list(tiers.keys())}")
            # Check if all expected tiers are present
            expected_tiers = ['bronze', 'silver', 'gold', 'platinum', 'diamond']
            missing_tiers = [tier for tier in expected_tiers if tier not in tiers]
            if missing_tiers:
                print(f"   ⚠️  Missing tiers: {missing_tiers}")
        return success

    def test_admin_login(self):
        """Test POST /auth/login with admin credentials"""
        success, response = self.run_test(
            "Admin Login",
            "POST",
            "auth/login",
            200,
            data={"email": self.admin_email, "password": self.admin_password}
        )
        if success:
            if 'role' in response and response['role'] == 'admin':
                print(f"   ✅ Admin role confirmed")
                # Extract token from cookies if available
                if 'access_token' in self.session.cookies:
                    self.token = self.session.cookies['access_token']
                    print(f"   ✅ Token extracted from cookies")
            else:
                print(f"   ⚠️  Expected admin role, got: {response.get('role')}")
        return success

    def test_admin_check_ip(self):
        """Test GET /admin/check-ip - should return IP info"""
        success, response = self.run_test(
            "Admin Check IP",
            "GET",
            "admin/check-ip",
            200
        )
        if success:
            expected_fields = ['is_admin', 'ip', 'expected_ip']
            missing_fields = [field for field in expected_fields if field not in response]
            if missing_fields:
                print(f"   ⚠️  Missing fields: {missing_fields}")
            else:
                print(f"   IP: {response.get('ip')}, Is Admin: {response.get('is_admin')}")
        return success

    def test_magic_link_request(self):
        """Test POST /auth/magic - should accept email and send magic link"""
        test_email = "test@example.com"
        success, response = self.run_test(
            "Magic Link Request",
            "POST",
            "auth/magic",
            200,
            data={"email": test_email, "language": "en"}
        )
        if success:
            if 'message' in response and 'email' in response:
                print(f"   ✅ Magic link request processed for: {response.get('email')}")
            else:
                print(f"   ⚠️  Unexpected response format")
        return success

    def test_auth_me_endpoint(self):
        """Test GET /auth/me - should return current user info if logged in"""
        if not self.token:
            print("⚠️  Skipping /auth/me test - no token available")
            return True
            
        success, response = self.run_test(
            "Get Current User",
            "GET",
            "auth/me",
            200
        )
        if success:
            if 'email' in response and 'role' in response:
                print(f"   User: {response.get('email')}, Role: {response.get('role')}")
            else:
                print(f"   ⚠️  Missing user fields in response")
        return success

    def test_admin_stats(self):
        """Test GET /admin/stats - should return admin statistics"""
        if not self.token:
            print("⚠️  Skipping admin stats test - no admin token available")
            return True
            
        success, response = self.run_test(
            "Admin Statistics",
            "GET",
            "admin/stats",
            200
        )
        if success:
            expected_fields = ['total_orders', 'completed_orders', 'total_links', 'available_links', 'total_revenue']
            missing_fields = [field for field in expected_fields if field not in response]
            if missing_fields:
                print(f"   ⚠️  Missing stats fields: {missing_fields}")
            else:
                print(f"   Orders: {response.get('total_orders')}, Links: {response.get('total_links')}")
        return success

def main():
    print("🚀 Starting DeezLink API Tests")
    print("=" * 50)
    
    # Setup
    tester = DeezLinkAPITester()
    
    # Test basic endpoints (no auth required)
    print("\n📋 Testing Basic Endpoints (No Auth)")
    basic_tests = [
        tester.test_packs_endpoint,
        tester.test_geo_endpoint, 
        tester.test_loyalty_tiers_endpoint,
        tester.test_admin_check_ip,
        tester.test_magic_link_request
    ]
    
    for test in basic_tests:
        test()
    
    # Test admin login
    print("\n🔐 Testing Admin Authentication")
    login_success = tester.test_admin_login()
    
    # Test authenticated endpoints
    if login_success:
        print("\n👑 Testing Admin Endpoints")
        auth_tests = [
            tester.test_auth_me_endpoint,
            tester.test_admin_stats
        ]
        
        for test in auth_tests:
            test()
    else:
        print("⚠️  Skipping authenticated tests - admin login failed")

    # Print results
    print("\n" + "=" * 50)
    print(f"📊 Test Results: {tester.tests_passed}/{tester.tests_run} passed")
    
    if tester.tests_passed == tester.tests_run:
        print("🎉 All tests passed!")
        return 0
    else:
        print(f"❌ {tester.tests_run - tester.tests_passed} tests failed")
        return 1

if __name__ == "__main__":
    sys.exit(main())