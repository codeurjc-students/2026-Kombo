package es.urjc.kombo.service;

import java.io.IOException;
import java.io.UncheckedIOException;
import java.nio.charset.StandardCharsets;
import java.sql.Blob;
import java.sql.SQLException;
import java.util.Arrays;

import org.hibernate.engine.jdbc.proxy.BlobProxy;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import es.urjc.kombo.dto.ImageFileDTO;
import es.urjc.kombo.model.Image;

// Pictures stored in the database (profile pictures and, later, products): checks the uploaded files and reads them
@Service
public class ImageService {

    // Same limit as spring.servlet.multipart.max-file-size
    public static final long MAX_SIZE = 1024L * 1024L;

    // The type is taken from the first bytes of the file (its signature), never from the name or the type sent by
    // the browser, so a file that is not really a JPEG, PNG, GIF or WebP picture (for example an SVG with scripts or
    // a renamed document) is rejected
    public Image createImage(MultipartFile file, String text) {
        if (file == null || file.isEmpty()) {
            throw new InvalidImageException("image: the file is empty");
        }
        if (file.getSize() > MAX_SIZE) {
            throw new InvalidImageException("image: the file is bigger than 1 MB");
        }
        byte[] content = readBytes(file);
        String contentType = detectContentType(content);
        if (contentType == null) {
            throw new InvalidImageException("image: the file must be a JPEG, PNG, GIF or WebP picture");
        }
        return new Image(BlobProxy.generateProxy(content), contentType, text);
    }

    // Call it inside a transaction: the binary content (Blob) can only be read while it is open
    public ImageFileDTO toFile(Image image) {
        return new ImageFileDTO(image.getContentType(), new ByteArrayResource(readBytes(image.getData())));
    }

    static String detectContentType(byte[] content) {
        if (startsWith(content, 0, new byte[] { (byte) 0xFF, (byte) 0xD8, (byte) 0xFF })) {
            return "image/jpeg";
        }
        if (startsWith(content, 0, new byte[] { (byte) 0x89, 'P', 'N', 'G', '\r', '\n', 0x1A, '\n' })) {
            return "image/png";
        }
        if (startsWith(content, 0, ascii("GIF87a")) || startsWith(content, 0, ascii("GIF89a"))) {
            return "image/gif";
        }
        if (startsWith(content, 0, ascii("RIFF")) && startsWith(content, 8, ascii("WEBP"))) {
            return "image/webp";
        }
        return null;
    }

    private static boolean startsWith(byte[] content, int offset, byte[] signature) {
        return content.length >= offset + signature.length
                && Arrays.equals(content, offset, offset + signature.length, signature, 0, signature.length);
    }

    private static byte[] ascii(String text) {
        return text.getBytes(StandardCharsets.US_ASCII);
    }

    private static byte[] readBytes(MultipartFile file) {
        try {
            return file.getBytes();
        } catch (IOException exception) {
            throw new UncheckedIOException("The uploaded file could not be read", exception);
        }
    }

    private static byte[] readBytes(Blob blob) {
        try {
            return blob.getBytes(1, (int) blob.length());
        } catch (SQLException exception) {
            throw new IllegalStateException("The image could not be read from the database", exception);
        }
    }
}
