#!/usr/bin/env python3

import requests
import sys
import json
from datetime import datetime

class DeezLinkAPITester:
    def __init__(self, base_url="https://network-linker.preview.emergentagent.com"):
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
        # Ensure endpoint starts with /api prefix for Kubernetes compatibility
        if not endpoint.startswith('api/'):
            endpoint = f"api/{endpoint.lstrip('/')}"
        url = f"{self.base_url}/{endpoint}"
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
        """Test GET /api/packs - should return packs"""
        success, response = self.run_test(
            "Get Packs",
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
        """Test GET /admin/stats - should return admin statistics including security stats"""
        if not self.token:
            print("⚠️  Skipping admin stats test - no admin token available")
            return True
            
        success, response = self.run_test(
            "Admin Statistics with Security Stats",
            "GET",
            "admin/stats",
            200
        )
        if success:
            expected_fields = ['total_orders', 'completed_orders', 'total_links', 'available_links', 'total_revenue', 'security']
            missing_fields = [field for field in expected_fields if field not in response]
            if missing_fields:
                print(f"   ⚠️  Missing stats fields: {missing_fields}")
            else:
                print(f"   Orders: {response.get('total_orders')}, Links: {response.get('total_links')}")
                
                # Check security stats
                security = response.get('security', {})
                if security:
                    print(f"   Security - Blocked IPs: {security.get('blocked_ips', 0)}, Failed Logins (24h): {security.get('failed_logins_24h', 0)}")
                else:
                    print(f"   ⚠️  Missing security stats")
        return success

    def test_admin_security_logs(self):
        """Test GET /admin/security/logs - should return security event logs"""
        if not self.token:
            print("⚠️  Skipping security logs test - no admin token available")
            return True
            
        success, response = self.run_test(
            "Admin Security Logs",
            "GET",
            "admin/security/logs",
            200
        )
        if success:
            expected_fields = ['logs', 'total', 'event_types']
            missing_fields = [field for field in expected_fields if field not in response]
            if missing_fields:
                print(f"   ⚠️  Missing security logs fields: {missing_fields}")
            else:
                logs = response.get('logs', [])
                print(f"   Found {len(logs)} security logs, Total: {response.get('total', 0)}")
                if logs:
                    print(f"   Recent event: {logs[0].get('event', 'N/A')}")
        return success

    def test_admin_blocked_list(self):
        """Test GET /admin/security/blocked - should return blocked IPs and emails"""
        if not self.token:
            print("⚠️  Skipping blocked list test - no admin token available")
            return True
            
        success, response = self.run_test(
            "Admin Blocked List",
            "GET",
            "admin/security/blocked",
            200
        )
        if success:
            expected_fields = ['blocked_ips', 'blocked_emails']
            missing_fields = [field for field in expected_fields if field not in response]
            if missing_fields:
                print(f"   ⚠️  Missing blocked list fields: {missing_fields}")
            else:
                blocked_ips = response.get('blocked_ips', [])
                blocked_emails = response.get('blocked_emails', [])
                print(f"   Blocked IPs: {len(blocked_ips)}, Blocked Emails: {len(blocked_emails)}")
        return success

    def test_admin_block_ip(self):
        """Test POST /admin/security/block-ip - should manually block an IP"""
        if not self.token:
            print("⚠️  Skipping block IP test - no admin token available")
            return True
            
        test_ip = "192.168.1.100"  # Test IP
        success, response = self.run_test(
            "Admin Block IP",
            "POST",
            "admin/security/block-ip",
            200,
            data={"ip": test_ip, "duration": 300}  # 5 minutes
        )
        if success:
            if 'message' in response:
                print(f"   ✅ IP blocking response: {response.get('message')}")
            else:
                print(f"   ⚠️  Unexpected response format")
        return success

    def test_admin_users_by_country(self):
        """Test GET /admin/users/by-country - should return users grouped by country"""
        if not self.token:
            print("⚠️  Skipping users by country test - no admin token available")
            return True
            
        success, response = self.run_test(
            "Admin Users by Country",
            "GET",
            "admin/users/by-country",
            200
        )
        if success:
            if 'countries' in response:
                countries = response.get('countries', {})
                print(f"   Found users from {len(countries)} countries")
                if countries:
                    # Show top country
                    top_country = max(countries.items(), key=lambda x: x[1].get('count', 0))
                    print(f"   Top country: {top_country[0]} with {top_country[1].get('count', 0)} users")
            else:
                print(f"   ⚠️  Missing countries field")
        return success

    def test_admin_analytics(self):
        """Test GET /admin/analytics - should return analytics data"""
        if not self.token:
            print("⚠️  Skipping analytics test - no admin token available")
            return True
            
        success, response = self.run_test(
            "Admin Analytics",
            "GET",
            "admin/analytics",
            200
        )
        if success:
            expected_fields = ['orders_by_day', 'top_customers', 'pack_popularity', 'conversion_rate']
            missing_fields = [field for field in expected_fields if field not in response]
            if missing_fields:
                print(f"   ⚠️  Missing analytics fields: {missing_fields}")
            else:
                orders_by_day = response.get('orders_by_day', [])
                top_customers = response.get('top_customers', [])
                conversion_rate = response.get('conversion_rate', 0)
                print(f"   Orders by day: {len(orders_by_day)} entries, Top customers: {len(top_customers)}, Conversion: {conversion_rate}%")
        return success

    def test_rate_limiting_magic_link(self):
        """Test rate limiting on POST /auth/magic - should block after 3 requests per email"""
        print("\n🛡️  Testing Rate Limiting on Magic Link")
        test_email = "ratelimit2@test.com"  # Use different email to avoid previous rate limit
        
        # Make 4 requests rapidly to trigger rate limit (limit is 3 per email per 5 min)
        success_count = 0
        rate_limited = False
        
        for i in range(4):
            expected_status = 200 if i < 3 else 429  # Expect 429 on 4th request
            success, response = self.run_test(
                f"Magic Link Rate Limit Test {i+1}/4",
                "POST",
                "auth/magic",
                expected_status,
                data={"email": test_email, "language": "en"}
            )
            
            if i < 3 and success:
                success_count += 1
            elif i >= 3 and success:  # 429 response is considered success for rate limit test
                rate_limited = True
                print(f"   ✅ Rate limiting triggered as expected on request {i+1}")
                break
        
        if success_count >= 3 and rate_limited:
            print(f"   ✅ Rate limiting working correctly (3 requests per email per 5 min)")
            return True
        else:
            print(f"   ⚠️  Rate limiting may not be working properly")
            return False

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
            tester.test_admin_stats,
            tester.test_admin_security_logs,
            tester.test_admin_blocked_list,
            tester.test_admin_block_ip,
            tester.test_admin_users_by_country,
            tester.test_admin_analytics
        ]
        
        for test in auth_tests:
            test()
            
        # Test rate limiting (separate section)
        print("\n🛡️  Testing Security Features")
        tester.test_rate_limiting_magic_link()
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