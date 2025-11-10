// ============================================
// CONFIGURACIÓN FONDO 360
// ============================================

let camera, scene, renderer;
let sphere, texture;
let isUserInteracting = false;
let onPointerDownMouseX = 0, onPointerDownMouseY = 0;
let lon = 0, onPointerDownLon = 0;
let lat = 0, onPointerDownLat = 0;
let phi = 0, theta = 0;

// Inicializar escena 360
function init360Background() {
    const canvas = document.getElementById('bg360');

    // Crear cámara
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 1, 1100);
    camera.target = new THREE.Vector3(0, 0, 0);

    // Crear escena
    scene = new THREE.Scene();

    // Crear geometría de esfera
    const geometry = new THREE.SphereGeometry(500, 60, 40);
    geometry.scale(-1, 1, 1); // Invertir para ver el interior

    // Cargar textura 360
    const textureLoader = new THREE.TextureLoader();

    // Intentar cargar la textura del office interior
    textureLoader.load(
        'background360.jpg',
        function(loadedTexture) {
            texture = loadedTexture;
            const material = new THREE.MeshBasicMaterial({ map: texture });
            sphere = new THREE.Mesh(geometry, material);
            scene.add(sphere);
        },
        undefined,
        function(error) {
            console.log('Error cargando textura 360, usando color de respaldo');
            const material = new THREE.MeshBasicMaterial({
                color: 0x1a1a2e,
                wireframe: false
            });
            sphere = new THREE.Mesh(geometry, material);
            scene.add(sphere);
        }
    );

    // Crear renderer
    renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);

    // Event listeners para interacción
    canvas.addEventListener('pointerdown', onPointerDown);
    canvas.addEventListener('pointermove', onPointerMove);
    canvas.addEventListener('pointerup', onPointerUp);
    canvas.addEventListener('wheel', onDocumentMouseWheel);
    canvas.style.touchAction = 'none';

    // Resize listener
    window.addEventListener('resize', onWindowResize);

    // Iniciar animación
    animate();
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function onPointerDown(event) {
    isUserInteracting = true;
    onPointerDownMouseX = event.clientX;
    onPointerDownMouseY = event.clientY;
    onPointerDownLon = lon;
    onPointerDownLat = lat;
}

function onPointerMove(event) {
    if (isUserInteracting) {
        lon = (onPointerDownMouseX - event.clientX) * 0.1 + onPointerDownLon;
        lat = (event.clientY - onPointerDownMouseY) * 0.1 + onPointerDownLat;
    }
}

function onPointerUp() {
    isUserInteracting = false;
}

function onDocumentMouseWheel(event) {
    const fov = camera.fov + event.deltaY * 0.05;
    camera.fov = THREE.MathUtils.clamp(fov, 10, 75);
    camera.updateProjectionMatrix();
}

function animate() {
    requestAnimationFrame(animate);
    update();
}

function update() {
    // Auto-rotación suave cuando no hay interacción
    if (!isUserInteracting) {
        lon += 0.05;
    }

    lat = Math.max(-85, Math.min(85, lat));
    phi = THREE.MathUtils.degToRad(90 - lat);
    theta = THREE.MathUtils.degToRad(lon);

    camera.target.x = 500 * Math.sin(phi) * Math.cos(theta);
    camera.target.y = 500 * Math.cos(phi);
    camera.target.z = 500 * Math.sin(phi) * Math.sin(theta);

    camera.lookAt(camera.target);
    renderer.render(scene, camera);
}

// ============================================
// SISTEMA DE PESTAÑAS
// ============================================

function initTabs() {
    const tabButtons = document.querySelectorAll('.tab-button');
    const tabContents = document.querySelectorAll('.tab-content');

    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            // Remover active de todos los botones y contenidos
            tabButtons.forEach(btn => btn.classList.remove('active'));
            tabContents.forEach(content => content.classList.remove('active'));

            // Agregar active al botón clickeado
            button.classList.add('active');

            // Mostrar el contenido correspondiente
            const tabId = button.getAttribute('data-tab');
            const tabContent = document.getElementById(tabId);
            if (tabContent) {
                tabContent.classList.add('active');
            }

            // Scroll suave al inicio del contenido
            document.querySelector('.tabs-content').scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        });
    });
}

// ============================================
// SISTEMA DE MODAL DE PRODUCTOS
// ============================================

const modal = document.getElementById('productModal');
const closeModalBtn = document.querySelector('.close-modal');

// Cerrar modal con X
closeModalBtn.addEventListener('click', closeModal);

// Cerrar modal al hacer click fuera del contenido
modal.addEventListener('click', (e) => {
    if (e.target === modal) {
        closeModal();
    }
});

// Cerrar modal con tecla ESC
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal.classList.contains('active')) {
        closeModal();
    }
});

function closeModal() {
    modal.classList.remove('active');
    document.body.style.overflow = 'auto';
}

function openModal() {
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

// ============================================
// CÁLCULOS DE PRECIOS
// ============================================

function calculatePrices(productData) {
    const listPrice = productData.price;
    const bonus = productData.bonus || 0;
    const cashDiscount = productData.cashDiscount || 8;
    const ivaRate = productData.ivaRate || 10.5;
    const category = productData.category;

    let purchasePrice, purchasePriceCash, purchasePriceFinanced;
    let salePrice, salePriceCash, salePriceFinanced;
    let profitMargin, profitMarginCash, profitMarginFinanced;
    let profitPercent, profitPercentCash, profitPercentFinanced;

    // Calcular precio de compra según categoría
    if (category === 'gas-residencial') {
        // Gas Residenciales (DÓLAR BILLETE): 0.8 del precio de lista
        purchasePrice = listPrice * 0.8;
        purchasePriceCash = purchasePrice * (1 - cashDiscount / 100);
        purchasePriceFinanced = purchasePrice;
    } else if (category === 'gas-industrial') {
        // Gas Industriales (DÓLAR BNA): 20% de bonificación
        purchasePrice = listPrice * (1 - bonus / 100);
        purchasePriceCash = purchasePrice * (1 - cashDiscount / 100);
        purchasePriceFinanced = purchasePrice;
    } else {
        // Otros productos: bonificación normal
        purchasePrice = listPrice * (1 - bonus / 100);
        purchasePriceCash = purchasePrice * (1 - cashDiscount / 100);
        purchasePriceFinanced = purchasePrice;
    }

    // Precio de venta (con IVA)
    salePrice = purchasePrice * (1 + ivaRate / 100);
    salePriceCash = purchasePriceCash * (1 + ivaRate / 100);
    salePriceFinanced = purchasePriceFinanced * (1 + ivaRate / 100);

    // Margen de ganancia (ejemplo: 30% sobre precio de compra)
    const profitRate = 0.30;
    profitMargin = purchasePrice * profitRate;
    profitMarginCash = purchasePriceCash * profitRate;
    profitMarginFinanced = purchasePriceFinanced * profitRate;

    profitPercent = (profitMargin / purchasePrice) * 100;
    profitPercentCash = (profitMarginCash / purchasePriceCash) * 100;
    profitPercentFinanced = (profitMarginFinanced / purchasePriceFinanced) * 100;

    return {
        listPrice,
        purchasePrice,
        purchasePriceCash,
        purchasePriceFinanced,
        salePrice,
        salePriceCash,
        salePriceFinanced,
        profitMargin,
        profitMarginCash,
        profitMarginFinanced,
        profitPercent,
        profitPercentCash,
        profitPercentFinanced,
        bonus,
        cashDiscount,
        ivaRate
    };
}

// ============================================
// LLENAR MODAL CON DATOS DEL PRODUCTO
// ============================================

function fillModal(productData) {
    const prices = calculatePrices(productData);

    // Información básica
    document.getElementById('modalProductName').textContent = productData.name;
    document.getElementById('modalProductSpecs').innerHTML = `
        <strong>Potencia:</strong> ${productData.power || 'N/A'}<br>
        <strong>Tensión:</strong> ${productData.voltage || 'N/A'}<br>
        <strong>Motor:</strong> ${productData.motor || 'N/A'}<br>
        <strong>Arranque:</strong> ${productData.start || 'N/A'}<br>
        <strong>Peso:</strong> ${productData.weight || 'N/A'}
    `;

    // Imagen del producto
    const imgElement = document.getElementById('modalProductImg');
    imgElement.src = productData.image || 'placeholder-product.jpg';
    imgElement.onerror = function() {
        this.src = 'https://via.placeholder.com/400x300/fd6600/ffffff?text=' + encodeURIComponent(productData.name);
    };

    // PRECIOS PÚBLICOS (siempre visibles)
    const pvpConIVA = prices.listPrice * (1 + prices.ivaRate / 100);
    const ivaAmount = prices.listPrice * (prices.ivaRate / 100);

    document.getElementById('modalSalePricePublic').textContent = formatUSD(pvpConIVA);
    document.getElementById('modalListPrice').textContent = formatUSD(prices.listPrice);
    document.getElementById('modalIVAAmount').textContent = formatUSD(ivaAmount);
    document.getElementById('modalIVAInfo').textContent = `${prices.ivaRate}% del precio base`;

    // PRECIOS DE COSTOS (solo en modo interno)
    document.getElementById('modalPurchasePrice').textContent = formatUSD(prices.purchasePriceCash);

    // Calcular descuento total para contado
    let discountText = '';
    if (productData.category === 'gas-residencial') {
        discountText = `Precio especial × 0.8 + Contado 8%`;
    } else {
        discountText = `Bonificación ${prices.bonus}% + Contado ${prices.cashDiscount}%`;
    }
    document.getElementById('modalDiscountInfo').textContent = discountText;

    document.getElementById('modalProfitMargin').textContent = formatUSD(prices.profitMarginCash);
    document.getElementById('modalProfitPercent').textContent = `${prices.profitPercentCash.toFixed(1)}% de ganancia`;

    // Opciones de pago
    document.getElementById('modalCashPrice').innerHTML = `
        <strong>Compra:</strong> ${formatUSD(prices.purchasePriceCash)}<br>
        <strong>Venta:</strong> ${formatUSD(prices.salePriceCash)}<br>
        <strong>Ganancia:</strong> ${formatUSD(prices.profitMarginCash)}<br>
        <small>Bonif. ${prices.bonus}% + Contado ${prices.cashDiscount}%</small>
    `;

    document.getElementById('modalFinancedPrice').innerHTML = `
        <strong>Compra:</strong> ${formatUSD(prices.purchasePriceFinanced)}<br>
        <strong>Venta:</strong> ${formatUSD(prices.salePriceFinanced)}<br>
        <strong>Ganancia:</strong> ${formatUSD(prices.profitMarginFinanced)}<br>
        <small>Solo bonificación ${prices.bonus}%</small>
    `;

    // Especificaciones técnicas
    document.getElementById('modalIVAType').textContent = `${prices.ivaRate}%`;
    document.getElementById('modalDollarType').textContent = productData.dollarType || 'BNA';
    document.getElementById('modalFuelType').textContent = productData.fuel || 'N/A';
    document.getElementById('modalSoundproof').textContent = productData.soundproof || 'No';
    document.getElementById('modalCabin').textContent = productData.cabin || 'No';
    document.getElementById('modalControlPanel').textContent = productData.controlPanel || 'No';

    // Información adicional
    document.getElementById('modalAccessories').textContent = productData.accessories || 'No incluye';
    document.getElementById('modalWarranty').textContent = productData.warranty || 'Consultar';
    document.getElementById('modalFinancing').textContent = productData.financing || 'Consultar';
}

// ============================================
// INICIALIZAR PRODUCTOS CLICKEABLES
// ============================================

function initClickableProducts() {
    const clickableRows = document.querySelectorAll('.clickable-product');

    clickableRows.forEach(row => {
        row.addEventListener('click', function() {
            const productDataStr = this.getAttribute('data-product');
            if (productDataStr) {
                try {
                    const productData = JSON.parse(productDataStr);
                    fillModal(productData);
                    openModal();
                } catch (e) {
                    console.error('Error parseando datos del producto:', e);
                }
            }
        });
    });
}

// ============================================
// UTILIDADES
// ============================================

// Formatear precios
function formatUSD(price) {
    if (typeof price === 'string') {
        return price;
    }
    return `USD ${parseFloat(price).toLocaleString('es-AR', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    })}`;
}

// Resaltar precios especiales
function highlightSpecialPrices() {
    const priceCells = document.querySelectorAll('.price');

    priceCells.forEach(cell => {
        const text = cell.textContent;

        if (text.includes('Consultar') || text.includes('SIN STOCK') || text.includes('Proximamente')) {
            cell.style.color = '#e74c3c';
            cell.style.fontStyle = 'italic';
        }
    });
}

// Smooth scroll para enlaces internos
function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
}

// ============================================
// MODO IMPRESIÓN
// ============================================

// Detectar cuando se va a imprimir y ajustar el diseño
window.addEventListener('beforeprint', () => {
    // Mostrar todas las pestañas para impresión
    document.querySelectorAll('.tab-content').forEach(content => {
        content.style.display = 'block';
    });
    // Ocultar modal si está abierto
    if (modal.classList.contains('active')) {
        modal.style.display = 'none';
    }
});

window.addEventListener('afterprint', () => {
    // Restaurar solo la pestaña activa
    document.querySelectorAll('.tab-content').forEach(content => {
        if (!content.classList.contains('active')) {
            content.style.display = 'none';
        }
    });
    // Restaurar modal
    modal.style.display = '';
});

// ============================================
// INICIALIZACIÓN
// ============================================

// ============================================
// MODO INTERNO (TOGGLE)
// ============================================

function initInternalMode() {
    const toggle = document.getElementById('internalModeSwitch');

    // Cargar estado guardado
    const savedState = localStorage.getItem('internalMode');
    if (savedState === 'true') {
        toggle.checked = true;
        document.body.classList.add('internal-mode');
    }

    // Listener para cambios
    toggle.addEventListener('change', function() {
        if (this.checked) {
            document.body.classList.add('internal-mode');
            localStorage.setItem('internalMode', 'true');
        } else {
            document.body.classList.remove('internal-mode');
            localStorage.setItem('internalMode', 'false');
        }
    });
}

document.addEventListener('DOMContentLoaded', () => {
    // Inicializar fondo 360
    init360Background();

    // Inicializar sistema de pestañas
    initTabs();

    // Inicializar productos clickeables
    initClickableProducts();

    // Inicializar modo interno
    initInternalMode();

    // Resaltar precios especiales
    highlightSpecialPrices();

    // Inicializar smooth scroll
    initSmoothScroll();

    // Mensaje de bienvenida en consola
    console.log('%c¡Bienvenido a KOR Generadores en Línea!', 'color: #fd6600; font-size: 20px; font-weight: bold;');
    console.log('%cLista de Precios Mayorista DETALLADA #1083', 'color: #000; font-size: 14px;');
    console.log('%cwww.generadores.ar | Tel/WhatsApp: +54 11 3956-3099', 'color: #fd6600; font-size: 12px;');
    console.log('%cClick en cualquier producto para ver información comercial completa', 'color: #4CAF50; font-size: 12px;');
});

// ============================================
// EFECTOS ADICIONALES
// ============================================

// Efecto parallax para el header al hacer scroll
let lastScrollY = window.scrollY;

window.addEventListener('scroll', () => {
    const currentScrollY = window.scrollY;
    const header = document.querySelector('.header');

    if (header) {
        if (currentScrollY > lastScrollY && currentScrollY > 100) {
            // Scrolling down
            header.style.transform = 'translateY(-10px)';
            header.style.opacity = '0.95';
        } else {
            // Scrolling up
            header.style.transform = 'translateY(0)';
            header.style.opacity = '1';
        }
    }

    lastScrollY = currentScrollY;
});

// Animación de entrada para las tablas
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.opacity = '0';
            entry.target.style.transform = 'translateY(20px)';

            setTimeout(() => {
                entry.target.style.transition = 'all 0.6s ease';
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }, 100);

            observer.unobserve(entry.target);
        }
    });
}, observerOptions);

// Observar todas las tablas para animarlas
document.addEventListener('DOMContentLoaded', () => {
    const tables = document.querySelectorAll('.table-container');
    tables.forEach(table => observer.observe(table));
});
