"""
Backend API Tests for DeezLink - Iteration 5
Tests: Pricing changes, pack structure (2 fixed packs), custom slider range (1-1000), 
and order creation with new quantity limits.
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestPacksEndpoint:
    """Test /api/packs returns exactly 2 fixed packs with correct prices"""
    
    def test_packs_returns_exactly_two_packs(self):
        """Verify /api/packs returns exactly 2 fixed packs (single + famille)"""
        response = requests.get(f"{BASE_URL}/api/packs")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert "packs" in data, "Response should contain 'packs' key"
        packs = data["packs"]
        
        # Should be exactly 2 packs
        assert len(packs) == 2, f"Expected exactly 2 packs, got {len(packs)}"
        print(f"PASS: /api/packs returns exactly 2 packs")
    
    def test_single_pack_correct_price(self):
        """Verify single pack: 1 link, 5€"""
        response = requests.get(f"{BASE_URL}/api/packs")
        assert response.status_code == 200
        
        packs = response.json()["packs"]
        single_pack = next((p for p in packs if p["id"] == "single"), None)
        
        assert single_pack is not None, "Single pack not found"
        assert single_pack["quantity"] == 1, f"Single pack quantity should be 1, got {single_pack['quantity']}"
        assert single_pack["price"] == 5.00, f"Single pack price should be 5.00€, got {single_pack['price']}"
        assert single_pack["unit_price"] == 5.00, f"Single pack unit price should be 5.00€, got {single_pack['unit_price']}"
        print(f"PASS: Single pack has correct pricing (1 link, 5€)")
    
    def test_famille_pack_correct_price(self):
        """Verify famille pack: 5 links, 20€"""
        response = requests.get(f"{BASE_URL}/api/packs")
        assert response.status_code == 200
        
        packs = response.json()["packs"]
        famille_pack = next((p for p in packs if p["id"] == "famille"), None)
        
        assert famille_pack is not None, "Famille pack not found"
        assert famille_pack["quantity"] == 5, f"Famille pack quantity should be 5, got {famille_pack['quantity']}"
        assert famille_pack["price"] == 20.00, f"Famille pack price should be 20.00€, got {famille_pack['price']}"
        assert famille_pack["unit_price"] == 4.00, f"Famille pack unit price should be 4.00€, got {famille_pack['unit_price']}"
        assert famille_pack["discount"] == 20, f"Famille pack discount should be 20%, got {famille_pack['discount']}"
        print(f"PASS: Famille pack has correct pricing (5 links, 20€, 20% discount)")


class TestPricingCalculate:
    """Test /api/pricing/calculate for degressive pricing"""
    
    def test_pricing_quantity_1(self):
        """Quantity 1: 5€/link, no discount"""
        response = requests.get(f"{BASE_URL}/api/pricing/calculate?quantity=1")
        assert response.status_code == 200
        
        data = response.json()
        assert data["quantity"] == 1
        assert data["total"] == 5.00
        assert data["unit_price"] == 5.00
        assert data["discount"] == 0
        print(f"PASS: Quantity 1 pricing correct (5€ total, 5€/link)")
    
    def test_pricing_quantity_5(self):
        """Quantity 5: 4€/link, 20% discount"""
        response = requests.get(f"{BASE_URL}/api/pricing/calculate?quantity=5")
        assert response.status_code == 200
        
        data = response.json()
        assert data["quantity"] == 5
        assert data["total"] == 20.00
        assert data["unit_price"] == 4.00
        assert data["discount"] == 20
        print(f"PASS: Quantity 5 pricing correct (20€ total, 4€/link, 20% discount)")
    
    def test_pricing_quantity_10(self):
        """Quantity 10: 3.50€/link, 30% discount"""
        response = requests.get(f"{BASE_URL}/api/pricing/calculate?quantity=10")
        assert response.status_code == 200
        
        data = response.json()
        assert data["quantity"] == 10
        assert data["total"] == 35.00
        assert data["unit_price"] == 3.50
        assert data["discount"] == 30
        print(f"PASS: Quantity 10 pricing correct (35€ total, 3.50€/link, 30% discount)")
    
    def test_pricing_quantity_50(self):
        """Quantity 50: 2.50€/link, 50% discount"""
        response = requests.get(f"{BASE_URL}/api/pricing/calculate?quantity=50")
        assert response.status_code == 200
        
        data = response.json()
        assert data["quantity"] == 50
        assert data["total"] == 125.00
        assert data["unit_price"] == 2.50
        assert data["discount"] == 50
        print(f"PASS: Quantity 50 pricing correct (125€ total, 2.50€/link, 50% discount)")
    
    def test_pricing_quantity_100(self):
        """Quantity 100: 2€/link, 60% discount"""
        response = requests.get(f"{BASE_URL}/api/pricing/calculate?quantity=100")
        assert response.status_code == 200
        
        data = response.json()
        assert data["quantity"] == 100
        assert data["total"] == 200.00
        assert data["unit_price"] == 2.00
        assert data["discount"] == 60
        print(f"PASS: Quantity 100 pricing correct (200€ total, 2€/link, 60% discount)")
    
    def test_pricing_quantity_500(self):
        """Quantity 500: 1.50€/link, 70% discount"""
        response = requests.get(f"{BASE_URL}/api/pricing/calculate?quantity=500")
        assert response.status_code == 200
        
        data = response.json()
        assert data["quantity"] == 500
        assert data["total"] == 750.00
        assert data["unit_price"] == 1.50
        assert data["discount"] == 70
        print(f"PASS: Quantity 500 pricing correct (750€ total, 1.50€/link, 70% discount)")
    
    def test_pricing_quantity_1000(self):
        """Quantity 1000: 1.50€/link, 70% discount"""
        response = requests.get(f"{BASE_URL}/api/pricing/calculate?quantity=1000")
        assert response.status_code == 200
        
        data = response.json()
        assert data["quantity"] == 1000
        assert data["total"] == 1500.00
        assert data["unit_price"] == 1.50
        assert data["discount"] == 70
        print(f"PASS: Quantity 1000 pricing correct (1500€ total, 1.50€/link, 70% discount)")
    
    def test_pricing_rejects_quantity_over_1000(self):
        """Quantity > 1000 should be rejected"""
        response = requests.get(f"{BASE_URL}/api/pricing/calculate?quantity=1001")
        assert response.status_code == 400, f"Expected 400 for quantity > 1000, got {response.status_code}"
        print(f"PASS: Quantity > 1000 correctly rejected with 400")
    
    def test_pricing_rejects_quantity_zero(self):
        """Quantity 0 should be rejected"""
        response = requests.get(f"{BASE_URL}/api/pricing/calculate?quantity=0")
        assert response.status_code == 400, f"Expected 400 for quantity 0, got {response.status_code}"
        print(f"PASS: Quantity 0 correctly rejected with 400")
    
    def test_pricing_rejects_negative_quantity(self):
        """Negative quantity should be rejected"""
        response = requests.get(f"{BASE_URL}/api/pricing/calculate?quantity=-5")
        assert response.status_code == 400, f"Expected 400 for negative quantity, got {response.status_code}"
        print(f"PASS: Negative quantity correctly rejected with 400")


class TestCustomOrderCreation:
    """Test /api/orders/create-custom accepts quantity up to 1000"""
    
    def test_create_custom_order_quantity_1000(self):
        """Custom order with quantity 1000 should succeed"""
        response = requests.post(f"{BASE_URL}/api/orders/create-custom", json={
            "quantity": 1000,
            "email": "test_custom_1000@example.com"
        })
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert data["quantity"] == 1000
        assert data["price"] == 1500.00
        assert "order_id" in data
        print(f"PASS: Custom order with quantity 1000 created successfully (order_id: {data['order_id']})")
    
    def test_create_custom_order_quantity_500(self):
        """Custom order with quantity 500 should succeed"""
        response = requests.post(f"{BASE_URL}/api/orders/create-custom", json={
            "quantity": 500,
            "email": "test_custom_500@example.com"
        })
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert data["quantity"] == 500
        assert data["price"] == 750.00
        print(f"PASS: Custom order with quantity 500 created successfully")
    
    def test_create_custom_order_rejects_over_1000(self):
        """Custom order with quantity > 1000 should be rejected"""
        response = requests.post(f"{BASE_URL}/api/orders/create-custom", json={
            "quantity": 1001,
            "email": "test_over_limit@example.com"
        })
        assert response.status_code == 400, f"Expected 400 for quantity > 1000, got {response.status_code}"
        print(f"PASS: Custom order with quantity > 1000 correctly rejected")
    
    def test_create_custom_order_rejects_zero(self):
        """Custom order with quantity 0 should be rejected"""
        response = requests.post(f"{BASE_URL}/api/orders/create-custom", json={
            "quantity": 0,
            "email": "test_zero@example.com"
        })
        assert response.status_code == 400, f"Expected 400 for quantity 0, got {response.status_code}"
        print(f"PASS: Custom order with quantity 0 correctly rejected")


class TestFixedPackOrderCreation:
    """Test /api/orders/create for fixed packs"""
    
    def test_create_order_single_pack(self):
        """Create order for single pack"""
        response = requests.post(f"{BASE_URL}/api/orders/create", json={
            "pack_id": "single",
            "email": "test_single_pack@example.com"
        })
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert data["quantity"] == 1
        assert data["price"] == 5.00
        assert "order_id" in data
        print(f"PASS: Single pack order created successfully")
    
    def test_create_order_famille_pack(self):
        """Create order for famille pack"""
        response = requests.post(f"{BASE_URL}/api/orders/create", json={
            "pack_id": "famille",
            "email": "test_famille_pack@example.com"
        })
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert data["quantity"] == 5
        assert data["price"] == 20.00
        assert "order_id" in data
        print(f"PASS: Famille pack order created successfully")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
