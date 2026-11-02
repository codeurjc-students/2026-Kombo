package es.urjc.kombo.model;

import java.math.BigDecimal;
import java.util.HashMap;
import java.util.Map;

import jakarta.persistence.CascadeType;
import jakarta.persistence.CollectionTable;
import jakarta.persistence.Column;
import jakarta.persistence.ElementCollection;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.MapKeyJoinColumn;
import jakarta.persistence.OneToOne;



@Entity 
public class Product{
    @Id 
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    private String name;
    private BigDecimal price;
    private String description;
    private String category;
    private boolean active = true;

    @OneToOne (cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    private Image image;

    @ElementCollection
    @CollectionTable(name = "product_ingredient", joinColumns = @JoinColumn(name = "product_id"))
    @MapKeyJoinColumn(name = "ingredient_id")
    @Column(name = "quantity")
    private Map<Ingredient, Integer> ingredients = new HashMap<>();



    protected Product(){}


    public Product(String name, BigDecimal price, String description, String category){
        this.name=name;
        this.price = price;
        this.description = description;
        this.category = category;
    }

    //getters
    public Long getId() { 
        return id; 
    }
    public String getName() { 
        return name; 
    }
    public BigDecimal getPrice() { 
        return price; 
    }
    public String getDescription() { 
        return description; 
    }
    public String getCategory() { 
        return category; 
    }
    public boolean isActive(){
        return this.active;
    }
    public Image getImage(){
        return this.image;
    }

    //setters
    public void setName(String name){
        this.name=name;
    }
    public void setPrice(BigDecimal price){
        this.price = price;
    }
    public void setDescription(String description){
        this.description=description;
    }
    public void setCategory(String category){
        this.category = category;
    }
    public void setActive(boolean active) {
        this.active =active;
    }
    public void setImage(Image image){
        this.image=image;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) {
            return true;
        }
        if (!(o instanceof Product other)) {
            return false;
        }
        return id != null && id.equals(other.getId());
    }

    @Override
    public int hashCode() {
        return Product.class.hashCode();
    }


    public void addIngredient(Ingredient ingredient, int quantity) {
        ingredients.put(ingredient, quantity);
    }

    public Map<Ingredient, Integer> getIngredientUsage() {
        return new HashMap<>(ingredients);
    }
}