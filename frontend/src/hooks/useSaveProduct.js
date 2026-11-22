import { useState } from 'react';
import { useNavigate } from 'react-router';
import { ApiError } from '../services/httpClient';
import { uploadProductImage } from '../services/productService';

// Saves a product or kombo and then, if a file was chosen, its picture. Then it goes back to the products with a
// message. If the picture fails, the product is already saved: it opens its edit page to try the picture again.
// editPath(id) is the edit page of the saved product.
export default function useSaveProduct(editPath) {
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  async function save(request, file) {
    setSaving(true);
    setError(null);
    let saved;
    try {
      saved = await request();
    } catch (err) {
      setError(saveErrorMessage(err));
      setSaving(false);
      return;
    }
    if (file) {
      try {
        await uploadProductImage(saved.id, file);
      } catch (err) {
        const reason = err instanceof ApiError && [400, 413].includes(err.status)
          ? 'el archivo no es una imagen válida de 10 MB como máximo'
          : 'no se ha podido subir';
        await navigate(editPath(saved.id), {
          replace: true,
          state: { message: `${saved.name} se ha guardado, pero la foto no: ${reason}.` },
        });
        setSaving(false);
        return;
      }
    }
    await navigate('/admin/products', { state: { message: `${saved.name} se ha guardado.` } });
  }

  return { save, saving, error };
}

function saveErrorMessage(error) {
  if (error instanceof ApiError && error.status === 400) {
    return 'Revisa los datos del formulario: hay algún campo que no es válido.';
  }
  if (error instanceof ApiError && error.status === 404) {
    return 'Este producto ya no existe.';
  }
  return 'No hemos podido guardar. Inténtalo de nuevo.';
}
