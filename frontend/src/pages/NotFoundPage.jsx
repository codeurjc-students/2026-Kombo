import StatusPage from '../components/StatusPage';

export default function NotFoundPage() {
  return (
    <StatusPage
      code="404"
      title="Esta página no está en la carta"
      message="La dirección no existe o ha cambiado. Vuelve a la carta para seguir con tu pedido."
    />
  );
}
