package es.urjc.kombo.model;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;

@Entity 
public class Ingredient {
    @Id 
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;
    private String unit;
    private int stock;
    private int alertLimit;

    protected Ingredient(){}

    public Ingredient(String name, String unit, int stock, int alertLimit){
        this.name = name;
        this.unit = unit;
        this.alertLimit = alertLimit;
        this.stock = stock;
    }

    public boolean isLowStock(){
        return stock <= alertLimit;
    }

// setters
    public void setName(String name){
        this.name = name;
    }
    public void setUnit(String unit){
        this.unit = unit;
    }
    public void setStock(int stock){
        this.stock = stock;
    }
    public void setAlertLimit(int alertLimit){
        this.alertLimit =alertLimit;
    }

//getters
    public Long getId(){
        return this.id;
    }
    public String getName(){
        return this.name;
    }
    public String getUnit(){
        return this.unit;
    }
    public int getStock(){
        return this.stock;
    }
    public int getAlertLimit(){
        return this.alertLimit;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) {
            return true;
        }
        if (!(o instanceof Ingredient other)) {
            return false;
        }
        return id != null && id.equals(other.getId());
    }

    @Override
    public int hashCode() {
        return Ingredient.class.hashCode();
    }
}
