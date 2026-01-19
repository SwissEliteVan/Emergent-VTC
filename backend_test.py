#!/usr/bin/env python3
"""
Romuo.ch VTC Backend API Test Suite
Tests all backend endpoints for the Swiss VTC service
"""

import asyncio
import aiohttp
import json
import sys
from datetime import datetime
from typing import Dict, Any, Optional

# Backend URL from environment
BACKEND_URL = "https://swissride.preview.emergentagent.com"
API_BASE = f"{BACKEND_URL}/api"

class VTCBackendTester:
    def __init__(self):
        self.session = None
        self.test_results = []
        self.auth_token = None
        self.test_user_data = {
            "email": "test.user@romuo.ch",
            "name": "Jean Dupont",
            "pickup": {
                "latitude": 46.5197,
                "longitude": 6.6323,
                "address": "Gare Cornavin, Genève, Suisse"
            },
            "destination": {
                "latitude": 46.2044,
                "longitude": 6.1432,
                "address": "Montreux, Suisse"
            }
        }
        
    async def setup_session(self):
        """Setup HTTP session"""
        self.session = aiohttp.ClientSession()
        
    async def cleanup_session(self):
        """Cleanup HTTP session"""
        if self.session:
            await self.session.close()
            
    def log_test(self, test_name: str, success: bool, details: str, response_data: Any = None):
        """Log test result"""
        status = "✅ PASS" if success else "❌ FAIL"
        self.test_results.append({
            "test": test_name,
            "status": status,
            "success": success,
            "details": details,
            "response": response_data,
            "timestamp": datetime.now().isoformat()
        })
        print(f"{status} {test_name}: {details}")
        
    async def test_vehicles_endpoint(self):
        """Test GET /api/vehicles - Vehicle types with CHF pricing"""
        try:
            async with self.session.get(f"{API_BASE}/vehicles") as response:
                if response.status == 200:
                    data = await response.json()
                    vehicles = data.get("vehicles", [])
                    
                    # Check if we have the expected vehicle types
                    expected_vehicles = {"eco", "berline", "van"}
                    found_vehicles = {v.get("id") for v in vehicles}
                    
                    if expected_vehicles.issubset(found_vehicles):
                        # Verify pricing for each vehicle type
                        pricing_correct = True
                        pricing_details = []
                        
                        for vehicle in vehicles:
                            vid = vehicle.get("id")
                            if vid == "eco":
                                expected_base, expected_rate = 6.00, 3.00
                            elif vid == "berline":
                                expected_base, expected_rate = 10.00, 5.00
                            elif vid == "van":
                                expected_base, expected_rate = 15.00, 6.00
                            else:
                                continue
                                
                            actual_base = vehicle.get("base_fare")
                            actual_rate = vehicle.get("rate_per_km")
                            
                            if actual_base == expected_base and actual_rate == expected_rate:
                                pricing_details.append(f"{vid}: ✓ {actual_base} CHF + {actual_rate} CHF/km")
                            else:
                                pricing_correct = False
                                pricing_details.append(f"{vid}: ✗ Expected {expected_base}+{expected_rate}, got {actual_base}+{actual_rate}")
                        
                        if pricing_correct:
                            self.log_test("Vehicle Types & Pricing", True, 
                                        f"All vehicle types found with correct CHF pricing. {'; '.join(pricing_details)}", data)
                        else:
                            self.log_test("Vehicle Types & Pricing", False, 
                                        f"Pricing mismatch: {'; '.join(pricing_details)}", data)
                    else:
                        missing = expected_vehicles - found_vehicles
                        self.log_test("Vehicle Types & Pricing", False, 
                                    f"Missing vehicle types: {missing}. Found: {found_vehicles}", data)
                else:
                    error_text = await response.text()
                    self.log_test("Vehicle Types & Pricing", False, 
                                f"HTTP {response.status}: {error_text}")
                    
        except Exception as e:
            self.log_test("Vehicle Types & Pricing", False, f"Request failed: {str(e)}")
            
    async def test_price_calculation(self):
        """Test POST /api/rides/calculate - Price calculation"""
        test_cases = [
            {"vehicle": "eco", "distance": 5.0, "expected": 6.00 + (5.0 * 3.00)},  # 21.00 CHF
            {"vehicle": "berline", "distance": 10.0, "expected": 10.00 + (10.0 * 5.00)},  # 60.00 CHF
            {"vehicle": "van", "distance": 2.5, "expected": 15.00 + (2.5 * 6.00)},  # 30.00 CHF
        ]
        
        for case in test_cases:
            try:
                payload = {
                    "pickup": self.test_user_data["pickup"],
                    "destination": self.test_user_data["destination"],
                    "vehicle_type": case["vehicle"],
                    "distance_km": case["distance"]
                }
                
                async with self.session.post(f"{API_BASE}/rides/calculate", 
                                           json=payload) as response:
                    if response.status == 200:
                        data = await response.json()
                        calculated_price = data.get("price")
                        expected_price = case["expected"]
                        
                        if abs(calculated_price - expected_price) < 0.01:  # Allow for rounding
                            self.log_test(f"Price Calculation ({case['vehicle']})", True,
                                        f"Correct price: {calculated_price} CHF for {case['distance']}km", data)
                        else:
                            self.log_test(f"Price Calculation ({case['vehicle']})", False,
                                        f"Price mismatch: expected {expected_price}, got {calculated_price}", data)
                    else:
                        error_text = await response.text()
                        self.log_test(f"Price Calculation ({case['vehicle']})", False,
                                    f"HTTP {response.status}: {error_text}")
                        
            except Exception as e:
                self.log_test(f"Price Calculation ({case['vehicle']})", False, f"Request failed: {str(e)}")
                
    async def test_auth_session_endpoint(self):
        """Test POST /api/auth/session - Session creation (will fail without valid session_id)"""
        try:
            # Test without session ID
            async with self.session.post(f"{API_BASE}/auth/session") as response:
                if response.status == 400:
                    data = await response.json()
                    if "Session ID required" in data.get("detail", ""):
                        self.log_test("Auth Session (No Session ID)", True,
                                    "Correctly rejects request without X-Session-ID header", data)
                    else:
                        self.log_test("Auth Session (No Session ID)", False,
                                    f"Unexpected error message: {data.get('detail')}", data)
                else:
                    self.log_test("Auth Session (No Session ID)", False,
                                f"Expected 400, got {response.status}")
                    
            # Test with invalid session ID
            headers = {"X-Session-ID": "invalid_session_id_12345"}
            async with self.session.post(f"{API_BASE}/auth/session", 
                                       headers=headers) as response:
                if response.status == 400:
                    data = await response.json()
                    if "Authentication failed" in data.get("detail", ""):
                        self.log_test("Auth Session (Invalid Session ID)", True,
                                    "Correctly rejects invalid session ID", data)
                    else:
                        self.log_test("Auth Session (Invalid Session ID)", False,
                                    f"Unexpected error: {data.get('detail')}", data)
                else:
                    error_text = await response.text()
                    self.log_test("Auth Session (Invalid Session ID)", False,
                                f"Expected 400, got {response.status}: {error_text}")
                    
        except Exception as e:
            self.log_test("Auth Session", False, f"Request failed: {str(e)}")
            
    async def test_auth_me_endpoint(self):
        """Test GET /api/auth/me - Get current user (will fail without valid token)"""
        try:
            # Test without authorization
            async with self.session.get(f"{API_BASE}/auth/me") as response:
                if response.status == 401:
                    data = await response.json()
                    if "Not authenticated" in data.get("detail", ""):
                        self.log_test("Auth Me (No Token)", True,
                                    "Correctly rejects unauthenticated request", data)
                    else:
                        self.log_test("Auth Me (No Token)", False,
                                    f"Unexpected error: {data.get('detail')}", data)
                else:
                    self.log_test("Auth Me (No Token)", False,
                                f"Expected 401, got {response.status}")
                    
            # Test with invalid token
            headers = {"Authorization": "Bearer invalid_token_12345"}
            async with self.session.get(f"{API_BASE}/auth/me", 
                                      headers=headers) as response:
                if response.status == 401:
                    data = await response.json()
                    if "Invalid session" in data.get("detail", ""):
                        self.log_test("Auth Me (Invalid Token)", True,
                                    "Correctly rejects invalid token", data)
                    else:
                        self.log_test("Auth Me (Invalid Token)", False,
                                    f"Unexpected error: {data.get('detail')}", data)
                else:
                    error_text = await response.text()
                    self.log_test("Auth Me (Invalid Token)", False,
                                f"Expected 401, got {response.status}: {error_text}")
                    
        except Exception as e:
            self.log_test("Auth Me", False, f"Request failed: {str(e)}")
            
    async def test_auth_logout_endpoint(self):
        """Test POST /api/auth/logout - Logout"""
        try:
            async with self.session.post(f"{API_BASE}/auth/logout") as response:
                if response.status == 200:
                    data = await response.json()
                    if data.get("message") == "Logged out successfully":
                        self.log_test("Auth Logout", True,
                                    "Logout endpoint works correctly", data)
                    else:
                        self.log_test("Auth Logout", False,
                                    f"Unexpected response: {data}", data)
                else:
                    error_text = await response.text()
                    self.log_test("Auth Logout", False,
                                f"HTTP {response.status}: {error_text}")
                    
        except Exception as e:
            self.log_test("Auth Logout", False, f"Request failed: {str(e)}")
            
    async def test_protected_ride_endpoints(self):
        """Test ride endpoints that require authentication"""
        # Test ride creation without auth
        try:
            ride_payload = {
                "pickup": self.test_user_data["pickup"],
                "destination": self.test_user_data["destination"],
                "vehicle_type": "eco",
                "distance_km": 5.0,
                "price": 21.00
            }
            
            async with self.session.post(f"{API_BASE}/rides", 
                                       json=ride_payload) as response:
                if response.status == 401:
                    data = await response.json()
                    self.log_test("Create Ride (No Auth)", True,
                                "Correctly requires authentication", data)
                else:
                    self.log_test("Create Ride (No Auth)", False,
                                f"Expected 401, got {response.status}")
                    
        except Exception as e:
            self.log_test("Create Ride (No Auth)", False, f"Request failed: {str(e)}")
            
        # Test ride history without auth
        try:
            async with self.session.get(f"{API_BASE}/rides/user/history") as response:
                if response.status == 401:
                    data = await response.json()
                    self.log_test("Ride History (No Auth)", True,
                                "Correctly requires authentication", data)
                else:
                    self.log_test("Ride History (No Auth)", False,
                                f"Expected 401, got {response.status}")
                    
        except Exception as e:
            self.log_test("Ride History (No Auth)", False, f"Request failed: {str(e)}")
            
        # Test get ride without auth
        try:
            async with self.session.get(f"{API_BASE}/rides/test_ride_123") as response:
                if response.status == 401:
                    data = await response.json()
                    self.log_test("Get Ride (No Auth)", True,
                                "Correctly requires authentication", data)
                else:
                    self.log_test("Get Ride (No Auth)", False,
                                f"Expected 401, got {response.status}")
                    
        except Exception as e:
            self.log_test("Get Ride (No Auth)", False, f"Request failed: {str(e)}")
            
    async def test_backend_connectivity(self):
        """Test basic backend connectivity"""
        try:
            async with self.session.get(f"{BACKEND_URL}/") as response:
                if response.status in [200, 404]:  # 404 is OK, means server is running
                    self.log_test("Backend Connectivity", True,
                                f"Backend server is reachable (HTTP {response.status})")
                else:
                    self.log_test("Backend Connectivity", False,
                                f"Unexpected status: {response.status}")
        except Exception as e:
            self.log_test("Backend Connectivity", False, f"Cannot reach backend: {str(e)}")
            
    async def run_all_tests(self):
        """Run all backend tests"""
        print(f"🚀 Starting Romuo.ch VTC Backend API Tests")
        print(f"📍 Backend URL: {BACKEND_URL}")
        print(f"🔗 API Base: {API_BASE}")
        print("=" * 60)
        
        await self.setup_session()
        
        try:
            # Test basic connectivity first
            await self.test_backend_connectivity()
            
            # Test public endpoints
            await self.test_vehicles_endpoint()
            await self.test_price_calculation()
            
            # Test auth endpoints (will show proper error handling)
            await self.test_auth_session_endpoint()
            await self.test_auth_me_endpoint()
            await self.test_auth_logout_endpoint()
            
            # Test protected ride endpoints
            await self.test_protected_ride_endpoints()
            
        finally:
            await self.cleanup_session()
            
        # Print summary
        print("\n" + "=" * 60)
        print("📊 TEST SUMMARY")
        print("=" * 60)
        
        passed = sum(1 for result in self.test_results if result["success"])
        total = len(self.test_results)
        
        for result in self.test_results:
            print(f"{result['status']} {result['test']}")
            
        print(f"\n🎯 Results: {passed}/{total} tests passed")
        
        if passed == total:
            print("🎉 All tests passed!")
            return True
        else:
            print("⚠️  Some tests failed - see details above")
            return False

async def main():
    """Main test runner"""
    tester = VTCBackendTester()
    success = await tester.run_all_tests()
    
    # Return appropriate exit code
    sys.exit(0 if success else 1)

if __name__ == "__main__":
    asyncio.run(main())