import { Button } from 'react-bootstrap';
import ProductList from '../components/ProductList';

export default function HomePage() {
  return (
    <>
      <header className="menu-hero">
        <div>
          <h1>Elige, combina y pide.</h1>
          <p>Hamburguesas, menús y bebidas recién hechos. Para comer aquí, para llevar o a domicilio.</p>
          <Button href="#carta" variant="light-on-orange" size="lg">
            Ver la carta
          </Button>
        </div>
        <div className="hero-badge" aria-hidden="true">
          <img src="/logo-icon.png" alt="" />
        </div>
      </header>
      <div id="carta">
        <ProductList />
      </div>
    </>
  );
}
