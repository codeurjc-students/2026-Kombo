package es.urjc.kombo.model;

import java.sql.Blob;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Lob;
import jakarta.persistence.Id;

@Entity
public class Image {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Binary content; the column keeps its original name so existing databases still work
    @Lob
    @Column(name = "image")
    private Blob data;

    // MIME type of the image (for example image/jpeg), sent in the Content-Type header
    private String contentType;

    private String text;

    public Image() {
    }

    public Image(Blob data, String contentType, String text) {
        this.data = data;
        this.contentType = contentType;
        this.text = text;
    }

    public Long getId() {
        return id;
    }

    public Blob getData() {
        return data;
    }

    public void setData(Blob data) {
        this.data = data;
    }

    public String getContentType() {
        return contentType;
    }

    public void setContentType(String contentType) {
        this.contentType = contentType;
    }

    public String getText() {
        return text;
    }

    public void setText(String text) {
        this.text = text;
    }

    @Override
    public String toString() {
        return "Image [" +
                "id=" + id +
                ", text='" + text + ']';
    }

}