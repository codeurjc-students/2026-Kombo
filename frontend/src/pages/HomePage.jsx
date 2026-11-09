import ProductList from '../components/ProductList';

export default function HomePage() {
  return (
    <>
      <header className="menu-hero mb-4 mb-md-5">
        <h1 className="mb-3">Elige, combina y pide.</h1>
        <p className="mb-0">Hamburguesas, menús y bebidas recién hechos. Pide para comer aquí, para llevar o a domicilio.</p>
      </header>
      <ProductList />
    </>
  );
}
