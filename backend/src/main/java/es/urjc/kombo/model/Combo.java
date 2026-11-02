package es.urjc.kombo.model;

import java.math.BigDecimal;
import java.util.Collections;
import java.util.HashMap;
import java.util.Map;

import jakarta.persistence.CollectionTable;
import jakarta.persistence.Column;
import jakarta.persistence.ElementCollection;
import jakarta.persistence.Entity;
import jakarta.persistence.MapKeyJoinColumn;
import jakarta.persistence.JoinColumn;

@Entity
public class Combo extends Product {

    @ElementCollection 
    @CollectionTable (name = "combo_product", joinColumns = @JoinColumn(name = "combo_id"))
    @MapKeyJoinColumn (name = "product_id")
    @Column (name = "quantity")
    private Map<Product, Integer> products = new HashMap<>();

    protected Combo() {
    }

    public Combo(String name, BigDecimal price, String description, String category) {
        super(name, price, description, category);
    }

    public void addProduct(Product product, int quantity) {
        products.put(product, quantity);
    }

    public Map<Product, Integer> getProducts() {
        return Collections.unmodifiableMap(products);
    }

    @Override
    public Map<Ingredient, Integer> getIngredientUsage() {
        Map<Ingredient, Integer> usage = super.getIngredientUsage();
        products.forEach((product, units) ->
                product.getIngredientUsage().forEach((ingredient, amount) ->
                        usage.merge(ingredient, amount * units, Integer::sum)));
        return usage;
    }
}
