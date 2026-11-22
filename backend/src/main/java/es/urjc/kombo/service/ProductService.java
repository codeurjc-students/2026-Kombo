package es.urjc.kombo.service;

import java.util.Comparator;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import es.urjc.kombo.dto.AdminProductDTO;
import es.urjc.kombo.dto.ComboItemRequestDTO;
import es.urjc.kombo.dto.ComboRequestDTO;
import es.urjc.kombo.dto.ImageFileDTO;
import es.urjc.kombo.dto.IngredientQuantityDTO;
import es.urjc.kombo.dto.ProductDTO;
import es.urjc.kombo.dto.ProductDetailDTO;
import es.urjc.kombo.dto.ProductMapper;
import es.urjc.kombo.dto.ProductReferenceDTO;
import es.urjc.kombo.dto.ProductRequestDTO;
import es.urjc.kombo.model.Combo;
import es.urjc.kombo.model.Image;
import es.urjc.kombo.model.Ingredient;
import es.urjc.kombo.model.Product;
import es.urjc.kombo.repository.ComboRepository;
import es.urjc.kombo.repository.IngredientRepository;
import es.urjc.kombo.repository.ProductRepository;

// The menu (active products and kombos, for everyone) and its management by the administrator. Products are never
// deleted, because the orders keep a reference to them: the administrator deactivates them instead.
@Service
public class ProductService {

    // Category of every kombo (the code calls them combos)
    public static final String COMBOS = "Combos";

    private final ProductRepository productRepository;
    private final ComboRepository comboRepository;
    private final IngredientRepository ingredientRepository;
    private final ProductMapper productMapper;
    private final ImageService imageService;

    public ProductService(ProductRepository productRepository, ComboRepository comboRepository,
            IngredientRepository ingredientRepository, ProductMapper productMapper, ImageService imageService) {
        this.productRepository = productRepository;
        this.comboRepository = comboRepository;
        this.ingredientRepository = ingredientRepository;
        this.productMapper = productMapper;
        this.imageService = imageService;
    }

    // Active products of the menu, optionally filtered by category, one page at a time
    @Transactional(readOnly = true)
    public Page<ProductDTO> findActive(String category, Pageable pageable) {
        Page<Product> products = (category == null || category.isBlank())
                ? productRepository.findByActiveTrue(pageable)
                : productRepository.findByActiveTrueAndCategoryIgnoreCase(category, pageable);
        return products.map(productMapper::toBasicDTO);
    }

    // The mapping runs inside the transaction because the ingredients and the products of a combo are loaded lazily
    @Transactional(readOnly = true)
    public ProductDetailDTO findById(long id) {
        return productMapper.toDetailDTO(findActiveProduct(id));
    }

    // The image is read inside the transaction because its binary content (Blob) is only available while it is open
    @Transactional(readOnly = true)
    public ImageFileDTO findImage(long id) {
        return toImageFile(findActiveProduct(id), id);
    }

    // Management: active and inactive products and kombos, with the optional filters active and combo
    @Transactional(readOnly = true)
    public Page<AdminProductDTO> findForManagement(Boolean active, Boolean combo, Pageable pageable) {
        return productRepository.findForManagement(active, combo, pageable).map(productMapper::toAdminDTO);
    }

    // Management: a product or kombo, also when it is not active
    @Transactional(readOnly = true)
    public AdminProductDTO findForManagement(long id) {
        return productMapper.toAdminDTO(findProduct(id));
    }

    @Transactional(readOnly = true)
    public ImageFileDTO findImageForManagement(long id) {
        return toImageFile(findProduct(id), id);
    }

    // Creates an active product (not a kombo) with its ingredients
    @Transactional
    public AdminProductDTO createProduct(ProductRequestDTO request) {
        Product product = new Product(request.name().trim(), request.price(), blankToNull(request.description()),
                request.category());
        product.replaceIngredients(findIngredients(request.ingredients()));
        return productMapper.toAdminDTO(productRepository.save(product));
    }

    // Changes a product (not a kombo) and replaces its ingredients. The orders already placed keep the name and
    // price they had.
    @Transactional
    public AdminProductDTO updateProduct(long id, ProductRequestDTO request) {
        Product product = findProduct(id);
        if (product instanceof Combo) {
            throw new InvalidProductException("Product " + id + " is a combo: change it with /api/v1/admin/combos");
        }
        product.setName(request.name().trim());
        product.setPrice(request.price());
        product.setDescription(blankToNull(request.description()));
        product.setCategory(request.category());
        product.replaceIngredients(findIngredients(request.ingredients()));
        return productMapper.toAdminDTO(product);
    }

    // Creates an active kombo with its products and the price written by the administrator
    @Transactional
    public AdminProductDTO createCombo(ComboRequestDTO request) {
        Combo combo = new Combo(request.name().trim(), request.price(), blankToNull(request.description()), COMBOS);
        combo.replaceProducts(findComboProducts(request.products()));
        return productMapper.toAdminDTO(comboRepository.save(combo));
    }

    @Transactional
    public AdminProductDTO updateCombo(long id, ComboRequestDTO request) {
        Combo combo = comboRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Combo " + id + " not found"));
        combo.setName(request.name().trim());
        combo.setPrice(request.price());
        combo.setDescription(blankToNull(request.description()));
        combo.replaceProducts(findComboProducts(request.products()));
        return productMapper.toAdminDTO(combo);
    }

    // Activates or deactivates a product or a kombo. A product cannot be deactivated while an active kombo
    // includes it, and a kombo cannot be activated while it includes a deactivated product (409 with their names).
    @Transactional
    public AdminProductDTO changeActive(long id, boolean active) {
        Product product = findProduct(id);
        if (!active && product.isActive() && !(product instanceof Combo)) {
            List<ProductReferenceDTO> combos = comboRepository.findActiveCombosWith(product).stream()
                    .map(ProductService::toReference).toList();
            if (!combos.isEmpty()) {
                throw new ProductInUseException("The product is in active combos", combos);
            }
        }
        if (active && !product.isActive() && product instanceof Combo combo) {
            List<ProductReferenceDTO> inactive = combo.getProducts().keySet().stream()
                    .filter(item -> !item.isActive()).map(ProductService::toReference)
                    .sorted(Comparator.comparing(ProductReferenceDTO::name)).toList();
            if (!inactive.isEmpty()) {
                throw new ProductInUseException("The combo includes deactivated products", inactive);
            }
        }
        product.setActive(active);
        return productMapper.toAdminDTO(product);
    }

    // Uploads or replaces the picture of a product or kombo (10 MB at most; the previous one is deleted:
    // orphanRemoval). flush saves the new picture now, so the answer already has its id.
    @Transactional
    public AdminProductDTO updateImage(long id, MultipartFile file) {
        Product product = findProduct(id);
        product.setImage(imageService.createImage(file, product.getName(), ImageService.PRODUCT_PICTURE_MAX_SIZE));
        productRepository.flush();
        return productMapper.toAdminDTO(product);
    }

    private Map<Ingredient, Integer> findIngredients(List<IngredientQuantityDTO> items) {
        Map<Ingredient, Integer> ingredients = new LinkedHashMap<>();
        Set<Long> ids = new HashSet<>();
        for (IngredientQuantityDTO item : items) {
            if (!ids.add(item.ingredientId())) {
                throw new InvalidProductException("ingredients: ingredient " + item.ingredientId() + " is repeated");
            }
            Ingredient ingredient = ingredientRepository.findById(item.ingredientId())
                    .orElseThrow(() -> new InvalidProductException(
                            "ingredients: ingredient " + item.ingredientId() + " does not exist"));
            ingredients.put(ingredient, item.quantity());
        }
        return ingredients;
    }

    // The products of a kombo: active products that are not kombos, each one once, with at least 2 units in total
    private Map<Product, Integer> findComboProducts(List<ComboItemRequestDTO> items) {
        Map<Product, Integer> products = new LinkedHashMap<>();
        Set<Long> ids = new HashSet<>();
        int units = 0;
        for (ComboItemRequestDTO item : items) {
            if (!ids.add(item.productId())) {
                throw new InvalidProductException("products: product " + item.productId() + " is repeated");
            }
            Product product = productRepository.findByIdAndActiveTrue(item.productId())
                    .orElseThrow(() -> new InvalidProductException(
                            "products: product " + item.productId() + " does not exist or is not active"));
            if (product instanceof Combo) {
                throw new InvalidProductException("products: a combo cannot include another combo");
            }
            products.put(product, item.quantity());
            units += item.quantity();
        }
        if (units < 2) {
            throw new InvalidProductException("products: a combo has at least 2 units");
        }
        return products;
    }

    private ImageFileDTO toImageFile(Product product, long id) {
        Image image = product.getImage();
        if (image == null) {
            throw new ResourceNotFoundException("Product " + id + " has no image");
        }
        return imageService.toFile(image);
    }

    private Product findActiveProduct(long id) {
        return productRepository.findByIdAndActiveTrue(id)
                .orElseThrow(() -> new ResourceNotFoundException("Product " + id + " not found"));
    }

    private Product findProduct(long id) {
        return productRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Product " + id + " not found"));
    }

    private static ProductReferenceDTO toReference(Product product) {
        return new ProductReferenceDTO(product.getId(), product.getName());
    }

    private static String blankToNull(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }
}
