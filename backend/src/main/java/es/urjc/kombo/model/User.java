package es.urjc.kombo.model;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

import jakarta.persistence.CascadeType;
import jakarta.persistence.CollectionTable;
import jakarta.persistence.Column;
import jakarta.persistence.ElementCollection;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;


@Entity 
@Table(name = "users")
public class User {
    
    public enum Role { CUSTOMER, EMPLOYEE, ADMIN }

    @Id 
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;
    private String surname;
    
    @Column (unique = true, nullable = false)
    private String email;
    
    private String phone;
    private String password;
    @Enumerated(EnumType.STRING)
    private Role role;

    @ElementCollection
    @CollectionTable (name = "user_address", joinColumns = @JoinColumn(name = "user_id"))
    @Column(name = "address")
    private List<String> addresses = new ArrayList<>();

    @OneToOne (cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    private Image image; 

    protected User(){}

    public User(String name, String surname,String email, String phone, String password, Role role){
        this.name = name;
        this.surname=surname;
        this.phone=phone;
        this.password =password;
        this.role =role;
        this.email=email;

    }

    
    public Long getId() {
        return id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getSurname() {
        return surname;
    }

    public void setSurname(String surname) {
        this.surname = surname;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getPhone() {
        return phone;
    }

    public void setPhone(String phone) {
        this.phone = phone;
    }

    public String getPassword() {
        return password;
    }

    public void setPassword(String password) {
        this.password = password;
    }

    public Role getRole() {
        return role;
    }

    public void setRole(Role role) {
        this.role = role;
    }

    public List<String> getAddresses() {
        return Collections.unmodifiableList(addresses);
    }

    public void addAddress(String address) {
        addresses.add(address);
    }

    public void removeAddress(String address) {
        addresses.remove(address);
    }

    public Image getImage() {
        return image;
    }

    public void setImage(Image image) {
        this.image = image;
    }



    
}
