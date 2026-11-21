package es.urjc.kombo.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.io.IOException;
import java.nio.charset.StandardCharsets;

import org.hibernate.engine.jdbc.proxy.BlobProxy;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;
import org.springframework.mock.web.MockMultipartFile;

import es.urjc.kombo.dto.ImageFileDTO;
import es.urjc.kombo.model.Image;

class ImageServiceTest {

    // First bytes of a real JPEG file
    static final byte[] JPEG = { (byte) 0xFF, (byte) 0xD8, (byte) 0xFF, (byte) 0xE0, 0, 0x10, 'J', 'F', 'I', 'F' };

    private final ImageService imageService = new ImageService();

    @Test
    void createImageKeepsTheContentAndTheDetectedType() throws Exception {
        // The browser says it is a PNG, but the bytes are a JPEG: the bytes decide
        Image image = imageService.createImage(new MockMultipartFile("image", "photo.png", "image/png", JPEG), "Ana");

        assertThat(image.getContentType()).isEqualTo("image/jpeg");
        assertThat(image.getText()).isEqualTo("Ana");
        assertThat(image.getData().getBytes(1, JPEG.length)).containsExactly(JPEG);
    }

    @ParameterizedTest
    @CsvSource({
        "89504E470D0A1A0A0000, image/png",
        "4749463839610100, image/gif",
        "4749463837610100, image/gif",
        "52494646000000005745425056503820, image/webp",
    })
    void detectsTheOtherPictureTypes(String hexBytes, String contentType) {
        assertThat(ImageService.detectContentType(hex(hexBytes))).isEqualTo(contentType);
    }

    @Test
    void rejectsAFileThatIsNotAPicture() {
        byte[] svg = "<svg xmlns=\"http://www.w3.org/2000/svg\"><script>alert(1)</script></svg>"
                .getBytes(StandardCharsets.UTF_8);

        assertThatThrownBy(() -> imageService.createImage(
                new MockMultipartFile("image", "photo.jpg", "image/jpeg", svg), "Ana"))
                .isInstanceOf(InvalidImageException.class)
                .hasMessage("image: the file must be a JPEG, PNG, GIF or WebP picture");
    }

    @Test
    void rejectsAnEmptyFileAndAFileBiggerThan1Megabyte() {
        assertThatThrownBy(() -> imageService.createImage(
                new MockMultipartFile("image", "empty.jpg", "image/jpeg", new byte[0]), "Ana"))
                .hasMessage("image: the file is empty");
        assertThatThrownBy(() -> imageService.createImage(null, "Ana"))
                .hasMessage("image: the file is empty");

        byte[] big = new byte[(int) ImageService.MAX_SIZE + 1];
        System.arraycopy(JPEG, 0, big, 0, JPEG.length);
        assertThatThrownBy(() -> imageService.createImage(
                new MockMultipartFile("image", "big.jpg", "image/jpeg", big), "Ana"))
                .hasMessage("image: the file is bigger than 1 MB");
    }

    @Test
    void toFileReadsTheContentOfTheImage() throws IOException {
        ImageFileDTO file = imageService.toFile(new Image(BlobProxy.generateProxy(JPEG), "image/jpeg", "Ana"));

        assertThat(file.contentType()).isEqualTo("image/jpeg");
        assertThat(file.content().getContentAsByteArray()).containsExactly(JPEG);
    }

    private static byte[] hex(String text) {
        byte[] bytes = new byte[text.length() / 2];
        for (int i = 0; i < bytes.length; i++) {
            bytes[i] = (byte) Integer.parseInt(text.substring(2 * i, 2 * i + 2), 16);
        }
        return bytes;
    }
}
